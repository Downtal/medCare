package com.medcare.userservice.controller;

import com.medcare.userservice.dto.PrescriptionResponse;
import com.medcare.userservice.entity.PrescriptionStatus;
import com.medcare.userservice.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/users/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping("/upload")
    public ResponseEntity<PrescriptionResponse> uploadPrescription(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestParam("file") MultipartFile file) {
        
        if (userId == null) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof String) {
                userId = Long.valueOf((String) auth.getPrincipal());
            } else {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
            }
        }
        
        try {
            return ResponseEntity.ok(prescriptionService.uploadPrescription(userId, file));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<List<PrescriptionResponse>> getMyPrescriptions(
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        
        if (userId == null) {
            // Fallback to SecurityContext if Gateway didn't pass the header
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof String) {
                userId = Long.valueOf((String) auth.getPrincipal());
            } else {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
            }
        }
        
        return ResponseEntity.ok(prescriptionService.getUserPrescriptions(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrescriptionResponse> getById(
            @RequestHeader(value = "X-User-Id", required = false) Long requesterId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionById(id, requesterId, role));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PrescriptionResponse> updateStatus(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id,
            @RequestParam PrescriptionStatus status,
            @RequestParam(required = false) String note) {
        if (!"PHARMACIST".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(prescriptionService.updateStatus(id, status, note));
    }

    @PostMapping("/{id}/mark-as-used")
    public ResponseEntity<PrescriptionResponse> markAsUsed(@PathVariable Long id) {
        return ResponseEntity.ok(prescriptionService.markAsUsed(id));
    }

    @PostMapping("/{id}/analyze")
    public ResponseEntity<PrescriptionResponse> analyze(@PathVariable Long id) {
        return ResponseEntity.ok(prescriptionService.analyzePrescription(id));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PrescriptionResponse>> getPending(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!"PHARMACIST".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(prescriptionService.getPendingPrescriptions());
    }

    @PostMapping("/{id}/reset-usage")
    public ResponseEntity<PrescriptionResponse> resetUsage(@PathVariable Long id) {
        return ResponseEntity.ok(prescriptionService.resetUsage(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/all")
    public ResponseEntity<List<PrescriptionResponse>> getAll(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!"PHARMACIST".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(prescriptionService.getUserPrescriptions(null)); // null userId means all for now if service supports it
    }
}
