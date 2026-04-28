package com.medcare.orderservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(unique = true)
    private String orderCode;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private OrderType orderType;

    private BigDecimal totalPrice;
    private BigDecimal shippingFee;
    private BigDecimal grandTotal;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private PaymentMethod paymentMethod;

    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;

    @Column(name = "city_id")
    private Integer cityId;

    @Column(name = "district_id")
    private Integer districtId;

    @Column(name = "ward_code", length = 20)
    private String wardCode;

    // Prescription related
    private String prescriptionImageUrl;

    @Column(columnDefinition = "TEXT")
    private String extractedInfo; // Store JSON from AI

    @Column(name = "prescription_id")
    private Long prescriptionId;

    private String voucherCode;
    private BigDecimal discountAmount;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<OrderStatusLog> statusLogs = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void addItem(OrderItem item) {
        if (items == null)
            items = new ArrayList<>();
        items.add(item);
        item.setOrder(this);
    }
}
