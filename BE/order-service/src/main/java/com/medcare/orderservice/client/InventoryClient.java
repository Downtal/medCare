package com.medcare.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "inventory-service")
public interface InventoryClient {

    @GetMapping("/api/inventory/product/{productId}/stock")
    Integer getTotalStock(@PathVariable("productId") Long productId);

    @PostMapping("/api/inventory/products/stocks")
    Map<Long, Integer> getStocksBulk(@RequestBody List<Long> productIds);

    @PostMapping("/api/inventory/internal/deduct")
    void deductStock(@RequestBody com.medcare.common.dto.inventory.InventoryDeductRequest request);

    @PostMapping("/api/inventory/internal/restore")
    void restoreStock(@RequestParam("orderCode") String orderCode);
}
