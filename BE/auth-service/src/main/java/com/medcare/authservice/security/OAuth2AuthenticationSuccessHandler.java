package com.medcare.authservice.security;

import com.medcare.authservice.entity.UserRole;
import com.medcare.authservice.entity.User;
import com.medcare.authservice.repository.UserRepository;
import com.medcare.authservice.security.AuthJwtService;
import com.medcare.authservice.entity.RefreshToken;
import com.medcare.authservice.repository.RefreshTokenRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import com.medcare.authservice.client.UserClient;
import com.medcare.authservice.dto.UserProfileRequest;
import org.springframework.web.util.UriComponentsBuilder;
import java.time.LocalDateTime;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthJwtService jwtService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserClient userClient;

    @Value("${application.security.jwt.refresh-token.expiration}")
    private long refreshTokenExpiration;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getEmail();
        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Update provider if needed
            if (user.getProvider() == null) {
                user.setProvider(oAuth2User.getProvider());
                user.setProviderId(oAuth2User.getProviderId());
                userRepository.save(user);
            }
        } else {
            // Register new user
            user = new User();
            user.setEmail(email);
            user.setUsername(email); // username is required and must be unique
            // Default password for oauth2 users (should not be used to login normally)
            user.setPasswordHash(""); 
            user.setRole(UserRole.USER);
            user.setProvider(oAuth2User.getProvider());
            user.setProviderId(oAuth2User.getProviderId());
            user.setStatus(com.medcare.authservice.entity.UserStatus.ACTIVE);
            user.setCreatedAt(LocalDateTime.now());
            user = userRepository.save(user);

            // SYNC: Create user profile in user-service via Feign
            try {
                UserProfileRequest profileRequest = UserProfileRequest.builder()
                        .userId(user.getId())
                        .fullName(oAuth2User.getDisplayName() != null ? oAuth2User.getDisplayName() : email)
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .status(user.getStatus().name())
                        .build();
                userClient.createProfile(profileRequest);
            } catch (Exception e) {
                log.error("Failed to sync new OAuth2 user to user-service: {}", e.getMessage());
            }
        }

        if (user.getStatus() == com.medcare.authservice.entity.UserStatus.BANNED) {
            // User is blocked
            getRedirectStrategy().sendRedirect(request, response, "http://localhost:3000/dang-nhap?error=ACCOUNT_BLOCKED");
            return;
        }

        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        if (user.getProvider() != null) {
            claims.put("provider", user.getProvider().name());
        }
        String accessToken = jwtService.generateToken(claims, user);
        
        String refreshTokenString = java.util.UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenString)
                .userId(user.getId())
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiration / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        // Redirect to Next.js frontend with tokens in URL
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/dang-nhap")
                .queryParam("token", accessToken)
                .queryParam("refresh_token", refreshTokenString)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
