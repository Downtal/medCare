package com.medcare.productservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {
    @NotBlank(message = "Tên thuốc không được để trống")
    private String name;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    private String sourceSku;
    private String registrationNumber;
    private Boolean requiresPrescription;
    private String packingUnit;

    @NotNull(message = "Giá không được để trống")
    @PositiveOrZero(message = "Giá phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    private String brand;
    private String manufacturer;
    private String countryOfOrigin;
    private String dosageForm;
    private String expiryDate;
    private String activeIngredients;
    private String description;
    private String indications;
    private String usageInstruction;
    private String contraindications;
    private String sideEffects;
    private String precautions;
    private String storageConditions;
    private java.util.List<String> symptoms;
    private BigDecimal originalPrice;
    private Integer discountPercentage;

    private String primaryImageUrl;
    private java.util.List<ProductImageRequest> images;

    // Initial Stock Info (Optional)
    @PositiveOrZero(message = "Số lượng nhập kho không được âm")
    private Integer initialQuantity;
    private String initialBatchNumber;
    private String initialExpiryDate;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProductImageRequest {
        private String imageUrl;
        private String publicId;
        private Boolean isPrimary;
    }
}
