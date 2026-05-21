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
        
        // Fallback if headers are missing (e.g. direct Feign call with Authorization only)
        if (requesterId == null || role == null) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                if (requesterId == null && auth.getPrincipal() instanceof String) {
                    try { requesterId = Long.valueOf((String) auth.getPrincipal()); } catch (Exception ignored) {}
                }
                if (role == null && auth.getAuthorities() != null) {
                    role = auth.getAuthorities().stream()
                            .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                            .filter(a -> a.startsWith("ROLE_") || a.equals("ADMIN") || a.equals("PHARMACIST") || a.equals("USER"))
                            .map(a -> a.replace("ROLE_", ""))
                            .findFirst()
                            .orElse(null);
                }
            }
        }
        
        return ResponseEntity.ok(prescriptionService.getPrescriptionById(id, requesterId, role));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PrescriptionResponse> updateStatus(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id,
            @RequestParam PrescriptionStatus status,
            @RequestParam(required = false) String note) {
        
        // Fallback check
        if (role == null || role.isBlank()) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getAuthorities() != null) {
                boolean isAdminOrPharmacist = auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_PHARMACIST"));
                if (isAdminOrPharmacist) {
                    return ResponseEntity.ok(prescriptionService.updateStatus(id, status, note));
                }
            }
        }

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

    @PostMapping("/{id}/update-extracted-data")
    public ResponseEntity<PrescriptionResponse> updateExtractedData(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id,
            @RequestBody String extractedData) {
        
        // Fallback check
        if (role == null || role.isBlank()) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getAuthorities() != null) {
                boolean isAdminOrPharmacist = auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_PHARMACIST"));
                if (isAdminOrPharmacist) {
                    return ResponseEntity.ok(prescriptionService.updateExtractedData(id, extractedData));
                }
            }
        }

        if (!"PHARMACIST".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(prescriptionService.updateExtractedData(id, extractedData));
    }

    /**
     * Called by Order Service after successful payment.
     * Marks specific products as purchased so they cannot be re-bought.
     */
    @PostMapping("/{id}/fulfill")
    public ResponseEntity<PrescriptionResponse> fulfillMedicines(
            @PathVariable Long id,
            @RequestBody java.util.List<Long> purchasedProductIds) {
        return ResponseEntity.ok(prescriptionService.fulfillMedicine(id, purchasedProductIds));
    }

    @PostMapping("/{id}/unfulfill")
    public ResponseEntity<PrescriptionResponse> unfulfillMedicines(
            @PathVariable Long id,
            @RequestBody java.util.List<Long> cancelledProductIds) {
        return ResponseEntity.ok(prescriptionService.unfulfillMedicine(id, cancelledProductIds));
    }

    /**
     * Called by Frontend before adding a prescription item to cart.
     * Returns 200 with null body if valid, or 200 with error message if blocked.
     */
    @GetMapping("/{id}/validate")
    public ResponseEntity<String> validateMedicineForCart(
            @PathVariable Long id,
            @RequestParam Long productId) {
        String error = prescriptionService.validateMedicineForCart(id, productId);
        if (error != null) {
            return ResponseEntity.badRequest().body(error);
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/all")
    public ResponseEntity<List<PrescriptionResponse>> getAll(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        
        // Fallback to SecurityContext if header is missing
        if (role == null || role.isBlank()) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getAuthorities() != null) {
                boolean isAdminOrPharmacist = auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_PHARMACIST"));
                if (isAdminOrPharmacist) {
                    return ResponseEntity.ok(prescriptionService.getAllPrescriptions());
                }
            }
        }

        if (!"PHARMACIST".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(prescriptionService.getAllPrescriptions());
    }

    @PutMapping("/{id}/info")
    public ResponseEntity<PrescriptionResponse> updateInfo(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id,
            @RequestParam(required = false) String hospitalName,
            @RequestParam(required = false) String doctorName,
            @RequestParam(required = false) String expiryDate) {
        
        // Fallback check
        if (role == null || role.isBlank()) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getAuthorities() != null) {
                boolean isAdminOrPharmacist = auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_PHARMACIST"));
                if (isAdminOrPharmacist) {
                    return ResponseEntity.ok(prescriptionService.updatePrescriptionInfo(id, hospitalName, doctorName, expiryDate));
                }
            }
        }

        if (!"PHARMACIST".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(prescriptionService.updatePrescriptionInfo(id, hospitalName, doctorName, expiryDate));
    }
}
