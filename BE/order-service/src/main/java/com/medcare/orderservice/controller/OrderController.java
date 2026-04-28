package com.medcare.orderservice.controller;

import com.medcare.orderservice.dto.OrderDetailResponse;
import com.medcare.orderservice.dto.OrderRequest;
import com.medcare.orderservice.dto.OrderStatusUpdateRequest;
import com.medcare.orderservice.entity.Order;
import com.medcare.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@jakarta.validation.Valid @RequestBody OrderRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @AuthenticationPrincipal String userIdPrincipal) {
        String userId = userIdHeader != null ? userIdHeader : userIdPrincipal;

        if (userId == null || "null".equals(userId)) {
            return ResponseEntity.status(401).build();
        }

        try {
            Order order = orderService.createOrder(userId, request);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            log.error("Checkout error: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @AuthenticationPrincipal String userIdPrincipal) {
        String userId = userIdHeader != null ? userIdHeader : userIdPrincipal;
        if (userId == null || "null".equals(userId)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(orderService.getMyOrders(userId));
    }

    @GetMapping("/my-orders/recent-items")
    public ResponseEntity<List<String>> getRecentItems(
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @AuthenticationPrincipal String userIdPrincipal,
            @RequestParam(defaultValue = "30") int days) {
        String userId = userIdHeader != null ? userIdHeader : userIdPrincipal;
        if (userId == null || "null".equals(userId)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(orderService.getRecentMedicineNames(userId, days));
    }

    @GetMapping("/{orderCode}")
    public ResponseEntity<OrderDetailResponse> getOrderDetail(@PathVariable String orderCode) {
        Order order = orderService.getOrderByCode(orderCode);
        return ResponseEntity.ok(OrderDetailResponse.fromEntity(order));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<Order>> getAllOrdersAdmin(HttpServletRequest request) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        boolean hasAccess = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN") ||
                        a.getAuthority().equals("ROLE_PHARMACIST") || a.getAuthority().equals("PHARMACIST"));

        if (!hasAccess) {
            log.warn("Access denied for user {} with authorities {}", auth != null ? auth.getName() : "anonymous",
                    auth != null ? auth.getAuthorities() : "none");
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/admin/trash")
    public ResponseEntity<List<Order>> getTrashedOrdersAdmin(HttpServletRequest request) {
        if (!request.isUserInRole("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(orderService.getTrashedOrders());
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteOrderAdmin(HttpServletRequest request, @PathVariable Long id) {
        if (!request.isUserInRole("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        orderService.deleteOrder(id);
        return ResponseEntity.ok(Map.of("message", "Order moved to trash"));
    }

    @PostMapping("/admin/{id}/restore")
    public ResponseEntity<?> restoreOrderAdmin(HttpServletRequest request, @PathVariable Long id) {
        if (!request.isUserInRole("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        orderService.restoreOrder(id);
        return ResponseEntity.ok(Map.of("message", "Order restored"));
    }

    @DeleteMapping("/admin/{id}/hard")
    public ResponseEntity<?> deleteOrderHardAdmin(HttpServletRequest request, @PathVariable Long id) {
        if (!request.isUserInRole("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        orderService.deleteOrderHard(id);
        return ResponseEntity.ok(Map.of("message", "Order deleted permanently"));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        if (!request.isUserInRole("ADMIN") && !request.isUserInRole("PHARMACIST")) {
            return ResponseEntity.status(403).build();
        }
        com.medcare.orderservice.entity.OrderStatus status = com.medcare.orderservice.entity.OrderStatus
                .valueOf(body.get("status"));
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @PutMapping("/internal/{orderCode}/payment-status")
    public ResponseEntity<Void> updatePaymentStatus(
            @PathVariable String orderCode,
            @RequestParam String status) {
        orderService.updatePaymentStatusByCode(orderCode, status);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/internal/{orderCode}/status")
    public ResponseEntity<Void> updateOrderStatusInternal(
            @PathVariable String orderCode,
            @RequestBody OrderStatusUpdateRequest request) {
        orderService.updateOrderStatusInternal(orderCode, request.getStatus());
        return ResponseEntity.ok().build();
    }
}
