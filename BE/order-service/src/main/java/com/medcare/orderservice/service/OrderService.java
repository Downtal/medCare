package com.medcare.orderservice.service;

import com.medcare.common.exception.AppException;
import com.medcare.common.exception.ErrorCode;
import com.medcare.orderservice.client.*;
import com.medcare.orderservice.dto.CartDto;
import com.medcare.orderservice.dto.PopularMedicineSignalDto;
import com.medcare.orderservice.dto.RecommendationCartSignalDto;
import com.medcare.orderservice.dto.RecommendationOrderSignalDto;
import com.medcare.orderservice.dto.RecommendationSignalsResponse;
import com.medcare.orderservice.dto.OrderItemRequest;
import com.medcare.orderservice.dto.OrderRequest;
import com.medcare.orderservice.dto.ShippingRequestDto;
import com.medcare.orderservice.dto.ShippingRequestDto.ShippingRequestItemDto;
import com.medcare.common.dto.inventory.InventoryDeductRequest;
import com.medcare.orderservice.entity.*;
import com.medcare.orderservice.repository.OrderRepository;
import com.medcare.orderservice.repository.OrderStatusLogRepository;
import com.medcare.orderservice.service.strategy.OrderStrategyFactory;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import com.medcare.orderservice.dto.OrderStatisticsResponse;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {
    private static final List<OrderStatus> RECOMMENDATION_SIGNAL_STATUSES = List.of(
            OrderStatus.PAID,
            OrderStatus.DELIVERED,
            OrderStatus.SHIPPING,
            OrderStatus.CONFIRMED,
            OrderStatus.CONFIRME);

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
        List<InventoryDeductRequest.DeductItem> deductItems = new ArrayList<>();

        for (OrderItemRequest reqItem : itemsToProcess) {
            // Verify with Product Service
            ProductClient.ProductDto product = productClient.getProductById(reqItem.getMedicineId());
            if (product == null) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND, "Sản phẩm không tồn tại: " + reqItem.getMedicineId());
            }

            if (product.isRequiresPrescription()) {
                hasPrescriptionItem.set(true);
            }

            deductItems.add(InventoryDeductRequest.DeductItem.builder()
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
            inventoryClient.deductStock(InventoryDeductRequest.builder()
                    .items(deductItems)
                    .orderCode(order.getOrderCode())
                    .build());
            log.info("Successfully deducted stock for order {}", order.getOrderCode());
        } catch (FeignException feignException) {
            log.error("Failed to deduct stock for order {} with status {}: {}",
                    order.getOrderCode(), feignException.status(), feignException.getMessage());
            if (isInventoryConflict(feignException)) {
                throw new AppException(ErrorCode.INVENTORY_CONFLICT);
            }
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Đặt hàng thất bại: Sản phẩm trong giỏ hàng đã hết hoặc không đủ số lượng.");
        } catch (Exception e) {
            log.error("Failed to deduct stock for order {}: {}", order.getOrderCode(), e.getMessage());
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Đặt hàng thất bại: Sản phẩm trong giỏ hàng đã hết hoặc không đủ số lượng.");
        }

        // 3.5 Validate Prescription if needed
        if (hasPrescriptionItem.get()) {
            if (order.getPrescriptionId() == null) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn hàng có thuốc kê đơn (RX). Vui lòng cung cấp mã đơn thuốc đã được duyệt.");
            }
            
            try {
                UserClient.PrescriptionDto prescription = userClient.getPrescriptionById(order.getPrescriptionId());
                if (prescription == null) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Không tìm thấy thông tin đơn thuốc trên hệ thống.");
                }
                
                // Rule 1: Must be APPROVED
                if (!"APPROVED".equals(prescription.getStatus())) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn thuốc chưa được dược sĩ phê duyệt hoặc đã bị từ chối.");
                }
                
                // Rule 2: Owner check
                if (!prescription.getUserId().equals(order.getUserId())) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn thuốc không thuộc sở hữu của bạn.");
                }
                
                // Rule 3: expiryDate check (toa không được quá hạn ghi trên toa)
                if (prescription.getExpiryDate() != null && prescription.getExpiryDate().isBefore(java.time.LocalDate.now())) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn thuốc đã hết hạn theo ngày bác sĩ ghi trên toa.");
                }
                
                // Rule 4: isUsed check
                if (Boolean.TRUE.equals(prescription.getIsUsed())) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn thuốc này đã được sử dụng để mua hết các loại thuốc kê đơn bên trong.");
                }

                // Rule 5: 90-day validity from approvedAt
                if (prescription.getApprovedAt() != null &&
                        prescription.getApprovedAt().plusDays(90).isBefore(java.time.LocalDateTime.now())) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn thuốc đã quá 90 ngày kể từ ngày được duyệt. Vui lòng nộp lại toa mới.");
                }
                
                // Rule 5: No active PENDING order from this prescription
                boolean hasPendingOrder = orderRepository
                        .findByPrescriptionIdAndStatusIn(
                                order.getPrescriptionId(),
                                List.of(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPING))
                        .stream()
                        .anyMatch(o -> !o.getOrderCode().equals(order.getOrderCode()));
                if (hasPendingOrder) {
                    throw new AppException(ErrorCode.VALIDATION_ERROR, "Đơn thuốc này đang được sử dụng cho một đơn hàng chưa hoàn tất. Vui lòng chờ đơn hàng đó hoàn thành hoặc bị hủy.");
                }
                
                // Rule 6: Item-level quantity tracking from extractedData JSON
                if (prescription.getExtractedData() != null && !prescription.getExtractedData().isBlank()) {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(prescription.getExtractedData());
                        com.fasterxml.jackson.databind.JsonNode mappedMeds = root.get("mapped_medicines");
                        
                        if (mappedMeds != null && mappedMeds.isArray()) {
                            for (OrderItemRequest reqItem : itemsToProcess) {
                                // Check if this item requires prescription (we already know from step 2)
                                ProductClient.ProductDto product = productClient.getProductById(reqItem.getMedicineId());
                                if (product != null && product.isRequiresPrescription()) {
                                    boolean foundInPrescription = false;
                                    for (com.fasterxml.jackson.databind.JsonNode med : mappedMeds) {
                                        com.fasterxml.jackson.databind.JsonNode matched = med.get("matched_product");
                                        if (matched != null && matched.has("id") && matched.get("id").asLong() == reqItem.getMedicineId()) {
                                            foundInPrescription = true;
                                            int prescribedQty = med.has("prescribed_quantity") ? med.get("prescribed_quantity").asInt(999) : 999;
                                            int alreadyOrdered = med.has("ordered_quantity") ? med.get("ordered_quantity").asInt(0) : 0;
                                            int remaining = prescribedQty - alreadyOrdered;
                                            
                                            boolean isPurchased = med.has("purchased") && med.get("purchased").asBoolean();
                                            
                                            if (isPurchased || reqItem.getQuantity() > remaining) {
                                                String medName = matched.has("name") ? matched.get("name").asText() : product.getName();
                                                String reason = isPurchased ? "đã được mua hết số lượng cho phép" : String.format("chỉ còn lại %d", remaining);
                                                throw new AppException(ErrorCode.VALIDATION_ERROR,
                                                        String.format("Thuốc '%s' %s trong toa thuốc này.", medName, reason));
                                            }
                                            break;
                                        }
                                    }
                                    
                                    if (!foundInPrescription) {
                                        throw new AppException(ErrorCode.VALIDATION_ERROR, 
                                            String.format("Thuốc '%s' không có trong đơn thuốc bạn đã chọn.", product.getName()));
                                    }
                                }
                            }
                            
                            // Update ordered_quantity in extractedData after order is placed
                            for (OrderItemRequest reqItem : itemsToProcess) {
                                for (com.fasterxml.jackson.databind.JsonNode med : mappedMeds) {
                                    com.fasterxml.jackson.databind.JsonNode matched = med.get("matched_product");
                                    if (matched != null && matched.has("id") && matched.get("id").asLong() == reqItem.getMedicineId()) {
                                        int prev = med.has("ordered_quantity") ? med.get("ordered_quantity").asInt(0) : 0;
                                        ((com.fasterxml.jackson.databind.node.ObjectNode) med).put("ordered_quantity", prev + reqItem.getQuantity());
                                    }
                                }
                            }
                            
                            // Check if all items fully used → mark isUsed=true
                            boolean allUsed = true;
                            for (com.fasterxml.jackson.databind.JsonNode med : mappedMeds) {
                                com.fasterxml.jackson.databind.JsonNode matched = med.get("matched_product");
                                if (matched != null && matched.has("id")) {
                                    int prescribed = med.has("prescribed_quantity") ? med.get("prescribed_quantity").asInt(1) : 1;
                                    int ordered = med.has("ordered_quantity") ? med.get("ordered_quantity").asInt(0) : 0;
                                    if (ordered < prescribed) { allUsed = false; break; }
                                }
                            }
                            
                            // CRITICAL: Save the updated extractedData back to user-service
                            userClient.updateExtractedData(order.getPrescriptionId(), mapper.writeValueAsString(root));
                        }
                    } catch (AppException e) {
                        throw e;
                    } catch (Exception e) {
                        log.warn("Could not parse extractedData for prescription {}, will fulfill after payment: {}", order.getPrescriptionId(), e.getMessage());
                    }
                } 
                
                // For COD, we can fulfill immediately since the order is confirmed
                if (order.getPaymentMethod() == PaymentMethod.COD) {
                    fulfillPrescriptionMedicines(order);
                }
                
                log.info("Prescription {} validated for order {}", order.getPrescriptionId(), order.getOrderCode());
                
                log.info("Prescription {} validated and processed for order {}", order.getPrescriptionId(), order.getOrderCode());
                
            } catch (AppException e) {
                throw e;
            } catch (Exception e) {
                log.error("Error validating prescription id {}: {}", order.getPrescriptionId(), e.getMessage(), e);
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Không thể xác thực đơn thuốc: " + e.getMessage());
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

        // 7. Remove only purchased items from Redis Cart
        for (OrderItemRequest item : itemsToProcess) {
            try {
                cartService.removeItem("user:" + userId, item.getMedicineId());
            } catch (Exception e) {
                log.error("Failed to remove item {} from cart after order", item.getMedicineId(), e);
            }
        }

        log.info("Order created successfully: {}", savedOrder.getOrderCode());
        return savedOrder;
    }

    public java.util.List<Order> getMyOrders(String userId) {
        return orderRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long.parseLong(userId));
    }

    @Transactional(readOnly = true)
    public RecommendationSignalsResponse getRecommendationSignals(Long userId, int days) {
        int safeDays = days > 0 ? days : 60;
        LocalDateTime since = LocalDateTime.now().minusDays(safeDays);

        List<Order> orders = orderRepository
                .findByUserIdAndStatusInAndCreatedAtAfterAndDeletedAtIsNullOrderByCreatedAtDesc(
                        userId,
                        RECOMMENDATION_SIGNAL_STATUSES,
                        since);

        List<RecommendationOrderSignalDto> orderSignals = orders.stream()
                .flatMap(order -> order.getItems().stream()
                        .map(item -> RecommendationOrderSignalDto.builder()
                                .medicineId(item.getMedicineId())
                                .quantity(item.getQuantity())
                                .createdAt(order.getCreatedAt())
                                .status(order.getStatus().name())
                                .build()))
                .toList();

        List<RecommendationCartSignalDto> cartSignals = List.of();
        try {
            CartDto cart = cartService.getCart("user:" + userId);
            if (cart != null && cart.getItems() != null) {
                cartSignals = cart.getItems().stream()
                        .filter(item -> item.getMedicineId() != null && item.getQuantity() != null
                                && item.getQuantity() > 0)
                        .map(item -> RecommendationCartSignalDto.builder()
                                .medicineId(item.getMedicineId())
                                .quantity(item.getQuantity())
                                .build())
                        .toList();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch cart signals for user {}: {}", userId, e.getClass().getSimpleName());
        }

        return RecommendationSignalsResponse.builder()
                .userId(userId)
                .orderSignals(orderSignals)
                .cartSignals(cartSignals)
                .build();
    }

    @Transactional(readOnly = true)
    public List<PopularMedicineSignalDto> getPopularMedicineSignals(int days, int limit) {
        int safeDays = days > 0 ? days : 60;
        int safeLimit = limit > 0 ? limit : 200;
        LocalDateTime since = LocalDateTime.now().minusDays(safeDays);

        return orderRepository.findMedicinePopularitySince(RECOMMENDATION_SIGNAL_STATUSES, since).stream()
                .limit(safeLimit)
                .map(item -> PopularMedicineSignalDto.builder()
                        .medicineId(item.getMedicineId())
                        .popularity(item.getPopularity())
                        .build())
                .toList();
    }

    public List<String> getRecentMedicineNames(String userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Order> recentOrders = orderRepository
                .findByUserIdAndCreatedAtAfterAndDeletedAtIsNull(Long.parseLong(userId), since);
        return recentOrders.stream()
                .flatMap(o -> o.getItems().stream())
                .map(OrderItem::getMedicineName)
                .distinct()
                .toList();
    }

    public Order getOrderByCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .orElseThrow(
                        () -> new AppException(ErrorCode.ORDER_NOT_FOUND, "Order not found with code: " + orderCode));
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

        // Handle rollback if cancelled
        if (status == OrderStatus.CANCELLED) {
            performRollback(order);
        }

        order.setStatus(status);
        Order savedOrder = orderRepository.save(order);
        logStatusChange(savedOrder, status, "Trạng thái đơn hàng được cập nhật bởi quản trị viên.");
        return savedOrder;
    }

    @Transactional
    public void updateOrderStatusInternal(String orderCode, String newStatus) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(
                        () -> new AppException(ErrorCode.ORDER_NOT_FOUND, "Order not found with code: " + orderCode));

        try {
            OrderStatus status = OrderStatus.valueOf(newStatus.toUpperCase());
            if (status == OrderStatus.CANCELLED) {
                performRollback(order);
            }
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
                .orElseThrow(
                        () -> new AppException(ErrorCode.ORDER_NOT_FOUND, "Order not found with code: " + orderCode));

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

                // Smart Fulfillment: Mark prescription items as purchased
                if (order.getPrescriptionId() != null) {
                    fulfillPrescriptionMedicines(order);
                }
            } catch (Exception e) {
                log.error("Failed to create shipping order or fulfill prescription for {}: {}", orderCode,
                        e.getMessage());
            }
        } else if ("FAILED".equals(status)) {
            performRollback(order);
        }
        orderRepository.save(order);
        logStatusChange(order, order.getStatus(), "Cập nhật trạng thái thanh toán: " + status);
        log.info("Updated order {} status to {}", orderCode, status);
    }

    @Transactional
    public void cancelOrder(String orderCode, String userId) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(
                        () -> new AppException(ErrorCode.ORDER_NOT_FOUND, "Order not found with code: " + orderCode));

        if (!order.getUserId().toString().equals(userId)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Bạn không có quyền hủy đơn hàng này.");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Chỉ có thể hủy đơn hàng đang ở trạng thái chờ xử lý.");
        }

        performRollback(order);
        orderRepository.save(order);
        logStatusChange(order, OrderStatus.CANCELLED, "Đơn hàng đã được hủy bởi khách hàng.");
        log.info("Order {} cancelled by user {}", orderCode, userId);
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void autoCancelStaleOrders() {
        LocalDateTime expirationTime = LocalDateTime.now().minusHours(24);
        List<Order> staleOrders = orderRepository.findByStatusAndCreatedAtBeforeAndDeletedAtIsNull(OrderStatus.PENDING,
                expirationTime);

        if (staleOrders.isEmpty())
            return;

        log.info("Found {} stale pending orders to auto-cancel", staleOrders.size());
        for (Order order : staleOrders) {
            try {
                performRollback(order);
                orderRepository.save(order);
                logStatusChange(order, OrderStatus.CANCELLED, "Đơn hàng tự động hủy do quá 24h chưa thanh toán.");
                log.info("Auto-cancelled stale order: {}", order.getOrderCode());
            } catch (Exception e) {
                log.error("Failed to auto-cancel order {}: {}", order.getOrderCode(), e.getMessage());
            }
        }
    }

    private void performRollback(Order order) {
        order.setStatus(OrderStatus.CANCELLED);

        // Restore Prescription Usage
        if (order.getPrescriptionId() != null) {
            try {
                userClient.resetPrescriptionUsage(order.getPrescriptionId());
                
                // Also unfulfill the specific medicines to reset their 'purchased' flag in extractedData
                List<Long> productIds = order.getItems().stream()
                        .map(OrderItem::getMedicineId)
                        .collect(Collectors.toList());
                userClient.unfulfillMedicines(order.getPrescriptionId(), productIds);
                
                log.info("Reset usage and unfulfilled medicines for prescription {} as payment for order {} failed/cancelled",
                        order.getPrescriptionId(), order.getOrderCode());
            } catch (Exception e) {
                log.error("Failed to reset prescription usage for order {}: {}", order.getOrderCode(), e.getMessage());
            }
        }

        // Restore Stock
        try {
            inventoryClient.restoreStock(order.getOrderCode());
            log.info("Successfully requested stock restoration for order {}", order.getOrderCode());
        } catch (Exception e) {
            log.error("Failed to restore stock for order {}: {}", order.getOrderCode(), e.getMessage());
        }

        // Restore Vouchers
        if (order.getVoucherCode() != null && !order.getVoucherCode().isEmpty()) {
            try {
                promotionClient.rollbackUsage(order.getVoucherCode(), order.getUserId());
                log.info("Successfully requested voucher rollback for order {}", order.getOrderCode());
            } catch (Exception e) {
                log.error("Failed to rollback voucher for order {}: {}", order.getOrderCode(), e.getMessage());
            }
        }
        if (order.getShippingVoucherCode() != null && !order.getShippingVoucherCode().isEmpty()) {
            try {
                promotionClient.rollbackUsage(order.getShippingVoucherCode(), order.getUserId());
                log.info("Successfully requested shipping voucher rollback for order {}", order.getOrderCode());
            } catch (Exception e) {
                log.error("Failed to rollback shipping voucher for order {}: {}", order.getOrderCode(), e.getMessage());
            }
        }
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
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Thông tin địa chỉ vận chuyển không đầy đủ. Vui lòng kiểm tra lại tỉnh/thành, quận/huyện và phường/xã.");
        }
    }

    private String formatFullAddress(String street, String ward, String district, String province) {
        List<String> parts = new ArrayList<>();
        if (street != null && !street.isBlank())
            parts.add(street);
        if (ward != null && !ward.isBlank())
            parts.add(ward);
        if (district != null && !district.isBlank())
            parts.add(district);
        if (province != null && !province.isBlank())
            parts.add(province);
        return String.join(", ", parts);
    }

    private String generateOrderCode() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmm"));
        int random = new Random().nextInt(900) + 100;
        return "MC" + timestamp + random;
    }

    @Transactional(readOnly = true)
    public OrderStatisticsResponse getStatistics(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sinceCurrent = now.minusDays(days);
        LocalDateTime sincePrevious = now.minusDays(days * 2);

        List<Order> allOrders = orderRepository.findAllByDeletedAtIsNull();

        // Current period orders
        List<Order> currentOrders = allOrders.stream()
                .filter(o -> o.getCreatedAt().isAfter(sinceCurrent))
                .toList();

        // Previous period orders (for growth calculation)
        List<Order> previousOrders = allOrders.stream()
                .filter(o -> o.getCreatedAt().isAfter(sincePrevious) && o.getCreatedAt().isBefore(sinceCurrent))
                .toList();

        // Current Metrics
        BigDecimal currentRevenue = currentOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long currentTotalOrders = currentOrders.size();
        BigDecimal currentAvgValue = currentTotalOrders > 0
                ? currentRevenue.divide(new BigDecimal(currentTotalOrders), 2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO;
        long currentCompleted = currentOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED || o.getStatus() == OrderStatus.PAID).count();

        // Previous Metrics
        BigDecimal prevRevenue = previousOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long prevTotalOrders = previousOrders.size();
        BigDecimal prevAvgValue = prevTotalOrders > 0
                ? prevRevenue.divide(new BigDecimal(prevTotalOrders), 2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO;
        long prevCompleted = previousOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED || o.getStatus() == OrderStatus.PAID).count();

        // Calculate Growth (%)
        double revenueGrowth = calculateGrowth(currentRevenue.doubleValue(), prevRevenue.doubleValue());
        double ordersGrowth = calculateGrowth((double) currentTotalOrders, (double) prevTotalOrders);
        double aovGrowth = calculateGrowth(currentAvgValue.doubleValue(), prevAvgValue.doubleValue());
        double completionGrowth = calculateGrowth((double) currentCompleted, (double) prevCompleted);

        // Group revenue by date (Current trend)
        Map<String, OrderStatisticsResponse.RevenueByPeriod> trendMap = currentOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> {
                                    BigDecimal revenue = list.stream().map(Order::getGrandTotal).reduce(BigDecimal.ZERO,
                                            BigDecimal::add);
                                    return new OrderStatisticsResponse.RevenueByPeriod("", revenue, (long) list.size());
                                })));

        List<OrderStatisticsResponse.RevenueByPeriod> revenueTrend = trendMap.entrySet().stream()
                .map(e -> {
                    e.getValue().setPeriod(e.getKey());
                    return e.getValue();
                })
                .sorted(Comparator.comparing(OrderStatisticsResponse.RevenueByPeriod::getPeriod))
                .collect(Collectors.toList());

        // Top products (Current)
        Map<Long, OrderStatisticsResponse.TopProduct> productMap = new HashMap<>();
        currentOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .flatMap(o -> o.getItems().stream())
                .forEach(item -> {
                    productMap.compute(item.getMedicineId(), (id, top) -> {
                        if (top == null) {
                            return new OrderStatisticsResponse.TopProduct(id, item.getMedicineName(),
                                    item.getQuantity(), item.getSubTotal());
                        }
                        top.setQuantitySold(top.getQuantitySold() + item.getQuantity());
                        top.setTotalRevenue(top.getTotalRevenue().add(item.getSubTotal()));
                        return top;
                    });
                });

        List<OrderStatisticsResponse.TopProduct> topProducts = productMap.values().stream()
                .sorted(Comparator.comparing(OrderStatisticsResponse.TopProduct::getQuantitySold).reversed())
                .limit(5)
                .collect(Collectors.toList());

        // Payment distribution (Current)
        Map<String, Long> paymentDist = currentOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getPaymentMethod().name(), Collectors.counting()));

        return OrderStatisticsResponse.builder()
                .totalRevenue(currentRevenue)
                .totalOrders(currentTotalOrders)
                .averageOrderValue(currentAvgValue)
                .pendingOrders(currentOrders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING).count())
                .shippingOrders(currentOrders.stream().filter(o -> o.getStatus() == OrderStatus.SHIPPING).count())
                .completedOrders(currentCompleted)
                .revenueGrowth(revenueGrowth)
                .ordersGrowth(ordersGrowth)
                .aovGrowth(aovGrowth)
                .completionGrowth(completionGrowth)
                .revenueTrend(revenueTrend)
                .topProducts(topProducts)
                .paymentMethodDistribution(paymentDist)
                .build();
    }

    private double calculateGrowth(double current, double previous) {
        if (previous == 0)
            return current > 0 ? 100.0 : 0.0;
        return ((current - previous) / previous) * 100.0;
    }

    private boolean isInventoryConflict(FeignException feignException) {
        if (feignException.status() != 409) {
            return false;
        }

        String content = feignException.contentUTF8();
        if (content == null || content.isBlank()) {
            return false;
        }

        return content.contains("\"errorCode\":\"3003\"") || content.contains("\"errorCode\":3003");
    }

    private void fulfillPrescriptionMedicines(Order order) {
        if (order.getPrescriptionId() == null)
            return;
        try {
            List<Long> productIds = order.getItems().stream()
                    .map(OrderItem::getMedicineId)
                    .collect(Collectors.toList());
            userClient.fulfillMedicines(order.getPrescriptionId(), productIds);
            log.info("Successfully called fulfillMedicines for prescription {} from order {}",
                    order.getPrescriptionId(), order.getOrderCode());
        } catch (Exception e) {
            log.error("Failed to call fulfillMedicines for prescription {}: {}",
                    order.getPrescriptionId(), e.getMessage());
        }
    }
}
