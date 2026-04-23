package com.medcare.productservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductCreatedEvent {
    private Long medicineId;
    private String name;
    private String medicineSlug;
    private String medicineImage;
    private String brand;
    private String registrationNumber;
    private String countryOfOrigin;
    private Integer initialQuantity;
    private String initialBatchNumber;
    private String initialExpiryDate;
}
