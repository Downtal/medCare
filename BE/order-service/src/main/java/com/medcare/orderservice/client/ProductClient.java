package com.medcare.orderservice.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.math.BigDecimal;

@FeignClient(name = "product-service")
public interface ProductClient {
    
    @GetMapping("/api/products/{id}")
    ProductDto getProductById(@PathVariable("id") Long id);

    @Data
    class ProductDto {
        private Long id;
        private String name;
        private String slug;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private String primaryImageUrl;
        private String packingUnit;
        private boolean requiresPrescription;
        private Integer stockQuantity;
    }
}
