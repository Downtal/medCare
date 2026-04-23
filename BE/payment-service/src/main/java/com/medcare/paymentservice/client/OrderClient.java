package com.medcare.paymentservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "order-service")
public interface OrderClient {
    @PutMapping("/api/orders/internal/{orderCode}/payment-status")
    void updatePaymentStatus(
            @PathVariable("orderCode") String orderCode,
            @RequestParam("status") String status
    );
}
