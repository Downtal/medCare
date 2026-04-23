package com.medcare.orderservice.dto;

import lombok.Data;

@Data
public class CartItemRequest {
    private Long medicineId;
    private Integer quantity;
}
