package com.medcare.authservice.service.impl;

import com.medcare.authservice.dto.*;
import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;
import com.medcare.authservice.entity.RefreshToken;
import com.medcare.authservice.entity.User;
import com.medcare.authservice.entity.UserRole;
import com.medcare.authservice.entity.UserStatus;
import com.medcare.authservice.repository.RefreshTokenRepository;
import com.medcare.authservice.repository.UserRepository;
import com.medcare.authservice.security.JwtService;

import com.medcare.authservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final com.medcare.authservice.client.UserClient userClient;
    private final com.medcare.authservice.service.MailService mailService;
    private final com.medcare.authservice.repository.OtpVerificationRepository otpVerificationRepository;

    @Value("${application.security.jwt.refresh-token.expiration}")
    private long refreshTokenExpiration; // ms

    private static final int REFRESH_GRACE_PERIOD_SECONDS = 300;

    // ──────────────────────────── Register ────────────────────────────────

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại");
        }
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Số điện thoại đã tồn tại");
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(UserRole.USER)
                .status(UserStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        // 2. Generate and Send Registration OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        otpVerificationRepository.deleteByEmailAndType(request.getEmail(),
                com.medcare.authservice.entity.OtpVerification.OtpType.REGISTRATION);
        com.medcare.authservice.entity.OtpVerification otpEntity = com.medcare.authservice.entity.OtpVerification
                .builder()
                .email(request.getEmail())
                .otpCode(otp)
                .type(com.medcare.authservice.entity.OtpVerification.OtpType.REGISTRATION)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .build();
        otpVerificationRepository.save(otpEntity);
        mailService.sendRegistrationOtpEmail(request.getEmail(), otp);

        // SYNC: Create user profile in user-service via Feign
        try {
            com.medcare.authservice.dto.UserProfileRequest profileRequest = com.medcare.authservice.dto.UserProfileRequest
                    .builder()
                    .userId(user.getId())
                    .fullName(request.getFullName())
                    .username(user.getUsername())
                    .email(request.getEmail())
                    .phone(request.getPhone())
                    .role(user.getRole().name())
                    .status(user.getStatus().name())
                    .build();
            userClient.createProfile(profileRequest);
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể tạo hồ sơ người dùng trong user-service: " + e.getMessage());
        }

        return AuthResponse.builder()
                .username(user.getUsername())
                .userId(user.getId())
                .fullName(request.getFullName())
                .role(user.getRole().name())
                .build();
    }

    // ──────────────────────────── Login ───────────────────────────────────

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByIdentifier(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));

        if (user.getStatus() == UserStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Tài khoản (" + user.getEmail() + ") chưa được xác thực. Vui lòng kiểm tra email.");
        }
        if (user.getStatus() == UserStatus.BANNED) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword()));

        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        String accessToken = jwtService.generateToken(claims, user);
        String refreshToken = createRefreshToken(user.getId());

        return buildAuthResponse(accessToken, refreshToken, user);
    }

    // ──────────────────────── Refresh Token ───────────────────────────────

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new IllegalStateException("Mã làm mới (Refresh token) không tồn tại"));

        if (storedToken.getRevoked()) {
            // Grace Period: Nếu bị thu hồi trong vòng 60 giây qua, có thể là Race Condition
            if (storedToken.getRevokedAt() != null &&
                    storedToken.getRevokedAt().isAfter(LocalDateTime.now().minusSeconds(REFRESH_GRACE_PERIOD_SECONDS))) {
                // Cho phép làm mới thêm một lần nữa để tránh lỗi ở Frontend
                System.out.println("Grace period triggered for token: " + request.getRefreshToken().substring(0, 8));
                
                // CRITICAL: Trả về một token mới nhưng KHÔNG cập nhật lại revokedAt của token cũ
                // để tránh reset lại đồng hồ của grace period.
                return issueNewTokensForUser(storedToken.getUserId());
            } else {
                throw new IllegalStateException("Mã làm mới đã bị thu hồi hoặc sử dụng lại trái phép");
            }
        }

        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Mã làm mới đã hết hạn");
        }

        // Rotate: revoke old, issue new
        storedToken.setRevoked(true);
        storedToken.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(storedToken);

        return issueNewTokensForUser(storedToken.getUserId());
    }

    /**
     * Helper to centralize new token issuance
     */
    private AuthResponse issueNewTokensForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy người dùng"));

        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        String newAccessToken = jwtService.generateToken(claims, user);
        String newRefreshToken = createRefreshToken(user.getId());

        return buildAuthResponse(newAccessToken, newRefreshToken, user);
    }

    // ──────────────────────────── Logout ──────────────────────────────────

    @Override
    @Transactional
    public void logout(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy người dùng"));
        refreshTokenRepository.deleteByUserId(user.getId());
    }

    // ───────────────────────── private helpers ────────────────────────────

    private String createRefreshToken(Long userId) {
        // NOTE: Chúng ta không xóa tất cả các token cũ ở đây nữa để tránh Race
        // Condition
        // Thay vào đó chỉ cần để chúng hết hạn hoặc thu hồi khi rotate.
        // Chỉ xóa khi logout thực sự hoặc định kì.

        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .userId(userId)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiration / 1000))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken).getToken();
    }

    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, User user) {
        String fullName = null;
        try {
            com.medcare.authservice.dto.UserProfileResponse profile = userClient.getProfile(user.getId());
            if (profile != null) {
                fullName = profile.getFullName();
            }
        } catch (Exception e) {
            System.err.println("Could not fetch profile for user " + user.getId() + ": " + e.getMessage());
        }

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getJwtExpiration() / 1000)
                .username(user.getUsername())
                .userId(user.getId())
                .fullName(fullName)
                .role(user.getRole().name())
                .phone(user.getPhone())
                .build();
    }

    @Override
    @Transactional
    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng: " + username));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu cũ không chính xác");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        if (!userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email không tồn tại trong hệ thống");
        }
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        otpVerificationRepository.deleteByEmailAndType(email,
                com.medcare.authservice.entity.OtpVerification.OtpType.PASSWORD_RESET);
        com.medcare.authservice.entity.OtpVerification otpEntity = com.medcare.authservice.entity.OtpVerification
                .builder()
                .email(email)
                .otpCode(otp)
                .type(com.medcare.authservice.entity.OtpVerification.OtpType.PASSWORD_RESET)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .build();
        otpVerificationRepository.save(otpEntity);
        mailService.sendOtpEmail(email, otp);
    }

    @Override
    public void verifyOtp(String email, String otp) {
        com.medcare.authservice.entity.OtpVerification otpEntity = otpVerificationRepository
                .findByEmailAndOtpCodeAndType(email, otp,
                        com.medcare.authservice.entity.OtpVerification.OtpType.PASSWORD_RESET)
                .orElseThrow(() -> new IllegalArgumentException("Mã OTP không chính xác"));

        if (otpEntity.getUsed()) {
            throw new IllegalArgumentException("Mã OTP đã được sử dụng");
        }
        if (otpEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã OTP đã hết hạn");
        }
    }

    @Override
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        verifyOtp(email, otp);
        com.medcare.authservice.entity.OtpVerification otpEntity = otpVerificationRepository
                .findByEmailAndOtpCodeAndType(email, otp,
                        com.medcare.authservice.entity.OtpVerification.OtpType.PASSWORD_RESET)
                .get();
        otpEntity.setUsed(true);
        otpVerificationRepository.save(otpEntity);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void verifyRegistrationOtp(String email, String otp) {
        com.medcare.authservice.entity.OtpVerification otpEntity = otpVerificationRepository
                .findByEmailAndOtpCodeAndType(email, otp,
                        com.medcare.authservice.entity.OtpVerification.OtpType.REGISTRATION)
                .orElseThrow(() -> new IllegalArgumentException("Mã xác thực không chính xác"));

        if (otpEntity.getUsed()) {
            throw new IllegalArgumentException("Mã xác thực đã được sử dụng");
        }
        if (otpEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Mã xác thực đã hết hạn");
        }

        otpEntity.setUsed(true);
        otpVerificationRepository.save(otpEntity);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng cho email này"));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        // SYNC: Update status in user-service
        syncUserProfile(user.getId(), null, UserStatus.ACTIVE.name());
    }

    @Override
    @Transactional
    public void resendVerificationOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại trong hệ thống"));

        if (user.getStatus() != UserStatus.PENDING) {
            throw new IllegalArgumentException("Tài khoản này đã được xác thực hoặc đang bị khóa.");
        }

        otpVerificationRepository
                .findByEmailAndType(email, com.medcare.authservice.entity.OtpVerification.OtpType.REGISTRATION)
                .ifPresent(existing -> {
                    if (existing.getExpiresAt().minusMinutes(4).isAfter(LocalDateTime.now())) {
                        throw new IllegalArgumentException("Vui lòng đợi 1 phút trước khi gửi lại mã mới.");
                    }
                });

        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        otpVerificationRepository.deleteByEmailAndType(email,
                com.medcare.authservice.entity.OtpVerification.OtpType.REGISTRATION);
        com.medcare.authservice.entity.OtpVerification otpEntity = com.medcare.authservice.entity.OtpVerification
                .builder()
                .email(email)
                .otpCode(otp)
                .type(com.medcare.authservice.entity.OtpVerification.OtpType.REGISTRATION)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .build();
        otpVerificationRepository.save(otpEntity);
        mailService.sendRegistrationOtpEmail(email, otp);
    }

    @Override
    @Transactional
    public void updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        user.setRole(UserRole.valueOf(role));

        userRepository.save(user);

        // SYNC: Update role in user-service
        syncUserProfile(userId, role, null);

        // Also revoke refresh tokens so the client must login again
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Override
    @Transactional
    public void updateUserStatus(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        user.setStatus(UserStatus.valueOf(status));

        userRepository.save(user);

        // SYNC: Update status in user-service
        syncUserProfile(userId, null, status);

        if (UserStatus.BANNED.name().equals(status) || UserStatus.PENDING.name().equals(status)) {
            refreshTokenRepository.deleteByUserId(userId);
        }
    }

    /**
     * Helper method to sync Role/Status to user-service.
     */
    private void syncUserProfile(Long userId, String newRole, String newStatus) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null)
                return;

            com.medcare.authservice.dto.UserProfileResponse profile = userClient.getProfile(userId);
            if (profile != null) {
                com.medcare.authservice.dto.UserProfileRequest request = com.medcare.authservice.dto.UserProfileRequest
                        .builder()
                        .userId(userId)
                        .fullName(profile.getFullName())
                        .email(profile.getEmail())
                        .phone(user.getPhone())
                        .role(newRole != null ? newRole : user.getRole().name())
                        .status(newStatus != null ? newStatus : user.getStatus().name())
                        .build();
                userClient.updateProfile(userId, request);
            }
        } catch (Exception e) {
            System.err.println("Failed to sync profile to user-service for user " + userId + ": " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void forceLogout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
}
