package com.medcare.promotionservice.controller;

import com.medcare.promotionservice.dto.VoucherApplyRequest;
import com.medcare.promotionservice.dto.VoucherApplyResponse;
import com.medcare.promotionservice.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping("/apply")
    public ResponseEntity<VoucherApplyResponse> applyVoucher(@RequestBody VoucherApplyRequest request) {
        try {
            VoucherApplyResponse response = promotionService.applyVoucher(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(VoucherApplyResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/record-usage")
    public ResponseEntity<?> recordUsage(
            @RequestParam String code,
            @RequestParam Long userId,
            @RequestParam Long orderId,
            @RequestParam java.math.BigDecimal amountSaved) {
        try {
            promotionService.recordUsageByCode(code, userId, orderId, amountSaved);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveVouchers() {
        return ResponseEntity.ok(promotionService.getAllVouchers().stream()
                .filter(v -> v.isActive() && (v.getEndAt() == null || v.getEndAt().isAfter(java.time.LocalDateTime.now())))
                .toList());
    }

    @PostMapping("/user/save")
    public ResponseEntity<?> saveVoucher(@RequestParam Long userId, @RequestParam String code) {
        try {
            promotionService.saveVoucherForUser(userId, code);
            return ResponseEntity.ok(java.util.Map.of("message", "Đã lưu mã giảm giá thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getSavedVouchers(@PathVariable Long userId) {
        return ResponseEntity.ok(promotionService.getSavedVouchers(userId));
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyVouchers(java.security.Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        try {
            Long userId = Long.valueOf(principal.getName());
            return ResponseEntity.ok(promotionService.getSavedVouchers(userId));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Invalid user ID in token");
        }
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllVouchers() {
        return ResponseEntity.ok(promotionService.getAllVouchers());
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createVoucher(@RequestBody com.medcare.promotionservice.entity.Voucher voucher) {
        return ResponseEntity.ok(promotionService.createVoucher(voucher));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateVoucher(@PathVariable Long id, @RequestBody com.medcare.promotionservice.entity.Voucher voucher) {
        return ResponseEntity.ok(promotionService.updateVoucher(id, voucher));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteVoucher(@PathVariable Long id) {
        promotionService.deleteVoucher(id);
        return ResponseEntity.ok("Voucher moved to trash");
    }

    @GetMapping("/admin/trash")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getTrashedVouchers() {
        return ResponseEntity.ok(promotionService.getTrashedVouchers());
    }

    @PostMapping("/admin/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> restoreVoucher(@PathVariable Long id) {
        promotionService.restoreVoucher(id);
        return ResponseEntity.ok("Voucher restored");
    }

    @DeleteMapping("/admin/{id}/hard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteHard(@PathVariable Long id) {
        promotionService.deleteHard(id);
        return ResponseEntity.ok("Voucher deleted permanently");
    }
}
