package com.medcare.orderservice.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartDto {
    private String cartId;
    @Builder.Default
    private List<CartItemDto> items = new ArrayList<>();
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;
    @Builder.Default
    private BigDecimal finalAmount = BigDecimal.ZERO;
}
