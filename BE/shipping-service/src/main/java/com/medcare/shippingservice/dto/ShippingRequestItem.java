package com.medcare.shippingservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingRequestItem {
    private String name;
    private String code;
    private Integer quantity;
    private Integer price;
}
