package com.medcare.shippingservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GHNCreateOrderRequest {
    @JsonProperty("payment_type_id")
    private Integer paymentTypeId; // 1: Shop trả, 2: Khách trả

    @JsonProperty("note")
    private String note;

    @JsonProperty("required_note")
    private String requiredNote; // KHONGCHOXEMHANG, CHOXEMHANGKHONGTHU

    @JsonProperty("return_phone")
    private String returnPhone;

    @JsonProperty("return_address")
    private String returnAddress;

    @JsonProperty("return_district_id")
    private Integer returnDistrictId;

    @JsonProperty("return_ward_code")
    private String returnWardCode;

    @JsonProperty("client_order_code")
    private String clientOrderCode; // Mã đơn hàng của hệ thống

    @JsonProperty("to_name")
    private String toName;

    @JsonProperty("to_phone")
    private String toPhone;

    @JsonProperty("to_address")
    private String toAddress;

    @JsonProperty("to_ward_code")
    private String toWardCode;

    @JsonProperty("to_district_id")
    private Integer toDistrictId;

    @JsonProperty("cod_amount")
    private Integer codAmount; // Tiền thu hộ

    @JsonProperty("content")
    private String content;

    @JsonProperty("weight")
    private Integer weight; // gram

    @JsonProperty("length")
    private Integer length; // cm

    @JsonProperty("width")
    private Integer width; // cm

    @JsonProperty("height")
    private Integer height; // cm

    @JsonProperty("insurance_value")
    private Integer insuranceValue;

    @JsonProperty("items")
    private List<Item> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private String name;
        private String code;
        private Integer quantity;
        private Integer price;
        private Integer weight;
    }
}
