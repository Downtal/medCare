package com.medcare.shippingservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class GHNCreateOrderResponse {
    private Integer code;
    private String message;
    private Data data;

    @lombok.Data
    public static class Data {
        @JsonProperty("order_code")
        private String orderCode;

        @JsonProperty("expected_delivery_time")
        private String expectedDeliveryTime;

        @JsonProperty("total_fee")
        private Integer totalFee;
    }
}
