package com.medcare.shippingservice.service;

import com.medcare.shippingservice.config.GHNConfig;
import com.medcare.shippingservice.dto.ShippingRequest;
import com.medcare.shippingservice.entity.Shipment;
import com.medcare.shippingservice.repository.ShipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShippingServiceTest {

    @Mock private GHNConfig ghnConfig;
    @Mock private ShipmentRepository shipmentRepository;
    @Mock private RestTemplate restTemplate;

    @InjectMocks private ShippingService shippingService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void shouldGetTrackingHistorySuccessfully() {
        // Given
        String trackingCode = "GHN123";
        when(ghnConfig.getApiUrl()).thenReturn("https://test.ghn.vn");
        when(ghnConfig.getToken()).thenReturn("TEST_TOKEN");

        Map<String, Object> mockLog = new HashMap<>();
        mockLog.put("status", "delivered");
        List<Map<String, Object>> logs = List.of(mockLog);
        
        Map<String, Object> mockData = new HashMap<>();
        mockData.put("log", logs);
        
        Map<String, Object> mockResponseMap = new HashMap<>();
        mockResponseMap.put("data", mockData);

        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(mockResponseMap));

        // When
        Object result = shippingService.getTrackingHistory(trackingCode);

        // Then
        assertNotNull(result);
        assertTrue(result instanceof List);
        assertEquals(1, ((List) result).size());
    }

    @Test
    void shouldCreateShippingOrderSuccessfully() {
        // Given
        ShippingRequest request = new ShippingRequest();
        request.setOrderCode("ORD123");
        request.setToName("Receiver");
        request.setToPhone("0123456789");
        request.setItems(List.of());
        request.setCodAmount(0); // Fix NPE

        when(ghnConfig.getApiUrl()).thenReturn("https://test.ghn.vn");
        when(ghnConfig.getToken()).thenReturn("TEST_TOKEN");
        when(ghnConfig.getShopId()).thenReturn("12345");

        when(shipmentRepository.findByOrderCode("ORD123")).thenReturn(Optional.empty());
        
        com.medcare.shippingservice.dto.GHNCreateOrderResponse.Data mockData = new com.medcare.shippingservice.dto.GHNCreateOrderResponse.Data();
        mockData.setOrderCode("GHN123");
        com.medcare.shippingservice.dto.GHNCreateOrderResponse mockResponse = new com.medcare.shippingservice.dto.GHNCreateOrderResponse();
        mockResponse.setCode(200);
        mockResponse.setData(mockData);

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(com.medcare.shippingservice.dto.GHNCreateOrderResponse.class)))
                .thenReturn(mockResponse);
        when(shipmentRepository.save(any(Shipment.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        Shipment result = shippingService.createShippingOrder(request);

        // Then
        assertNotNull(result);
        assertEquals("GHN123", result.getTrackingCode());
        assertEquals("ORD123", result.getOrderCode());
    }

    @Test
    void shouldThrowExceptionWhenOrderAlreadyHasShipping() {
        // Given
        ShippingRequest request = new ShippingRequest();
        request.setOrderCode("ORD123");
        when(shipmentRepository.findByOrderCode("ORD123")).thenReturn(Optional.of(new Shipment()));

        // When & Then
        assertThrows(RuntimeException.class, () -> shippingService.createShippingOrder(request));
    }
}
