package com.medcare.paymentservice.service;

import com.medcare.paymentservice.config.VNPayConfig;
import com.medcare.paymentservice.dto.PaymentRequest;
import com.medcare.paymentservice.dto.PaymentResponse;
import com.medcare.paymentservice.entity.Payment;
import com.medcare.paymentservice.client.OrderClient;
import com.medcare.paymentservice.dto.PaymentResult;
import com.medcare.paymentservice.entity.PaymentLog;
import com.medcare.paymentservice.repository.PaymentLogRepository;
import com.medcare.paymentservice.repository.PaymentRepository;
import com.medcare.paymentservice.util.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final VNPayConfig vnPayConfig;
    private final PaymentRepository paymentRepository;
    private final PaymentLogRepository paymentLogRepository;
    private final OrderClient orderClient;

    @Transactional
    public PaymentResponse createPaymentUrl(PaymentRequest request, HttpServletRequest servletRequest) {
        if (request.getAmount() == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        long amount = request.getAmount().longValue() * 100;
        String vnp_TxnRef = request.getOrderCode() + "-" + System.currentTimeMillis();
        String vnp_IpAddr = VNPayUtil.getIpAddress(servletRequest);

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", request.getDescription());
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        String vnp_TxnRef_val = vnp_Params.get("vnp_TxnRef");

        // Build hash data and query string
        String queryUrl = VNPayUtil.getPaymentStr(vnp_Params);
        
        log.info("VNPay Query String: {}", queryUrl);
        
        String vnp_SecureHash = VNPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), queryUrl);
        log.info("VNPay Calculated Hash: {}", vnp_SecureHash);
        
        String paymentUrl = vnPayConfig.getPayUrl() + "?" + queryUrl + "&vnp_SecureHash=" + vnp_SecureHash;
        log.info("VNPay Final URL: {}", paymentUrl);

        // Save to DB
        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .orderCode(request.getOrderCode())
                .provider("VNPAY")
                .amount(request.getAmount())
                .status(Payment.PaymentStatus.PENDING)
                .transactionId(vnp_TxnRef)
                .build();
        paymentRepository.save(payment);

        return PaymentResponse.builder()
                .status("OK")
                .message("Successfully created payment URL")
                .paymentUrl(paymentUrl)
                .build();
    }

    @Transactional
    public Map<String, String> processIpn(Map<String, String> params) {
        log.info("VNPay IPN Received: {}", params);
        Map<String, String> response = new HashMap<>();
        try {
            // 1. Check signature
            String vnp_SecureHash = params.get("vnp_SecureHash");
            Map<String, String> hashParams = new HashMap<>(params);
            hashParams.remove("vnp_SecureHashType");
            hashParams.remove("vnp_SecureHash");

            String hashData = VNPayUtil.getPaymentStr(hashParams);
            String signValue = VNPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData);

            if (!signValue.equalsIgnoreCase(vnp_SecureHash)) {
                log.error("VNPay IPN Invalid Checksum. Expected: {}, Got: {}", signValue, vnp_SecureHash);
                response.put("RspCode", "97");
                response.put("Message", "Invalid Checksum");
                return response;
            }

            // 2. Check Order
            String vnp_TxnRef = params.get("vnp_TxnRef");
            Optional<Payment> paymentOpt = paymentRepository.findByTransactionId(vnp_TxnRef);

            if (paymentOpt.isEmpty()) {
                response.put("RspCode", "01");
                response.put("Message", "Order not found");
                return response;
            }

            Payment payment = paymentOpt.get();

            // 3. Check Amount
            long vnp_Amount = Long.parseLong(params.get("vnp_Amount")) / 100;
            if (payment.getAmount().longValue() != vnp_Amount) {
                response.put("RspCode", "04");
                response.put("Message", "Invalid amount");
                return response;
            }

            // 4. Check status (Idempotency)
            if (payment.getStatus() != Payment.PaymentStatus.PENDING) {
                response.put("RspCode", "02");
                response.put("Message", "Order already confirmed");
                return response;
            }

            // 5. Update status
            String vnp_ResponseCode = params.get("vnp_ResponseCode");
            if ("00".equals(vnp_ResponseCode)) {
                payment.setStatus(Payment.PaymentStatus.SUCCESS);
                payment.setPaidAt(LocalDateTime.now());
                try {
                    orderClient.updatePaymentStatus(payment.getOrderCode(), "PAID");
                } catch (Exception e) {
                    log.error("Failed to update order status to PAID: {}", e.getMessage());
                }
            } else {
                payment.setStatus(Payment.PaymentStatus.FAILED);
                try {
                    orderClient.updatePaymentStatus(payment.getOrderCode(), "FAILED");
                } catch (Exception e) {
                    log.error("Failed to update order status to FAILED: {}", e.getMessage());
                }
            }
            paymentRepository.save(payment);

            // Log
            paymentLogRepository.save(PaymentLog.builder()
                    .paymentId(payment.getId())
                    .rawResponse(params.toString())
                    .build());

            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");

        } catch (Exception e) {
            log.error("VNPay IPN Error: ", e);
            response.put("RspCode", "99");
            response.put("Message", "Unknown error: " + e.getMessage());
        }
        return response;
    }

    @Transactional
    public PaymentResult verifyCallback(Map<String, String> params) {
        log.info("VNPay Callback Received: {}", params);
        
        String vnp_SecureHash = params.get("vnp_SecureHash");
        Map<String, String> hashParams = new HashMap<>(params);
        hashParams.remove("vnp_SecureHashType");
        hashParams.remove("vnp_SecureHash");

        String hashData = VNPayUtil.getPaymentStr(hashParams);
        String signValue = VNPayUtil.hmacSHA512(vnPayConfig.getHashSecret(), hashData);

        String vnp_ResponseCode = params.get("vnp_ResponseCode");
        boolean isSuccess = signValue.equalsIgnoreCase(vnp_SecureHash) && "00".equals(vnp_ResponseCode);
        
        // Active update if success (in case IPN is slow)
        if (isSuccess) {
            String vnp_TxnRef = params.get("vnp_TxnRef");
            paymentRepository.findByTransactionId(vnp_TxnRef).ifPresent(payment -> {
                if (payment.getStatus() == Payment.PaymentStatus.PENDING) {
                    payment.setStatus(Payment.PaymentStatus.SUCCESS);
                    payment.setPaidAt(LocalDateTime.now());
                    paymentRepository.save(payment);
                    try {
                        orderClient.updatePaymentStatus(payment.getOrderCode(), "PAID");
                    } catch (Exception e) {
                        log.error("Failed to update order status in callback: {}", e.getMessage());
                    }
                }
            });
        }
        
        return PaymentResult.builder()
                .orderId(params.get("vnp_TxnRef"))
                .amount(String.valueOf(Long.parseLong(params.get("vnp_Amount")) / 100))
                .responseCode(vnp_ResponseCode)
                .transactionNo(params.get("vnp_TransactionNo"))
                .success(isSuccess)
                .message(isSuccess ? "Thanh toán thành công" : "Thanh toán không thành công hoặc chữ ký không hợp lệ")
                .build();
    }
}
