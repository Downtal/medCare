package com.medcare.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockDeductRequest {
    private List<DeductItem> items;
    private String orderCode;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeductItem {
        private Long productId;
        private Integer quantity;
    }
}
