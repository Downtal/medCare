package com.medcare.paymentservice.service;

import com.medcare.paymentservice.client.OrderClient;
import com.medcare.paymentservice.config.VNPayConfig;
import com.medcare.paymentservice.dto.PaymentRequest;
import com.medcare.paymentservice.dto.PaymentResponse;
import com.medcare.paymentservice.entity.Payment;
import com.medcare.paymentservice.entity.Payment.PaymentStatus;
import com.medcare.paymentservice.repository.PaymentLogRepository;
import com.medcare.paymentservice.repository.PaymentRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private VNPayConfig vnPayConfig;
    @Mock private PaymentRepository paymentRepository;
    @Mock private PaymentLogRepository paymentLogRepository;
    @Mock private OrderClient orderClient;
    @Mock private HttpServletRequest httpServletRequest;

    @InjectMocks private PaymentService paymentService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void shouldCreatePaymentUrlSuccessfully() {
        // Given
        when(vnPayConfig.getTmnCode()).thenReturn("TEST_TMN");
        when(vnPayConfig.getReturnUrl()).thenReturn("http://test.com/return");
        when(vnPayConfig.getHashSecret()).thenReturn("TEST_SECRET");
        when(vnPayConfig.getPayUrl()).thenReturn("https://test.vnpay.vn/pay");

        PaymentRequest request = new PaymentRequest();
        request.setOrderCode("ORD123");
        request.setAmount(BigDecimal.valueOf(100000));
        request.setDescription("Payment for ORD123");

        when(httpServletRequest.getRemoteAddr()).thenReturn("127.0.0.1");
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        PaymentResponse response = paymentService.createPaymentUrl(request, httpServletRequest);

        // Then
        assertNotNull(response);
        assertTrue(response.getPaymentUrl().contains("vnp_TmnCode=TEST_TMN"));
        assertTrue(response.getPaymentUrl().contains("vnp_Amount=10000000"));
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void shouldProcessIPNSuccessfullyWhenStatusIs00() {
        // Given
        String hashSecret = "TEST_SECRET";
        when(vnPayConfig.getHashSecret()).thenReturn(hashSecret);

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_TxnRef", "ORD123-12345");
        params.put("vnp_Amount", "10000000");
        params.put("vnp_ResponseCode", "00");

        // Calculate real hash for validation to pass
        StringBuilder hashData = new StringBuilder();
        hashData.append("vnp_Amount=10000000&vnp_ResponseCode=00&vnp_TxnRef=ORD123-12345");
        String signValue = com.medcare.paymentservice.util.VNPayUtil.hmacSHA512(hashSecret, hashData.toString());
        params.put("vnp_SecureHash", signValue);

        Payment payment = new Payment();
        payment.setId(1L);
        payment.setTransactionId("ORD123-12345");
        payment.setAmount(BigDecimal.valueOf(100000));
        payment.setStatus(PaymentStatus.PENDING);

        when(paymentRepository.findByTransactionId("ORD123-12345")).thenReturn(java.util.Optional.of(payment));
        when(paymentRepository.save(any())).thenReturn(payment);

        // When
        Map<String, String> response = paymentService.processIpn(params);

        // Then
        assertEquals("00", response.get("RspCode"));
        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        verify(orderClient).updatePaymentStatus("ORD123", "PAID");
        verify(paymentLogRepository).save(any());
    }

    @Test
    void shouldRejectIPNWhenChecksumInvalid() {
        // Given
        when(vnPayConfig.getHashSecret()).thenReturn("SECRET");
        Map<String, String> params = new HashMap<>();
        params.put("vnp_SecureHash", "WRONG_HASH");

        // When
        Map<String, String> response = paymentService.processIpn(params);

        // Then
        assertEquals("97", response.get("RspCode"));
        verify(paymentRepository, never()).findByTransactionId(any());
    }

    @Test
    void shouldReturnErrorWhenOrderNotFound() {
        // Given
        String hashSecret = "SECRET";
        when(vnPayConfig.getHashSecret()).thenReturn(hashSecret);
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_TxnRef", "NOT_FOUND");
        params.put("vnp_SecureHash", com.medcare.paymentservice.util.VNPayUtil.hmacSHA512(hashSecret, "vnp_TxnRef=NOT_FOUND"));

        when(paymentRepository.findByTransactionId("NOT_FOUND")).thenReturn(java.util.Optional.empty());

        // When
        Map<String, String> response = paymentService.processIpn(params);

        // Then
        assertEquals("01", response.get("RspCode"));
    }
}
