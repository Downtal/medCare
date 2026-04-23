package com.medcare.authservice.controller;

import com.medcare.authservice.dto.*;
import com.medcare.authservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/register
     * Body: { username, password, email?, phone? }
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * POST /api/auth/login
     * Body: { username, password }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * POST /api/auth/refresh
     * Body: { refreshToken }
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    /**
     * POST /api/auth/logout
     * Requires valid Bearer token in Authorization header.
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@AuthenticationPrincipal UserDetails userDetails) {
        authService.logout(userDetails.getUsername());
        return ResponseEntity.ok("Logged out successfully");
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                                 @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUsername(), request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok("Đổi mật khẩu thành công");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok("Mã OTP đã được gửi đến email của bạn.");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        authService.verifyOtp(email, otp);
        return ResponseEntity.ok("Mã OTP hợp lệ.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok("Mật khẩu đã được cập nhật thành công.");
    }

    @PostMapping("/verify-registration")
    public ResponseEntity<String> verifyRegistration(@RequestParam String email, @RequestParam String otp) {
        authService.verifyRegistrationOtp(email, otp);
        return ResponseEntity.ok("Tài khoản đã được xác thực thành công.");
    }

    @PostMapping("/resend-verification-otp")
    public ResponseEntity<String> resendVerification(@RequestParam String email) {
        authService.resendVerificationOtp(email);
        return ResponseEntity.ok("Mã xác thực mới đã được gửi vào email của bạn.");
    }
}
