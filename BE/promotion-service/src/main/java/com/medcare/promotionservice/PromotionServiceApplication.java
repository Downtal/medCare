package com.medcare.promotionservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class PromotionServiceApplication {
    public static void main(String[] args) {
        // Load .env file manually into System properties
        try {
            io.github.cdimascio.dotenv.Dotenv dotenv = io.github.cdimascio.dotenv.Dotenv.configure()
                    .directory("../") // .env nằm ở thư mục /BE (cha của /service)
                    .ignoreIfMissing()
                    .load();
            dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
        } catch (Exception e) {
            System.err.println("Note: .env file not found or could not be loaded: " + e.getMessage());
        }

        SpringApplication.run(PromotionServiceApplication.class, args);
    }
}
