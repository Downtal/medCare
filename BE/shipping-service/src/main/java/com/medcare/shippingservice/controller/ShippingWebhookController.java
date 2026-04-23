package com.medcare.shippingservice.controller;

import com.medcare.shippingservice.dto.GHNWebhookRequest;
import com.medcare.shippingservice.service.ShippingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/shipping/webhook")
@RequiredArgsConstructor
public class ShippingWebhookController {

    private final ShippingService shippingService;

    @PostMapping("/ghn")
    public ResponseEntity<String> handleGHNWebhook(
            @RequestHeader(value = "Token", required = false) String token,
            @RequestBody GHNWebhookRequest request) {
        
        log.info("Received GHN Webhook: {}", request);
        
        try {
            shippingService.processWebhook(request, token);
            return ResponseEntity.ok("Webhook processed successfully");
        } catch (SecurityException e) {
            return ResponseEntity.status(401).body("Unauthorized: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error processing GHN webhook", e);
            return ResponseEntity.status(500).body("Internal Server Error: " + e.getMessage());
        }
    }
}
