package com.medcare.reviewservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ReviewRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotBlank(message = "Product slug is required")
    private String productSlug;

    private String productName;
    private String productImage;
    private String brand;
    private String registrationNumber;
    private String countryOfOrigin;

    private Long userId;

    @NotBlank(message = "Tên là bắt buộc")
    private String guestName;

    @Pattern(regexp = "^(0|84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại không hợp lệ")
    private String phoneNumber;

    @Email(message = "Email không hợp lệ")
    private String email;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;

    @NotBlank(message = "Comment cannot be empty")
    @Size(max = 1000, message = "Comment cannot exceed 1000 characters")
    private String comment;
}
