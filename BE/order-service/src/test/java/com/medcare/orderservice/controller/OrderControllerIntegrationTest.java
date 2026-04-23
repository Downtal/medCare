package com.medcare.orderservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medcare.orderservice.client.InventoryClient;
import com.medcare.orderservice.client.ProductClient;
import com.medcare.orderservice.client.PromotionClient;
import com.medcare.orderservice.client.ShippingClient;
import com.medcare.orderservice.dto.OrderItemRequest;
import com.medcare.orderservice.dto.OrderRequest;
import com.medcare.orderservice.entity.PaymentMethod;
import com.medcare.orderservice.service.CartService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(scripts = "/data-test.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
public class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductClient productClient;

    @MockBean
    private InventoryClient inventoryClient;

    @MockBean
    private ShippingClient shippingClient;

    @MockBean
    private PromotionClient promotionClient;

    @MockBean
    private CartService cartService;

    @Test
    void shouldGetMyOrdersSuccessfully() throws Exception {
        mockMvc.perform(get("/api/orders/my-orders")
                .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].orderCode").value("ORD-TEST-002"))
                .andExpect(jsonPath("$[1].orderCode").value("ORD-TEST-001"));
    }

    @Test
    void shouldReturn403WhenNoUserIdInGetMyOrders() throws Exception {
        mockMvc.perform(get("/api/orders/my-orders"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldGetOrderDetailByCode() throws Exception {
        mockMvc.perform(get("/api/orders/ORD-TEST-001")
                .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderCode").value("ORD-TEST-001"))
                .andExpect(jsonPath("$.recipientName").value("John Doe"))
                .andExpect(jsonPath("$.items.length()").value(2));
    }

    @Test
    void shouldCheckoutSuccessfully() throws Exception {
        // Mocking ProductClient response
        ProductClient.ProductDto product = new ProductClient.ProductDto();
        product.setId(101L);
        product.setName("Paracetamol");
        product.setPrice(BigDecimal.valueOf(25000));
        product.setPrimaryImageUrl("paracetamol.jpg");
        product.setRequiresPrescription(false);

        when(productClient.getProductById(anyLong())).thenReturn(product);

        OrderRequest request = new OrderRequest();
        request.setRecipientName("Jane Doe");
        request.setRecipientPhone("0987654321");
        request.setStreet("456 Second St");
        request.setWard("Ward 2");
        request.setDistrict("District 2");
        request.setProvince("City 1");
        request.setPaymentMethod(PaymentMethod.COD);
        request.setItems(List.of(new OrderItemRequest(101L, 2, "hộp")));

        mockMvc.perform(post("/api/orders/checkout")
                .header("X-User-Id", "2")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipientName").value("Jane Doe"))
                .andExpect(jsonPath("$.orderCode").exists())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void shouldReturn400WhenCheckoutWithInvalidPayload() throws Exception {
        OrderRequest request = new OrderRequest();
        // Missing required fields

        mockMvc.perform(post("/api/orders/checkout")
                .header("X-User-Id", "2")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
