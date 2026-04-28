package com.medcare.userservice.controller;

import com.medcare.userservice.dto.*;
import com.medcare.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Current User (me) endpoints ──

    @GetMapping("/profiles/me")
    public ResponseEntity<UserProfileDto> getMyProfile(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userService.getProfileByUserId(Long.valueOf(userId)));
    }

    @PutMapping("/profiles/me")
    public ResponseEntity<UserProfileDto> updateMyProfile(@AuthenticationPrincipal String userId,
                                                        @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(Long.valueOf(userId), request));
    }

    @PostMapping("/profiles/me/addresses")
    public ResponseEntity<AddressDto> addMyAddress(@AuthenticationPrincipal String userId,
                                                @Valid @RequestBody CreateAddressRequest request) {
        return new ResponseEntity<>(userService.addAddress(Long.valueOf(userId), request), HttpStatus.CREATED);
    }

    @GetMapping("/profiles/me/addresses")
    public ResponseEntity<List<AddressDto>> getMyAddresses(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userService.getUserAddresses(Long.valueOf(userId)));
    }

    @GetMapping("/profiles/me/health-notes")
    public ResponseEntity<UserHealthNoteDto> getMyHealthNote(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userService.getHealthNote(Long.valueOf(userId)));
    }

    @PutMapping("/profiles/me/health-notes")
    public ResponseEntity<UserHealthNoteDto> updateMyHealthNote(@AuthenticationPrincipal String userId,
                                                               @Valid @RequestBody UpdateHealthNoteRequest request) {
        return ResponseEntity.ok(userService.updateHealthNote(Long.valueOf(userId), request));
    }

    @GetMapping("/profiles/me/metrics")
    public ResponseEntity<List<HealthMetricDto>> getMyHealthMetrics(@AuthenticationPrincipal String userId,
                                                                  @RequestParam(required = false) String type) {
        return ResponseEntity.ok(userService.getHealthMetrics(Long.valueOf(userId), type));
    }

    @PostMapping("/profiles/me/metrics")
    public ResponseEntity<HealthMetricDto> addMyHealthMetric(@AuthenticationPrincipal String userId,
                                                           @Valid @RequestBody CreateMetricRequest request) {
        return new ResponseEntity<>(userService.addHealthMetric(Long.valueOf(userId), request), HttpStatus.CREATED);
    }

    // ── Profile endpoints (Admin restricted) ──

    /**
     * POST /api/users/profiles
     * Called internally by auth-service via OpenFeign during registration.
     */
    @PostMapping("/profiles")
    public ResponseEntity<UserProfileDto> createProfile(@Valid @RequestBody CreateProfileRequest request) {
        return new ResponseEntity<>(userService.createProfile(request), HttpStatus.CREATED);
    }

    @GetMapping("/profiles/{userId}")
    public ResponseEntity<UserProfileDto> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getProfileByUserId(userId));
    }

    @GetMapping("/profiles/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileDto> getProfileByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getProfileByEmail(email));
    }

    @GetMapping("/profiles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserProfileDto>> getAllProfiles() {
        return ResponseEntity.ok(userService.getAllProfiles());
    }

    @PutMapping("/profiles/{userId}")
    public ResponseEntity<UserProfileDto> updateProfile(@PathVariable Long userId,
                                                        @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    @DeleteMapping("/profiles/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteProfile(@PathVariable Long userId) {
        userService.deleteProfile(userId);
        return ResponseEntity.ok("Profile moved to trash!");
    }

    @GetMapping("/profiles/trash")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserProfileDto>> getTrashedProfiles() {
        return ResponseEntity.ok(userService.getTrashedProfiles());
    }

    @PostMapping("/profiles/{userId}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> restoreProfile(@PathVariable Long userId) {
        userService.restoreProfile(userId);
        return ResponseEntity.ok("Profile restored successfully!");
    }

    @DeleteMapping("/profiles/{userId}/hard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> hardDeleteProfile(@PathVariable Long userId) {
        userService.hardDeleteProfile(userId);
        return ResponseEntity.ok("Profile deleted permanently!");
    }

    @GetMapping("/profiles/{userId}/health-notes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserHealthNoteDto> getUserHealthNote(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getHealthNote(userId));
    }

    // ── Address endpoints ──

    @GetMapping("/addresses/{addressId}")
    public ResponseEntity<AddressDto> getAddressById(@PathVariable Long addressId) {
        return ResponseEntity.ok(userService.getAddressById(addressId));
    }

    @DeleteMapping("/addresses/{addressId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<String> deleteAddress(@PathVariable Long addressId,
                                              @AuthenticationPrincipal String authenticatedUserId) {
        userService.deleteAddress(addressId, Long.valueOf(authenticatedUserId));
        return ResponseEntity.ok("Address deleted successfully!");
    }

    @PutMapping("/addresses/{addressId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<AddressDto> updateAddress(@PathVariable Long addressId,
                                                  @AuthenticationPrincipal String authenticatedUserId,
                                                  @Valid @RequestBody CreateAddressRequest request) {
        return ResponseEntity.ok(userService.updateAddress(addressId, Long.valueOf(authenticatedUserId), request));
    }
}
