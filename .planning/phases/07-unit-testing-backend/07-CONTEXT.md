# Phase 7: Unit Testing — Backend Services

## Mục tiêu
Thiết lập cơ sở hạ tầng kiểm thử và viết unit tests cho tất cả 5 Service quan trọng trong hệ thống MedCare backend. Coverage target: 30–50%.

## Công nghệ sử dụng
- **JUnit 5** — Test framework (đã có trong Spring Boot Starter Test)
- **Mockito** — Mock dependencies (đã có trong Spring Boot Starter Test)
- **Spring Boot Starter Test** — Cần thêm vào `testImplementation` trong từng `build.gradle`
- **H2** — In-memory database cho các test cần JPA

## Services cần test
1. `OrderService` — Logic tạo đơn, selective checkout, tính tổng
2. `PaymentService` — Tạo VNPay URL, xử lý IPN callback, cập nhật trạng thái
3. `ShippingService` — Tính phí GHN (callGHN mock), tạo vận đơn
4. `PromotionService` — Validate voucher, tính discount, giới hạn sử dụng
5. `CartService` — Thêm/xóa item, serialize/deserialize Redis

## Chiến lược Mocking
- Tất cả external clients (OpenFeign: ProductClient, InventoryClient, PromotionClient, ShippingClient) → dùng `@MockBean` / `@Mock`
- Redis (`RedisTemplate`) → dùng `@Mock`
- Repository JPA → dùng `@Mock` với Mockito
- Không test HTTP layer ở phase này (đó là Phase 8)

## Phụ thuộc (Dependencies)
Cần thêm vào mỗi service's `build.gradle`:
```
testImplementation 'org.springframework.boot:spring-boot-starter-test'
testImplementation 'com.h2database:h2'
```

## Cấu trúc thư mục
```
src/test/java/com/medcare/{service}/service/
  OrderServiceTest.java
  PaymentServiceTest.java
  ShippingServiceTest.java
  PromotionServiceTest.java
  CartServiceTest.java
src/test/resources/
  application-test.yml
```

## Ghi chú kỹ thuật
- Dùng `@ExtendWith(MockitoExtension.class)` cho pure unit tests
- Dùng `@SpringBootTest` chỉ khi cần Spring context (integration tests — Phase 8)
- Mỗi test method phải có tên rõ ràng: `should{Result}When{Condition}()`
- Cần tạo `application-test.yml` để override cấu hình (DB, Redis, JWT) cho môi trường test
