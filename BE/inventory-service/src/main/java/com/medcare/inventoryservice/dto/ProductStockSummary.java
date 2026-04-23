package com.medcare.inventoryservice.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductStockSummary {
    private Long medicineId;
    private String medicineName;
    private String medicineSlug;
    private String medicineImage;
    private String brand;
    private String registrationNumber;
    private String countryOfOrigin;
    private Long totalQuantity;
    private Long totalReserved;
    private Long batchCount;
}
