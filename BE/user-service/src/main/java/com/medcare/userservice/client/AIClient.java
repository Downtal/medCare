package com.medcare.userservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "ai-service")
public interface AIClient {

    @PostMapping("/api/ai/prescriptions/analyze")
    Map<String, Object> analyzePrescription(@RequestBody Map<String, String> request);
}
