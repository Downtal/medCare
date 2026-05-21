package com.medcare.promotionservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherApplyRequest {
    private String code;
    private Long userId;
    private List<OrderItemDto> items;
    private BigDecimal shippingFee;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDto {
        private Long productId;
        private Long categoryId;
        private BigDecimal price;
        private int quantity;
        private boolean isPrescription;
    }
}
