package com.medcare.shippingservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medcare.shippingservice.dto.ShippingFeeRequest;
import com.medcare.shippingservice.dto.ShippingRequest;
import com.medcare.shippingservice.entity.Shipment;
import com.medcare.shippingservice.service.GHNService;
import com.medcare.shippingservice.service.ShippingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ShippingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ShippingService shippingService;

    @MockBean
    private GHNService ghnService;

    @Test
    void shouldCalculateFee() throws Exception {
        ShippingFeeRequest request = new ShippingFeeRequest();
        request.setToDistrictId(1491);
        request.setToWardCode("20308");

        Map<String, Object> mockResponse = Map.of("code", 200, "data", Map.of("total", 30000));
        when(ghnService.calculateFee(any(ShippingFeeRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/shipping/fee")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(30000));
    }

    @Test
    void shouldGetProvinces() throws Exception {
        List<Map<String, Object>> mockProvinces = List.of(Map.of("ProvinceID", 201, "ProvinceName", "Hà Nội"));
        when(ghnService.getProvinces()).thenReturn(mockProvinces);

        mockMvc.perform(get("/api/shipping/provinces"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ProvinceName").value("Hà Nội"));
    }

    @Test
    void shouldCreateInternalShippingOrder() throws Exception {
        ShippingRequest request = new ShippingRequest();
        request.setOrderCode("MC123");
        request.setToName("Test User");
        request.setToPhone("0987654321");
        request.setToAddress("Address");
        request.setCodAmount(100000);
        request.setItems(Collections.emptyList());

        Shipment mockShipment = Shipment.builder()
                .id(1L)
                .orderCode("MC123")
                .trackingCode("GHN123")
                .status(Shipment.ShippingStatus.CREATED)
                .build();

        when(shippingService.createShippingOrder(any(ShippingRequest.class))).thenReturn(mockShipment);

        mockMvc.perform(post("/api/shipping/internal/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingCode").value("GHN123"));
    }
}
