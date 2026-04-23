package com.medcare.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.medcare.orderservice.dto.ShippingRequestDto;

@FeignClient(name = "shipping-service")
public interface ShippingClient {

    @PostMapping("/api/shipping/internal/create")
    Object createShippingOrder(@RequestBody ShippingRequestDto request);
}
