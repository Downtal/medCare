package com.medcare.reviewservice.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductReviewSummary {
    private Long productId;
    private String productName;
    private String productSlug;
    private String productImage;
    private String brand;
    private String registrationNumber;
    private String countryOfOrigin;
    private Long totalReviews;
    private Double averageRating;
    private Long unrepliedCount;
}
