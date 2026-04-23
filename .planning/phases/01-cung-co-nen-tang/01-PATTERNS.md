# Phase 1: Củng cố nền tảng - Pattern Map

**Ngày hoàn thành:** 2026-04-22
**Mục tiêu:** Trích xuất các mẫu code hiện có để tái cấu trúc vào `common-lib`.

## 1. Redis Configuration Pattern
Dựa trên `product-service/config/RedisConfig.java`.

### Đặc điểm chính:
- Sử dụng **Lettuce** làm Redis Client.
- Hỗ trợ cấu hình SSL (bỏ qua peer verification cho Cloud endpoints).
- Sử dụng `GenericJackson2JsonRedisSerializer` với `ObjectMapper` được cấu hình `DefaultTyping`.

### Code trích đoạn quan trọng:
```java
@Bean
public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.registerModule(new JavaTimeModule());
    objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    objectMapper.activateDefaultTyping(
            objectMapper.getPolymorphicTypeValidator(),
            ObjectMapper.DefaultTyping.NON_FINAL,
            JsonTypeInfo.As.PROPERTY);

    GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(objectMapper);
    // ... config
}
```

## 2. JWT & Security Pattern
Dựa trên `user-service/config/SecurityConfig.java`.

### Đặc điểm chính:
- Sử dụng `io.jsonwebtoken (jjwt)` bản 0.12.6.
- Logic authenticate hỗ trợ cả việc parse Token trực tiếp và đọc Header từ API Gateway (`X-User-Id`, `X-User-Role`).
- Trạng thái bảo mật là `STATELESS`.

### Code trích đoạn quan trọng:
```java
// Logic parse JWT
Claims claims = Jwts.parser()
        .verifyWith(getSignInKey())
        .build()
        .parseSignedClaims(token)
        .getPayload();

// Fallback Gateway Headers
String headerUserId = request.getHeader("X-User-Id");
String headerRole = request.getHeader("X-User-Role");
```

## 3. Các điểm cần cải thiện khi đưa vào common-lib
- **Redundancy:** Loại bỏ việc định nghĩa lại `JwtAuthenticationFilter` trong từng service.
- **Error Handling:** Hiện tại catch Exception và `clearContext()` âm thầm, nên trả về lỗi 401 rõ ràng.
- **ObjectMapper:** Nên tạo một Bean `ObjectMapper` dùng chung trong `common-lib` để đảm bảo tính nhất quán giữa Redis và API.

## Kết luận
Bản đồ pattern này sẽ được sử dụng làm căn cứ để xây dựng các class trong `common-lib`, đảm bảo khi thay thế code cũ, các service con vẫn hoạt động bình thường mà không cần thay đổi logic nghiệp vụ.
