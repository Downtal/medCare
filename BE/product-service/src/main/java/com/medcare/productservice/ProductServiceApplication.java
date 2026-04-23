package com.medcare.productservice;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableCaching
@org.springframework.scheduling.annotation.EnableScheduling
public class ProductServiceApplication {
    public static void main(String[] args) {
        // Tự động tìm .env ở thư mục hiện tại hoặc thư mục cha (thường là BE/)
        Dotenv dotenv = Dotenv.configure()
                .ignoreIfMissing()
                .directory("../") // Thư mục cha
                .load();

        dotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
        });

        // Thử load thêm ở thư mục hiện tại nếu không thấy ở thư mục cha
        Dotenv localDotenv = Dotenv.configure().ignoreIfMissing().load();
        localDotenv.entries().forEach(entry -> {
            System.setProperty(entry.getKey(), entry.getValue());
        });

        SpringApplication.run(ProductServiceApplication.class, args);
    }
}
