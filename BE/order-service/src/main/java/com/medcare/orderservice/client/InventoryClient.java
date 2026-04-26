package com.medcare.orderservice.client;

import com.medcare.orderservice.dto.StockDeductRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "inventory-service")
public interface InventoryClient {

    @PostMapping("/api/inventory/internal/deduct")
    void deductStock(@RequestBody StockDeductRequest request);

    @PostMapping("/api/inventory/internal/restore")
    void restoreStock(@org.springframework.web.bind.annotation.RequestParam("orderCode") String orderCode);
}
