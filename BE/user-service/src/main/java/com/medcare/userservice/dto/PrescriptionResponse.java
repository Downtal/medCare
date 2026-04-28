package com.medcare.userservice.dto;

import com.medcare.userservice.entity.PrescriptionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class PrescriptionResponse {
    private Long id;
    private Long userId;
    private String imageUrl;
    private PrescriptionStatus status;
    private String hospitalName;
    private String clinicName;
    private String doctorName;
    private LocalDate expiryDate;
    private Boolean isUsed;
    private String pharmacistNote;
    private String extractedData;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
