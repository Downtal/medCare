package com.medcare.authservice.client;

import com.medcare.authservice.dto.UserProfileRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign client to communicate with user-service.
 * user-service is registered in Eureka as "user-service".
 */
@FeignClient(name = "user-service", path = "/api/users")
public interface UserClient {

    @PostMapping("/profiles")
    void createProfile(@RequestBody UserProfileRequest request);

    @org.springframework.web.bind.annotation.GetMapping("/profiles/{userId}")
    com.medcare.authservice.dto.UserProfileResponse getProfile(@org.springframework.web.bind.annotation.PathVariable("userId") Long userId);

    @org.springframework.web.bind.annotation.PutMapping("/profiles/{userId}")
    void updateProfile(@org.springframework.web.bind.annotation.PathVariable("userId") Long userId, @RequestBody UserProfileRequest request);
}
