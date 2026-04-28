package com.medcare.orderservice.service;

import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;
import com.medcare.orderservice.client.*;
import com.medcare.orderservice.dto.CartDto;
import com.medcare.orderservice.dto.OrderItemRequest;
import com.medcare.orderservice.dto.OrderRequest;
import com.medcare.orderservice.dto.ShippingRequestDto;
import com.medcare.orderservice.dto.ShippingRequestDto.ShippingRequestItemDto;
import com.medcare.orderservice.dto.StockDeductRequest;
import com.medcare.orderservice.entity.*;
import com.medcare.orderservice.repository.OrderRepository;
import com.medcare.orderservice.repository.OrderStatusLogRepository;
import com.medcare.orderservice.service.strategy.OrderStrategyFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final ProductClient productClient;
    private final PromotionClient promotionClient;
    private final ShippingClient shippingClient;
    private final InventoryClient inventoryClient;
    private final OrderStrategyFactory strategyFactory;
    private final OrderStatusLogRepository statusLogRepository;
    private final UserClient userClient;

    @Transactional
    public Order createOrder(String userId, OrderRequest request) {
        log.info("Creating order for user: {}", userId);

        // 1. Get Cart Items (either from request or from Redis)
        List<OrderItemRequest> itemsToProcess = request.getItems();
        BigDecimal totalAmount = BigDecimal.ZERO;

        if (itemsToProcess == null || itemsToProcess.isEmpty()) {
            // Fallback to cart from Redis if no items specified in request
            CartDto cart = cartService.getCart("user:" + userId);
            if (cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Giỏ hàng đang trống");
            }
            itemsToProcess = cart.getItems().stream()
                    .map(i -> OrderItemRequest.builder()
                            .medicineId(i.getMedicineId())
                            .quantity(i.getQuantity())
                            .build())
                    .toList();
            totalAmount = cart.getTotalAmount();
        } else {
            // Calculate total from selected items
            for (OrderItemRequest item : itemsToProcess) {
                ProductClient.ProductDto product = productClient.getProductById(item.getMedicineId());
                if (product != null) {
                    totalAmount = totalAmount.add(product.getPrice().multiply(new BigDecimal(item.getQuantity())));
                }
            }
        }

        // 2. Validate and Process Address
        validateAddress(request);
        String fullAddress = formatFullAddress(request.getStreet(), request.getWard(), request.getDistrict(), request.getProvince());

        Order order = Order.builder()
                .userId(Long.parseLong(userId))
                .orderCode(generateOrderCode())
                .paymentMethod(request.getPaymentMethod())
                .recipientName(request.getRecipientName())
                .recipientPhone(request.getRecipientPhone())
                .recipientAddress(fullAddress)
                .cityId(request.getCityId())
                .districtId(request.getDistrictId())
                .wardCode(request.getWardCode())
                .prescriptionImageUrl(request.getPrescriptionImageUrl())
                .totalPrice(totalAmount)
                .shippingFee(new BigDecimal("30000"))
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .voucherCode(request.getVoucherCode())
                .shippingVoucherCode(request.getShippingVoucherCode())
                .shippingDiscountAmount(request.getShippingDiscountAmount() != null ? request.getShippingDiscountAmount() : BigDecimal.ZERO)
                .note(request.getNote())
                .prescriptionId(request.getPrescriptionId())
                .grandTotal(totalAmount.add(new BigDecimal("30000"))
                        .subtract(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                        .subtract(request.getShippingDiscountAmount() != null ? request.getShippingDiscountAmount() : BigDecimal.ZERO))
                .build();

        // 3. Classify and Verify Items
        AtomicBoolean hasPrescriptionItem = new AtomicBoolean(false);
        List<StockDeductRequest.DeductItem> deductItems = new ArrayList<>();

        for (OrderItemRequest reqItem : itemsToProcess) {
            // Verify with Product Service
            ProductClient.ProductDto product = productClient.getProductById(reqItem.getMedicineId());
            if (product == null) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND, "Sản phẩm không tồn tại: " + reqItem.getMedicineId());
            }

            if (product.isRequiresPrescription()) {
                hasPrescriptionItem.set(true);
            }

            deductItems.add(StockDeductRequest.DeductItem.builder()
                    .productId(reqItem.getMedicineId())
                    .quantity(reqItem.getQuantity())
                    .build());

            OrderItem orderItem = OrderItem.builder()
                    .medicineId(reqItem.getMedicineId())
                    .medicineName(product.getName())
                    .imageUrl(product.getPrimaryImageUrl())
                    .quantity(reqItem.getQuantity())
                    .unitPrice(product.getPrice())
                    .subTotal(product.getPrice().multiply(new BigDecimal(reqItem.getQuantity())))
                    .build();
            order.addItem(orderItem);
        }

        // 3. Deduct Stock (Real call instead of mock)
        try {
            inventoryClient.deductStock(StockDeductRequest.builder()
                    .items(deductItems)
                    .orderCode(order.getOrderCode())
                    .build());
            log.info("Successfully deducted stock for order {}", order.getOrderCode());
        } catch (Exception e) {
            log.error("Failed to deduct stock for order {}: {}", order.getOrderCode(), e.getMessage());
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Đặt hàng thất bại: Sản phẩm trong giỏ hàng đã hết hoặc không đủ số lượng.");
        }

        // 4. Determine Order Type and Apply Strategy
        // 3.5 Validate Prescription if needed
        if (hasPrescriptionItem.get()) {
            if (order.getPrescriptionId() == null) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn hàng có thuốc kê đơn (RX). Vui lòng cung cấp mã đơn thuốc đã được duyệt.");
            }
            
            try {
                UserClient.PrescriptionDto prescription = userClient.getPrescriptionById(order.getPrescriptionId());
                if (!"APPROVED".equals(prescription.getStatus())) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn thuốc chưa được phê duyệt hoặc bị từ chối.");
                }
                if (prescription.getIsUsed()) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn thuốc này đã được sử dụng cho một đơn hàng khác.");
                }
                if (prescription.getExpiryDate() != null && prescription.getExpiryDate().isBefore(java.time.LocalDate.now())) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn thuốc đã hết hạn sử dụng.");
                }
                if (!prescription.getUserId().equals(order.getUserId())) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn thuốc không thuộc sở hữu của bạn.");
                }
                
                // Mark as used after successful validation
                userClient.markPrescriptionAsUsed(order.getPrescriptionId());
                log.info("Linked and marked prescription {} as used for order {}", order.getPrescriptionId(), order.getOrderCode());
                
            } catch (AppException e) {
                throw e;
            } catch (Exception e) {
                log.error("Error validating prescription: {}", e.getMessage());
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Không thể xác thực đơn thuốc. Vui lòng thử lại sau.");
            }
        }
        OrderType type = hasPrescriptionItem.get() ? OrderType.PRESCRIPTION : OrderType.OTC;
        order.setOrderType(type);

        strategyFactory.getStrategy(type).process(order);

        // 5. Save to Database
        Order savedOrder = orderRepository.save(order);

        // Log initial status
        logStatusChange(savedOrder, savedOrder.getStatus(), "Đơn hàng đã được khởi tạo thành công.");

        // 6. Apply Voucher Usage (Decrement limit)
        if (request.getVoucherCode() != null && request.getDiscountAmount() != null) {
            try {
                promotionClient.recordUsage(
                        request.getVoucherCode(),
                        Long.parseLong(userId),
                        savedOrder.getId(),
                        request.getDiscountAmount());
            } catch (Exception e) {
                log.error("Failed to record voucher usage for code {}", request.getVoucherCode(), e);
                throw new AppException(ErrorCode.VOUCHER_USED, "Thanh toán thất bại: Mã giảm giá đã hết lượt sử dụng trong khi bạn đang thao tác");
            }
        }

        if (request.getShippingVoucherCode() != null && request.getShippingDiscountAmount() != null) {
            try {
                promotionClient.recordUsage(
                        request.getShippingVoucherCode(),
                        Long.parseLong(userId),
                        savedOrder.getId(),
                        request.getShippingDiscountAmount());
            } catch (Exception e) {
                log.error("Failed to record shipping voucher usage for code {}", request.getShippingVoucherCode(), e);
                // Note: In a real system, we might want to rollback the first voucher if this fails
                throw new AppException(ErrorCode.VOUCHER_USED, "Thanh toán thất bại: Mã giảm phí vận chuyển đã hết lượt sử dụng");
            }
        }

        // 7. Clear Redis Cart
        cartService.clearCart("user:" + userId);

        log.info("Order created successfully: {}", savedOrder.getOrderCode());
        return savedOrder;
    }

    public java.util.List<Order> getMyOrders(String userId) {
        return orderRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long.parseLong(userId));
    }

    public List<String> getRecentMedicineNames(String userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Order> recentOrders = orderRepository.findByUserIdAndCreatedAtAfterAndDeletedAtIsNull(Long.parseLong(userId), since);
        return recentOrders.stream()
                .flatMap(o -> o.getItems().stream())
                .map(OrderItem::getMedicineName)
                .distinct()
                .toList();
    }

    public Order getOrderByCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND, "Order not found with code: " + orderCode));
    }

    public java.util.List<Order> getAllOrders() {
        try {
            return orderRepository.findAllRaw();
        } catch (Exception e) {
            return orderRepository.findAllByDeletedAtIsNull();
        }
    }

    public java.util.List<Order> getTrashedOrders() {
        return orderRepository.findAllByDeletedAtIsNotNull();
    }

    @Transactional
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        order.setDeletedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    @Transactional
    public void restoreOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        order.setDeletedAt(null);
        orderRepository.save(order);
    }

    @Transactional
    public void deleteOrderHard(Long id) {
        orderRepository.deleteById(id);
    }

    @Transactional
    public Order updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        
        // Handle prescription recovery if cancelled
        if (status == OrderStatus.CANCELLED && order.getPrescriptionId() != null) {
            try {
                userClient.resetPrescriptionUsage(order.getPrescriptionId());
                log.info("Reset usage for prescription {} as order {} was cancelled", order.getPrescriptionId(), order.getOrderCode());
            } catch (Exception e) {
                log.error("Failed to reset prescription usage for order {}: {}", order.getOrderCode(), e.getMessage());
            }
        }

        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);
        logStatusChange(savedOrder, status, "Trạng thái đơn hàng được cập nhật bởi quản trị viên.");
        return savedOrder;
    }

    @Transactional
    public void updateOrderStatusInternal(String orderCode, String newStatus) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND, "Order not found with code: " + orderCode));

        try {
            OrderStatus status = OrderStatus.valueOf(newStatus.toUpperCase());
            order.setStatus(status);
            orderRepository.save(order);
            logStatusChange(order, status, "Trạng thái được cập nhật tự động từ hệ thống vận chuyển.");
            log.info("Internally updated order {} status to {}", orderCode, status);
        } catch (IllegalArgumentException e) {
            log.error("Invalid status {} for order {}", newStatus, orderCode);
        }
    }

    @Transactional
    public void updatePaymentStatusByCode(String orderCode, String status) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND, "Order not found with code: " + orderCode));

        if ("PAID".equals(status)) {
            order.setStatus(OrderStatus.PAID);
            // Create Shipping Order
            try {
                ShippingRequestDto shippingReq = ShippingRequestDto.builder()
                        .orderCode(orderCode)
                        .toName(order.getRecipientName())
                        .toPhone(order.getRecipientPhone())
                        .toAddress(order.getRecipientAddress())
                        .toWardCode(order.getWardCode())
                        .toDistrictId(order.getDistrictId())
                        .codAmount(0) // Đã thanh toán nên COD = 0
                        .insuranceValue(order.getGrandTotal().intValue())
                        .items(order.getItems().stream().map(item -> ShippingRequestItemDto.builder()
                                .name(item.getMedicineName())
                                .code(item.getMedicineId().toString())
                                .quantity(item.getQuantity())
                                .price(item.getUnitPrice().intValue())
                                .build()).toList())
                        .build();
                shippingClient.createShippingOrder(shippingReq);
                log.info("Successfully sent request to shipping-service to create GHN order for {}", orderCode);
            } catch (Exception e) {
                log.error("Failed to create shipping order via shipping-service for {}", orderCode, e);
            }
        } else if ("FAILED".equals(status)) {
            order.setStatus(OrderStatus.CANCELLED);
            
            // Restore Prescription Usage
            if (order.getPrescriptionId() != null) {
                try {
                    userClient.resetPrescriptionUsage(order.getPrescriptionId());
                    log.info("Reset usage for prescription {} as payment for order {} failed", order.getPrescriptionId(), orderCode);
                } catch (Exception e) {
                    log.error("Failed to reset prescription usage for order {}: {}", orderCode, e.getMessage());
                }
            }

            // Restore Stock
            try {
                inventoryClient.restoreStock(orderCode);
                log.info("Successfully requested stock restoration for failed payment of order {}", orderCode);
            } catch (Exception e) {
                log.error("Failed to restore stock for order {} after payment failure", orderCode, e);
            }

            // Restore Vouchers
            if (order.getVoucherCode() != null && !order.getVoucherCode().isEmpty()) {
                try {
                    promotionClient.rollbackUsage(order.getVoucherCode(), order.getUserId());
                    log.info("Successfully requested voucher rollback for order {}", orderCode);
                } catch (Exception e) {
                    log.error("Failed to rollback voucher for order {} after payment failure", orderCode, e);
                }
            }
            if (order.getShippingVoucherCode() != null && !order.getShippingVoucherCode().isEmpty()) {
                try {
                    promotionClient.rollbackUsage(order.getShippingVoucherCode(), order.getUserId());
                    log.info("Successfully requested shipping voucher rollback for order {}", orderCode);
                } catch (Exception e) {
                    log.error("Failed to rollback shipping voucher for order {} after payment failure", orderCode, e);
                }
            }
        }
        orderRepository.save(order);
        logStatusChange(order, order.getStatus(), "Cập nhật trạng thái thanh toán: " + status);
        log.info("Updated order {} status to {}", orderCode, status);
    }

    private void logStatusChange(Order order, OrderStatus status, String note) {
        OrderStatusLog log = OrderStatusLog.builder()
                .order(order)
                .status(status)
                .note(note)
                .build();
        statusLogRepository.save(log);
    }

    private void validateAddress(OrderRequest request) {
        if (request.getProvince() == null || request.getProvince().isBlank() ||
            request.getDistrict() == null || request.getDistrict().isBlank() ||
            request.getWard() == null || request.getWard().isBlank() ||
            request.getCityId() == null || request.getDistrictId() == null || request.getWardCode() == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Thông tin địa chỉ vận chuyển không đầy đủ. Vui lòng kiểm tra lại tỉnh/thành, quận/huyện và phường/xã.");
        }
    }

    private String formatFullAddress(String street, String ward, String district, String province) {
        List<String> parts = new ArrayList<>();
        if (street != null && !street.isBlank()) parts.add(street);
        if (ward != null && !ward.isBlank()) parts.add(ward);
        if (district != null && !district.isBlank()) parts.add(district);
        if (province != null && !province.isBlank()) parts.add(province);
        return String.join(", ", parts);
    }

    private String generateOrderCode() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmm"));
        int random = new Random().nextInt(900) + 100;
        return "MC" + timestamp + random;
    }
}
