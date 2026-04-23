package com.medcare.productservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "inventory-service")
public interface InventoryClient {

    @GetMapping("/api/inventory/product/{productId}/stock")
    Integer getTotalStock(@PathVariable("productId") Long productId);

    @org.springframework.web.bind.annotation.PostMapping("/api/inventory/products/stocks")
    java.util.Map<Long, Integer> getStocks(@org.springframework.web.bind.annotation.RequestBody java.util.List<Long> productIds);

    @org.springframework.web.bind.annotation.PostMapping("/api/inventory/import")
    void importStock(@org.springframework.web.bind.annotation.RequestBody com.medcare.productservice.dto.InventoryImportRequest request);

    @org.springframework.web.bind.annotation.PostMapping("/api/inventory/internal/events/product-created")
    void onProductCreated(@org.springframework.web.bind.annotation.RequestBody com.medcare.productservice.dto.ProductCreatedEvent event);
}
