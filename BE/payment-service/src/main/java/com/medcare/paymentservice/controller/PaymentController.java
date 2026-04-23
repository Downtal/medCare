package com.medcare.paymentservice.controller;

import com.medcare.paymentservice.dto.PaymentRequest;
import com.medcare.paymentservice.dto.PaymentResponse;
import com.medcare.paymentservice.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create")
    public ResponseEntity<?> createPayment(
            @RequestBody PaymentRequest paymentRequest,
            HttpServletRequest request) {
        try {
            return ResponseEntity.ok(paymentService.createPaymentUrl(paymentRequest, request));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("status", "error", "message", e.getMessage(), "stack", e.toString()));
        }
    }

    @GetMapping("/vnpay-ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paymentService.processIpn(params));
    }

    @GetMapping("/vnpay-callback")
    public ResponseEntity<?> vnpayCallback(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(paymentService.verifyCallback(params));
    }
}
