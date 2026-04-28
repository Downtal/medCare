package com.medcare.orderservice.dto;

import com.medcare.orderservice.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class OrderRequest {
    @NotBlank(message = "Tên người nhận không được để trống")
    private String recipientName;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String recipientPhone;

    @NotBlank(message = "Địa chỉ cụ thể không được để trống")
    private String street;

    @NotBlank(message = "Phường/Xã không được để trống")
    private String ward;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String district;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String province;

    private Integer cityId;
    private Integer districtId;
    private String wardCode;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private PaymentMethod paymentMethod;

    // Optional for prescription orders
    private String prescriptionImageUrl;

    private String voucherCode;
    private BigDecimal discountAmount;

    private String shippingVoucherCode;
    private BigDecimal shippingDiscountAmount;
    private String note;
    private Long prescriptionId;
    private java.util.List<OrderItemRequest> items;
}
