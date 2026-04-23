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
public class ShippingRequestDto {
    private String orderCode;
    private String toName;
    private String toPhone;
    private String toAddress;
    private String toWardCode;
    private Integer toDistrictId;
    private Integer codAmount;
    private Integer insuranceValue;
    private List<ShippingRequestItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ShippingRequestItemDto {
        private String name;
        private String code;
        private Integer quantity;
        private Integer price;
    }
}
