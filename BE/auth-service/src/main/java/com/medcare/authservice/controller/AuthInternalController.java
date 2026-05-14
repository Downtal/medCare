package com.medcare.authservice.controller;

import com.medcare.authservice.dto.AuthInternalRequest;
import com.medcare.authservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/internal")
@RequiredArgsConstructor
public class AuthInternalController {

    private final AuthService authService;

    @PutMapping("/users/{userId}/credentials")
    public ResponseEntity<Void> updateCredentials(
            @PathVariable Long userId,
            @RequestBody AuthInternalRequest request) {
        authService.updateCredentials(userId, request);
        return ResponseEntity.ok().build();
    }
}
