package com.medcare.orderservice.controller;

import com.medcare.orderservice.dto.CartDto;
import com.medcare.orderservice.dto.CartItemDto;
import com.medcare.orderservice.service.CartService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(scripts = "/data-test.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class OrderControllerRecommendationSignalsTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CartService cartService;

    @Test
    void shouldReturnRecommendationSignalsWithStatusFilteringAndCartSnapshot() throws Exception {
        CartItemDto cartItem = CartItemDto.builder()
                .medicineId(501L)
                .quantity(2)
                .unitPrice(BigDecimal.valueOf(10000))
                .totalPrice(BigDecimal.valueOf(20000))
                .build();
        CartDto cart = CartDto.builder()
                .cartId("user:1")
                .items(List.of(cartItem))
                .build();
        when(cartService.getCart("user:1")).thenReturn(cart);

        mockMvc.perform(get("/api/orders/internal/recommendations/signals")
                        .param("userId", "1")
                        .param("days", "60"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.orderSignals.length()").value(1))
                .andExpect(jsonPath("$.orderSignals[0].medicineId").value(103))
                .andExpect(jsonPath("$.orderSignals[0].quantity").value(1))
                .andExpect(jsonPath("$.orderSignals[0].status").value("PAID"))
                .andExpect(jsonPath("$.cartSignals.length()").value(1))
                .andExpect(jsonPath("$.cartSignals[0].medicineId").value(501))
                .andExpect(jsonPath("$.cartSignals[0].quantity").value(2));
    }

    @Test
    void shouldRespectSignalWindowDays() throws Exception {
        CartDto emptyCart = CartDto.builder().cartId("user:1").items(List.of()).build();
        when(cartService.getCart("user:1")).thenReturn(emptyCart);

        mockMvc.perform(get("/api/orders/internal/recommendations/signals")
                        .param("userId", "1")
                        .param("days", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderSignals.length()").value(0));
    }
}
