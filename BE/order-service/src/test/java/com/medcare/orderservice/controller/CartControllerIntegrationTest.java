package com.medcare.orderservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medcare.orderservice.dto.CartDto;
import com.medcare.orderservice.dto.CartItemDto;
import com.medcare.orderservice.dto.CartItemRequest;
import com.medcare.orderservice.service.CartService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CartControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CartService cartService;

    @Test
    void shouldGetGuestCartWhenNotAuthenticated() throws Exception {
        CartDto cartDto = CartDto.builder()
                .cartId("guest:test-guest")
                .items(List.of())
                .totalAmount(BigDecimal.ZERO)
                .build();

        when(cartService.getCart(anyString())).thenReturn(cartDto);

        mockMvc.perform(get("/api/cart/me")
                .cookie(new Cookie("CART_GUEST_ID", "test-guest")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cartId").value("guest:test-guest"));
        
        verify(cartService).getCart("guest:test-guest");
    }

    @Test
    void shouldAddItemToCart() throws Exception {
        CartItemRequest request = new CartItemRequest();
        request.setMedicineId(101L);
        request.setQuantity(2);

        mockMvc.perform(post("/api/cart/me/items")
                .cookie(new Cookie("CART_GUEST_ID", "test-guest"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Item added to cart"));

        verify(cartService).addItemToCart(anyString(), any(CartItemRequest.class));
    }

    @Test
    void shouldUpdateItemQuantity() throws Exception {
        mockMvc.perform(put("/api/cart/me/items/101")
                .cookie(new Cookie("CART_GUEST_ID", "test-guest"))
                .param("quantity", "5"))
                .andExpect(status().isOk())
                .andExpect(content().string("Item quantity updated"));

        verify(cartService).updateItemQuantity(anyString(), anyLong(), any(Integer.class));
    }

    @Test
    void shouldRemoveItemFromCart() throws Exception {
        mockMvc.perform(delete("/api/cart/me/items/101")
                .cookie(new Cookie("CART_GUEST_ID", "test-guest")))
                .andExpect(status().isOk())
                .andExpect(content().string("Item removed from cart"));

        verify(cartService).removeItem(anyString(), anyLong());
    }

    @Test
    void shouldClearCart() throws Exception {
        mockMvc.perform(delete("/api/cart/me/clear")
                .cookie(new Cookie("CART_GUEST_ID", "test-guest")))
                .andExpect(status().isOk())
                .andExpect(content().string("Cart cleared"));

        verify(cartService).clearCart(anyString());
    }
}
