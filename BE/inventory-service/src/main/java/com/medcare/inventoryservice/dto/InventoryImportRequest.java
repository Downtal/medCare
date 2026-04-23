package com.medcare.inventoryservice.dto;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InventoryImportRequest {
    private Long medicineId;
    private String medicineName;
    private String medicineSlug;
    private String medicineImage;
    private String brand;
    private String registrationNumber;
    private String countryOfOrigin;
    private Long warehouseId;
    private String batchNumber;
    private LocalDate expiryDate;
    private Integer quantity;
    private String notes;
}
