package com.medcare.shippingservice.service;

import com.medcare.shippingservice.dto.ShippingFeeRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GHNServiceTest {

    @Mock private RestTemplate restTemplate;

    @InjectMocks private GHNService ghnService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(ghnService, "apiUrl", "https://test.ghn.vn");
        ReflectionTestUtils.setField(ghnService, "apiToken", "TEST_TOKEN");
        ReflectionTestUtils.setField(ghnService, "shopId", "12345");
    }

    @Test
    void shouldCalculateFeeSuccessfully() {
        // Given
        ShippingFeeRequest request = new ShippingFeeRequest();
        request.setToDistrictId(1);
        request.setToWardCode("ward");

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("data", new HashMap<>());

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Object.class)))
                .thenReturn(ResponseEntity.ok(mockResponse));

        // When
        Object result = ghnService.calculateFee(request);

        // Then
        assertNotNull(result);
    }
}
