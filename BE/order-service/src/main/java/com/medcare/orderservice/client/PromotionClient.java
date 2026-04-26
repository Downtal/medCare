package com.medcare.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.math.BigDecimal;

@FeignClient(name = "promotion-service")
public interface PromotionClient {
    
    @PostMapping("/api/vouchers/record-usage")
    void recordUsage(@RequestParam("code") String code, 
                     @RequestParam("userId") Long userId, 
                     @RequestParam("orderId") Long orderId, 
                     @RequestParam("amountSaved") BigDecimal amountSaved);

    @PostMapping("/api/vouchers/rollback-usage")
    void rollbackUsage(@RequestParam("code") String code, 
                       @RequestParam("userId") Long userId);
}
