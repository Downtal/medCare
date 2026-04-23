package com.medcare.orderservice.service;

import com.medcare.orderservice.client.InventoryClient;
import com.medcare.orderservice.client.ProductClient;
import com.medcare.orderservice.client.PromotionClient;
import com.medcare.orderservice.client.ShippingClient;
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
                throw new RuntimeException("Giỏ hàng đang trống");
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

        // 2. Classify and Verify Items
        AtomicBoolean hasPrescriptionItem = new AtomicBoolean(false);
        List<StockDeductRequest.DeductItem> deductItems = new ArrayList<>();

        Order order = Order.builder()
                .userId(Long.parseLong(userId))
                .orderCode(generateOrderCode())
                .paymentMethod(request.getPaymentMethod())
                .recipientName(request.getRecipientName())
                .recipientPhone(request.getRecipientPhone())
                .recipientAddress(String.format("%s, %s, %s, %s",
                        request.getStreet(), request.getWard(), request.getDistrict(), request.getProvince()))
                .cityId(request.getCityId())
                .districtId(request.getDistrictId())
                .wardCode(request.getWardCode())
                .prescriptionImageUrl(request.getPrescriptionImageUrl())
                .totalPrice(totalAmount)
                .shippingFee(new BigDecimal("30000"))
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .voucherCode(request.getVoucherCode())
                .note(request.getNote())
                .grandTotal(totalAmount.add(new BigDecimal("30000"))
                        .subtract(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO))
                .build();

        for (OrderItemRequest reqItem : itemsToProcess) {
            // Verify with Product Service
            ProductClient.ProductDto product = productClient.getProductById(reqItem.getMedicineId());
            if (product == null) {
                throw new RuntimeException("Sản phẩm không tồn tại: " + reqItem.getMedicineId());
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
            inventoryClient.deductStock(StockDeductRequest.builder().items(deductItems).build());
            log.info("Successfully deducted stock for order {}", order.getOrderCode());
        } catch (Exception e) {
            log.error("Failed to deduct stock for order {}: {}", order.getOrderCode(), e.getMessage());
            throw new RuntimeException("Đặt hàng thất bại: Sản phẩm trong giỏ hàng đã hết hoặc không đủ số lượng.");
        }

        // 4. Determine Order Type and Apply Strategy
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
                throw new RuntimeException(
                        "Thanh toán thất bại: Mã giảm giá đã hết lượt sử dụng trong khi bạn đang thao tác");
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

    public Order getOrderByCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Order not found with code: " + orderCode));
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
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setDeletedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    @Transactional
    public void restoreOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
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
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);
        logStatusChange(savedOrder, status, "Trạng thái đơn hàng được cập nhật bởi quản trị viên.");
        return savedOrder;
    }

    @Transactional
    public void updateOrderStatusInternal(String orderCode, String newStatus) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Order not found with code: " + orderCode));

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
                .orElseThrow(() -> new RuntimeException("Order not found with code: " + orderCode));

        if ("PAID".equals(status)) {
            order.setStatus(OrderStatus.PAID);
            // Create Shipping Order
            try {
                ShippingRequestDto shippingReq = ShippingRequestDto.builder()
                        .orderCode(orderCode)
                        .toName(order.getRecipientName())
                        .toPhone(order.getRecipientPhone())
                        .toAddress(order.getRecipientAddress())
                        .toWardCode(order.getWardCode() != null ? order.getWardCode() : "120110")
                        .toDistrictId(order.getDistrictId() != null ? order.getDistrictId() : 1442)
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

    private String generateOrderCode() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmm"));
        int random = new Random().nextInt(900) + 100;
        return "MC" + timestamp + random;
    }
}
