package com.medcare.productservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "medicines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_sku", unique = true, length = 50)
    private String sourceSku;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(unique = true, length = 255)
    private String slug;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "registration_number", length = 50)
    private String registrationNumber;

    @Column(name = "requires_prescription")
    @Builder.Default
    private Boolean requiresPrescription = false;

    @Column(name = "packing_unit", length = 100)
    private String packingUnit;

    @Builder.Default
    private Boolean status = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToOne(mappedBy = "medicine", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private MedicineDetail detail;

    @OneToMany(mappedBy = "medicine", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<MedicinePrice> prices;

    @OneToMany(mappedBy = "medicine", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<MedicineImage> images;

    // Helper methods to avoid compilation errors in service
    public String getPrimaryImageUrl() {
        if (images == null || images.isEmpty()) return null;
        return images.stream()
                .filter(MedicineImage::getIsPrimary)
                .map(MedicineImage::getImageUrl)
                .findFirst()
                .orElse(images.get(0).getImageUrl());
    }

    public String getBrand() {
        return detail != null ? detail.getBrand() : null;
    }

    public String getCountryOfOrigin() {
        return detail != null ? detail.getCountryOfOrigin() : null;
    }
}


