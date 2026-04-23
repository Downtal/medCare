package com.medcare.orderservice.controller;

import com.medcare.orderservice.dto.CartDto;
import com.medcare.orderservice.dto.CartItemRequest;
import com.medcare.orderservice.service.CartService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private static final String GUEST_CART_COOKIE = "CART_GUEST_ID";
    private static final int COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

    @GetMapping("/me")
    public ResponseEntity<CartDto> getMyCart(@AuthenticationPrincipal Object principal,
                                            HttpServletRequest request,
                                            HttpServletResponse response) {
        String userId = principal != null ? principal.toString() : null;
        String cartId = resolveCartId(userId, request, response);
        return ResponseEntity.ok(cartService.getCart(cartId));
    }

    @PostMapping("/me/items")
    public ResponseEntity<String> addItemToMyCart(@AuthenticationPrincipal Object principal,
                                               @RequestBody CartItemRequest item,
                                               HttpServletRequest request,
                                               HttpServletResponse response) {
        String userId = principal != null ? principal.toString() : null;
        String cartId = resolveCartId(userId, request, response);
        cartService.addItemToCart(cartId, item);
        return ResponseEntity.ok("Item added to cart");
    }

    @PutMapping("/me/items/{medicineId}")
    public ResponseEntity<String> updateMyItemQuantity(@AuthenticationPrincipal Object principal,
                                                     @PathVariable Long medicineId,
                                                     @RequestParam int quantity,
                                                     HttpServletRequest request,
                                                     HttpServletResponse response) {
        String userId = principal != null ? principal.toString() : null;
        String cartId = resolveCartId(userId, request, response);
        cartService.updateItemQuantity(cartId, medicineId, quantity);
        return ResponseEntity.ok("Item quantity updated");
    }

    @DeleteMapping("/me/items/{medicineId}")
    public ResponseEntity<String> removeMyItem(@AuthenticationPrincipal Object principal,
                                              @PathVariable Long medicineId,
                                               HttpServletRequest request,
                                               HttpServletResponse response) {
        String userId = principal != null ? principal.toString() : null;
        String cartId = resolveCartId(userId, request, response);
        cartService.removeItem(cartId, medicineId);
        return ResponseEntity.ok("Item removed from cart");
    }

    @DeleteMapping("/me/clear")
    public ResponseEntity<String> clearMyCart(@AuthenticationPrincipal Object principal,
                                             HttpServletRequest request,
                                             HttpServletResponse response) {
        String userId = principal != null ? principal.toString() : null;
        String cartId = resolveCartId(userId, request, response);
        cartService.clearCart(cartId);
        return ResponseEntity.ok("Cart cleared");
    }

    /**
     * Merge guest cart into user cart.
     * Takes guestCartId from cookie and current userId from principal.
     */
    @PostMapping("/merge")
    public ResponseEntity<String> mergeCart(@AuthenticationPrincipal Object principal,
                                            HttpServletRequest request,
                                            HttpServletResponse response) {
        String userId = principal != null ? principal.toString() : null;
        if (userId == null) {
            return ResponseEntity.badRequest().body("Login required for cart merge");
        }

        String guestCartId = getGuestCartIdFromCookie(request);
        if (guestCartId != null) {
            cartService.mergeCart("guest:" + guestCartId, "user:" + userId);
            // Delete guest cookie after merge
            deleteGuestCookie(response);
        }

        return ResponseEntity.ok("Cart merged successfully");
    }

    // --- Helper Methods ---

    private String resolveCartId(String userId, HttpServletRequest request, HttpServletResponse response) {
        if (userId != null && !"anonymousUser".equals(userId)) {
            return "user:" + userId;
        }

        // Handle Guest Session
        String guestId = getGuestCartIdFromCookie(request);
        if (guestId == null) {
            guestId = UUID.randomUUID().toString();
            setGuestCookie(response, guestId);
        }
        return "guest:" + guestId;
    }

    private String getGuestCartIdFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> GUEST_CART_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private void setGuestCookie(HttpServletResponse response, String guestId) {
        Cookie cookie = new Cookie(GUEST_CART_COOKIE, guestId);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(COOKIE_MAX_AGE);
        response.addCookie(cookie);
    }

    private void deleteGuestCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(GUEST_CART_COOKIE, null);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
