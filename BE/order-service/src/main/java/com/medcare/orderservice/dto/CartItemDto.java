package com.medcare.orderservice.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDto {
    private Long medicineId;
    private String name;
    private String slug;
    private String imageUrl;
    private Integer quantity;
    private String unit; // Vỉ, Hộp, Viên
    private BigDecimal unitPrice;
    private BigDecimal originalPrice;
    private BigDecimal totalPrice;
    private Integer stockQuantity;
}
