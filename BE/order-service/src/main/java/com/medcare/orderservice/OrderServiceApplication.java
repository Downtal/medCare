package com.medcare.orderservice;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication(scanBasePackages = "com.medcare")
@EnableDiscoveryClient
@EnableFeignClients
@org.springframework.scheduling.annotation.EnableScheduling
public class OrderServiceApplication {

    public static void main(String[] args) {
        // Load .env from parent directory (BE/)
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .directory("../")
                .load();

        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
        });

        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
