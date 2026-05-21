package com.medcare.orderservice.client;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDate;
import java.time.LocalDateTime;


@FeignClient(name = "user-service")
public interface UserClient {

    @GetMapping("/api/users/prescriptions/{id}")
    PrescriptionDto getPrescriptionById(@PathVariable("id") Long id);

    @PostMapping("/api/users/prescriptions/{id}/mark-as-used")
    void markPrescriptionAsUsed(@PathVariable("id") Long id);

    @PostMapping("/api/users/prescriptions/{id}/fulfill")
    void fulfillMedicines(@PathVariable("id") Long id, @RequestBody java.util.List<Long> productIds);
    
    @PostMapping("/api/users/prescriptions/{id}/unfulfill")
    void unfulfillMedicines(@PathVariable("id") Long id, @RequestBody java.util.List<Long> productIds);

    @PostMapping("/api/users/prescriptions/{id}/reset-usage")
    void resetPrescriptionUsage(@PathVariable("id") Long id);

    @PostMapping("/api/users/prescriptions/{id}/update-extracted-data")
    void updateExtractedData(@PathVariable("id") Long id, @RequestBody String extractedData);

    @Data
    @Builder
    @NoArgsConstructor
    @lombok.AllArgsConstructor
    class PrescriptionDto {
        private Long id;
        private Long userId;
        private String status;
        private LocalDate expiryDate;
        private Boolean isUsed;
        private LocalDateTime approvedAt;
        private String extractedData;
    }
}
