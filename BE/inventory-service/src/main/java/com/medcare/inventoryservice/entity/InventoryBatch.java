package com.medcare.inventoryservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "medicine_id", nullable = false)
    private Long medicineId;

    @Column(name = "medicine_name")
    private String medicineName;

    @Column(name = "medicine_slug")
    private String medicineSlug;

    @Column(name = "medicine_image")
    private String medicineImage;

    @Column(name = "brand")
    private String brand;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "country_of_origin")
    private String countryOfOrigin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "batch_number", nullable = false, length = 50)
    private String batchNumber;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "quantity_available")
    private Integer quantityAvailable;

    @Column(name = "quantity_reserved")
    private Integer quantityReserved;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private BatchStatus status;

    public enum BatchStatus {
        ACTIVE, QUARANTINE, EXPIRED, RECALLED
    }

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
