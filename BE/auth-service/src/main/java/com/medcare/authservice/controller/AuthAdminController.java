package com.medcare.authservice.controller;

import com.medcare.authservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/admin")
@RequiredArgsConstructor
public class AuthAdminController {

    private final AuthService authService;

    @PutMapping("/users/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateRole(@PathVariable Long userId, @RequestParam String role) {
        authService.updateUserRole(userId, role);
        return ResponseEntity.ok("User role updated successfully");
    }

    @PutMapping("/users/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateStatus(@PathVariable Long userId, @RequestParam String status) {
        authService.updateUserStatus(userId, status);
        return ResponseEntity.ok("User status updated successfully");
    }

    @PostMapping("/users/{userId}/force-logout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> forceLogout(@PathVariable Long userId) {
        authService.forceLogout(userId);
        return ResponseEntity.ok("User has been forcefully logged out");
    }
}
