package com.medcare.orderservice.dto;

import com.medcare.orderservice.entity.Order;
import com.medcare.orderservice.entity.OrderItem;
import com.medcare.orderservice.entity.OrderStatus;
import com.medcare.orderservice.entity.OrderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailResponse {
    private Long id;
    private String orderCode;
    private OrderStatus status;
    private OrderType orderType;
    private String paymentMethod;
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private BigDecimal totalPrice;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private String voucherCode;
    private BigDecimal grandTotal;
    private String note;
    private String prescriptionImageUrl;
    private LocalDateTime createdAt;
    private List<OrderItemDto> items;
    private List<OrderStatusLogDto> statusLogs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDto {
        private Long medicineId;
        private String medicineName;
        private String imageUrl;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subTotal;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderStatusLogDto {
        private OrderStatus status;
        private String note;
        private LocalDateTime createdAt;
    }

    public static OrderDetailResponse fromEntity(Order order) {
        return OrderDetailResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .status(order.getStatus())
                .orderType(order.getOrderType())
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .recipientName(order.getRecipientName())
                .recipientPhone(order.getRecipientPhone())
                .recipientAddress(order.getRecipientAddress())
                .totalPrice(order.getTotalPrice())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .voucherCode(order.getVoucherCode())
                .grandTotal(order.getGrandTotal())
                .note(order.getNote())
                .prescriptionImageUrl(order.getPrescriptionImageUrl())
                .createdAt(order.getCreatedAt())
                .items(order.getItems().stream().map(item -> OrderItemDto.builder()
                        .medicineId(item.getMedicineId())
                        .medicineName(item.getMedicineName())
                        .imageUrl(item.getImageUrl())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subTotal(item.getSubTotal())
                        .build()).toList())
                .statusLogs(order.getStatusLogs().stream().map(log -> OrderStatusLogDto.builder()
                        .status(log.getStatus())
                        .note(log.getNote())
                        .createdAt(log.getCreatedAt())
                        .build()).toList())
                .build();
    }
}
