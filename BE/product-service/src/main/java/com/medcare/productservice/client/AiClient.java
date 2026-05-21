package com.medcare.productservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "ai-service")
public interface AiClient {

    @DeleteMapping("/api/ai/admin/products/{productId}")
    void deleteProductMapping(
        @PathVariable("productId") Long productId,
        @RequestHeader("X-User-Role") String role
    );

    @org.springframework.web.bind.annotation.PutMapping("/api/ai/admin/products/{productId}")
    void updateProductMapping(
        @PathVariable("productId") Long productId,
        @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, String> request,
        @RequestHeader("X-User-Role") String role
    );

    @org.springframework.web.bind.annotation.PostMapping("/api/ai/admin/products/{productId}/sync")
    void syncProduct(
        @PathVariable("productId") Long productId,
        @RequestHeader("X-User-Role") String role
    );
}
