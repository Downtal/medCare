# Phase 1: Củng cố nền tảng - Research

**Ngày hoàn thành:** 2026-04-22
**Mục tiêu:** Tập trung hóa Redis và JWT vào `common-lib`.

## 1. Cơ chế chia sẻ Bean (Auto-configuration)
Để các microservice con tự động nhận cấu hình từ `common-lib` mà không cần quét gói (package scanning) thủ công:
- Sử dụng cơ chế **Spring Boot Auto-configuration**.
- Tạo file `BE/common-lib/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.
- Khai báo các class cấu hình (ví dụ: `com.medcare.common.config.SharedRedisConfig`).

## 2. Cấu hình Redis dùng chung
Để khắc phục lỗi `ClassCastException` và đảm bảo tính nhất quán:
- **Serializer:** Sử dụng `GenericJackson2JsonRedisSerializer` cho cả Key và Value (hoặc `StringRedisSerializer` cho Key).
- **ObjectMapper:** Cần đăng ký `JavaTimeModule` để xử lý các kiểu dữ liệu thời gian trong Java 8+.
- **Bean:** 
  ```java
  @Bean
  public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
      RedisTemplate<String, Object> template = new RedisTemplate<>();
      template.setConnectionFactory(factory);
      template.setKeySerializer(new StringRedisSerializer());
      template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
      return template;
  }
  ```

## 3. Tập trung hóa JWT và Security
- **JwtService:** Chứa logic tạo, parse và validate token. Sử dụng thư viện `jjwt-api:0.12.6`.
- **JwtAuthenticationFilter:** Một class `OncePerRequestFilter` dùng chung.
- **Security Utility:** Thay vì tạo `SecurityFilterChain` cứng trong `common-lib`, ta nên cung cấp một base config hoặc các component để các service con tự lắp ghép (vì mỗi service có các endpoint public/private khác nhau).

## 4. Cấu trúc thư mục đề xuất cho `common-lib`
```
common-lib/
├── src/main/java/com/medcare/common/
│   ├── config/          # RedisConfig, SecurityConfig base
│   ├── dto/             # ErrorResponse, UserContext
│   ├── exception/       # GlobalExceptionHandler
│   ├── security/        # JwtService, JwtFilter
│   └── util/            # AppConstants
└── src/main/resources/
    └── META-INF/spring/
        └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

## 5. Rủi ro và Giải pháp
- **Xung đột Bean:** Sử dụng `@ConditionalOnMissingBean` để các service con có thể override cấu hình nếu cần thiết.
- **Dependency Hell:** Giữ `common-lib` nhẹ nhàng, chỉ bao gồm các dependency thiết yếu như `spring-boot-starter-security`, `spring-boot-starter-data-redis`, `jjwt`.

## Kết luận
Phương án tập trung hóa qua Auto-configuration là tối ưu nhất, giúp giảm thiểu code lặp lại và đảm bảo tính thống nhất cho toàn bộ hệ thống microservices của MedCare.
