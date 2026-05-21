package com.medcare.userservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PrescriptionStatus status = PrescriptionStatus.PENDING;

    @Column(name = "hospital_name")
    private String hospitalName;

    @Column(name = "clinic_name")
    private String clinicName;

    @Column(name = "doctor_name")
    private String doctorName;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "is_used")
    @Builder.Default
    private Boolean isUsed = false;

    @Column(name = "max_usage")
    @Builder.Default
    private Integer maxUsage = 1;

    @Column(name = "current_usage")
    @Builder.Default
    private Integer currentUsage = 0;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "pharmacist_note", columnDefinition = "TEXT")
    private String pharmacistNote;

    @Column(name = "extracted_data", columnDefinition = "TEXT")
    private String extractedData;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
