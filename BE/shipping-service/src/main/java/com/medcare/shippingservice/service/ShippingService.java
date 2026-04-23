package com.medcare.shippingservice.service;

import com.medcare.shippingservice.config.GHNConfig;
import com.medcare.shippingservice.dto.*;
import com.medcare.shippingservice.entity.Shipment;
import com.medcare.shippingservice.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShippingService {

    private final GHNConfig ghnConfig;
    private final ShipmentRepository shipmentRepository;
    private final RestTemplate restTemplate;

    @Transactional
    public Shipment createShippingOrder(ShippingRequest request) {
        log.info("Creating shipping order for: {}", request.getOrderCode());

        // Check if already created
        if (shipmentRepository.findByOrderCode(request.getOrderCode()).isPresent()) {
            throw new RuntimeException("Shipping order already exists for order code: " + request.getOrderCode());
        }

        // Map request to GHN payload
        GHNCreateOrderRequest ghnRequest = GHNCreateOrderRequest.builder()
                .paymentTypeId(request.getCodAmount() > 0 ? 2 : 1) // 2: Khách trả (COD), 1: Shop trả
                .note("Đơn hàng từ MedCare")
                .requiredNote("CHOXEMHANGKHONGTHU")
                .clientOrderCode(request.getOrderCode())
                .toName(request.getToName())
                .toPhone(request.getToPhone())
                .toAddress(request.getToAddress())
                .toWardCode(request.getToWardCode())
                .toDistrictId(request.getToDistrictId())
                .codAmount(request.getCodAmount())
                .content("Sản phẩm từ MedCare")
                .weight(500) // Default weight 500g for now, should calculate based on items
                .length(20)
                .width(20)
                .height(10)
                .insuranceValue(request.getInsuranceValue() != null ? request.getInsuranceValue() : request.getCodAmount())
                .items(request.getItems().stream().map(item -> GHNCreateOrderRequest.Item.builder()
                        .name(item.getName())
                        .code(item.getCode())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .weight(100) // Default 100g per item
                        .build()).collect(Collectors.toList()))
                .build();

        // Prepare headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", ghnConfig.getToken());
        headers.set("ShopId", ghnConfig.getShopId());

        HttpEntity<GHNCreateOrderRequest> entity = new HttpEntity<>(ghnRequest, headers);

        try {
            // Call GHN API
            String url = ghnConfig.getApiUrl() + "/shipping-order/create";
            GHNCreateOrderResponse response = restTemplate.postForObject(url, entity, GHNCreateOrderResponse.class);

            if (response != null && response.getCode() == 200 && response.getData() != null) {
                // Save to DB
                Shipment shipment = Shipment.builder()
                        .orderCode(request.getOrderCode())
                        .trackingCode(response.getData().getOrderCode())
                        .provider("GHN")
                        .status(Shipment.ShippingStatus.CREATED)
                        .build();
                return shipmentRepository.save(shipment);
            } else {
                String errorMsg = response != null ? response.getMessage() : "Unknown error from GHN";
                log.error("Failed to create GHN order: {}", errorMsg);
                throw new RuntimeException("GHN API Error: " + errorMsg);
            }
        } catch (Exception e) {
            log.error("Exception when calling GHN API", e);
            throw new RuntimeException("Cannot create shipping order: " + e.getMessage());
        }
    }

    @Transactional
    public void processWebhook(GHNWebhookRequest request, String token) {
        log.info("Processing GHN Webhook for Tracking: {}, Status: {}", request.getOrderCode(), request.getStatus());

        // Simple token validation (optional, depending on GHN config)
        if (token != null && !token.equals(ghnConfig.getToken())) {
            throw new SecurityException("Invalid webhook token");
        }

        String trackingCode = request.getOrderCode();
        Shipment shipment = shipmentRepository.findByTrackingCode(trackingCode)
                .orElseGet(() -> {
                    // If not found by tracking code, try client order code
                    return shipmentRepository.findByOrderCode(request.getClientOrderCode())
                            .orElseThrow(() -> new RuntimeException("Shipment not found for tracking: " + trackingCode));
                });

        // Map GHN status to our internal status
        String ghnStatus = request.getStatus().toLowerCase();
        if (ghnStatus.contains("delivered")) {
            shipment.setStatus(Shipment.ShippingStatus.DELIVERED);
        } else if (ghnStatus.contains("cancel")) {
            shipment.setStatus(Shipment.ShippingStatus.CANCELLED);
        } else if (ghnStatus.contains("return")) {
            shipment.setStatus(Shipment.ShippingStatus.RETURNED);
        } else if (ghnStatus.contains("shipping") || ghnStatus.contains("picked")) {
            shipment.setStatus(Shipment.ShippingStatus.SHIPPING);
        }

        shipmentRepository.save(shipment);
        log.info("Updated shipment {} to status {}", shipment.getOrderCode(), shipment.getStatus());
    }

    public Object getTrackingHistory(String trackingCode) {
        log.info("Fetching tracking history for: {}", trackingCode);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", ghnConfig.getToken());

        // GHN API v2 for order detail uses a body with order_code
        Map<String, String> body = Collections.singletonMap("order_code", trackingCode);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            String url = ghnConfig.getApiUrl() + "/shipping-order/detail";
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map data = (Map) response.getBody().get("data");
                if (data != null) {
                    return data.get("log"); // The logs array
                }
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Error fetching tracking history from GHN", e);
            return Collections.emptyList();
        }
    }
}
