package com.medcare.authservice.service;

import com.medcare.authservice.dto.*;

public interface AuthService {

    /** Register a new user and return tokens */
    AuthResponse register(RegisterRequest request);

    /** Login with username/password and return tokens */
    AuthResponse login(LoginRequest request);

    /** Issue new access token using a valid refresh token */
    AuthResponse refreshToken(RefreshTokenRequest request);

    /** Revoke all refresh tokens for the current user */
    void logout(String username);

    void changePassword(String username, String oldPassword, String newPassword);

    // Password reset flow
    void forgotPassword(String email);
    void verifyOtp(String email, String otp);
    void resetPassword(String email, String otp, String newPassword);

    // Registration verification flow
    void verifyRegistrationOtp(String email, String otp);
    void resendVerificationOtp(String email);

    // Admin operations
    void updateUserRole(Long userId, String role);
    void updateUserStatus(Long userId, String status);
    void forceLogout(Long userId);
}
