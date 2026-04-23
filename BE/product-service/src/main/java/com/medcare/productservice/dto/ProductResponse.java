package com.medcare.productservice.dto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long id;
    private String name;
    private String slug;
    private Long categoryId;
    private String categoryName;
    private String categorySlug;
    private Long parentCategoryId;
    private String parentCategoryName;
    private String parentCategorySlug;
    private String sourceSku;
    private String registrationNumber;
    private Boolean requiresPrescription;
    private String packingUnit;
    private Boolean status;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer discountPercentage;
    private Integer stockQuantity;

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
    private List<String> symptoms;

    private String primaryImageUrl;
    private List<ImageInfo> images;
    private LocalDateTime createdAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ImageInfo implements Serializable {
        private String imageUrl;
        private String publicId;
        private Boolean isPrimary;
    }
}
