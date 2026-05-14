package com.medcare.userservice.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "auth-service")
public interface AuthClient {

    @PutMapping("/api/auth/internal/users/{userId}/credentials")
    void updateCredentials(@PathVariable("userId") Long userId, @RequestBody AuthInternalRequest request);

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    class AuthInternalRequest {
        private String email;
        private String phone;
        private String role;
        private String status;
    }
}
