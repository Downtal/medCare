package com.medcare.shippingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingRequest {
    private String orderCode;
    private String toName;
    private String toPhone;
    private String toAddress;
    private String toWardCode;
    private Integer toDistrictId;
    private Integer codAmount;
    private Integer insuranceValue;
    private List<ShippingRequestItem> items;
}
