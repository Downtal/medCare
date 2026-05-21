package com.medcare.promotionservice.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType;

    @Column(nullable = false)
    private BigDecimal discountValue;

    private BigDecimal maxDiscount; // For PERCENT type
    
    @Builder.Default
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    @Builder.Default
    private Integer usageLimit = 999999;
    
    @Builder.Default
    private Integer limitPerUser = 1;
    
    @Builder.Default
    private Integer usedCount = 0;

    @Builder.Default
    @JsonProperty("excludePrescriptionDrugs")
    private boolean excludePrescriptionDrugs = true;

    private LocalDateTime startAt;
    private LocalDateTime endAt;

    private Long applicableProductId;
    private Long applicableCategoryId;

    @Builder.Default
    @JsonProperty("isActive")
    private boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
