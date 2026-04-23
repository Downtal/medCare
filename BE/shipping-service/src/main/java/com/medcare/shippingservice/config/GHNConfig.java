package com.medcare.shippingservice.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class GHNConfig {
    @Value("${ghn.api.url}")
    private String apiUrl;

    @Value("${ghn.api.token}")
    private String token;

    @Value("${ghn.api.shopId}")
    private String shopId;

    @Value("${ghn.webhook.secret-key}")
    private String webhookSecretKey;
}
