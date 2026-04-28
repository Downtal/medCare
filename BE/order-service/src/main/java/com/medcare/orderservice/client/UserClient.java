package com.medcare.orderservice.client;

import lombok.Builder;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import java.time.LocalDate;

@FeignClient(name = "user-service")
public interface UserClient {

    @GetMapping("/api/users/prescriptions/{id}")
    PrescriptionDto getPrescriptionById(@PathVariable("id") Long id);

    @PostMapping("/api/users/prescriptions/{id}/mark-as-used")
    void markPrescriptionAsUsed(@PathVariable("id") Long id);

    @PostMapping("/api/users/prescriptions/{id}/reset-usage")
    void resetPrescriptionUsage(@PathVariable("id") Long id);

    @Data
    @Builder
    class PrescriptionDto {
        private Long id;
        private Long userId;
        private String status;
        private LocalDate expiryDate;
        private Boolean isUsed;
    }
}
