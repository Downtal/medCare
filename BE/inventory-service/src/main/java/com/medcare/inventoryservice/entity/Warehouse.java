package com.medcare.inventoryservice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "warehouses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Warehouse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Builder.Default
    private Boolean status = true;

    @Column(name = "deleted_at")
    private java.time.LocalDateTime deletedAt;

    @OneToMany(mappedBy = "warehouse", cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<InventoryBatch> batches;
}
