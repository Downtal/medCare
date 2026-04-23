package com.medcare.reviewservice.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {
    private Long id;
    private Long productId;
    private String productSlug;
    private String productName;
    private String productImage;
    private String brand;
    private String registrationNumber;
    private String countryOfOrigin;
    private Integer editCount;
    private Long userId;
    private String guestName;
    private String phoneNumber;
    private String email;
    private Integer rating;
    private String comment;
    private Boolean isApproved;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private List<ReplyResponse> replies;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReplyResponse {
        private Long id;
        private Long staffId;
        private String staffName;
        private String staffRole;
        private String content;
        private LocalDateTime createdAt;
    }
}
