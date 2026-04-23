# Phase 1: Củng cố nền tảng - Context

**Ngày khởi tạo:** 2026-04-22
**Trạng thái:** Sẵn sàng lập kế hoạch

## Ranh giới giai đoạn (Phase Boundary)
Giai đoạn này tập trung vào việc xử lý các vấn đề kỹ thuật nền tảng (Redis Serialization và JWT Parsing) bằng cách tập trung hóa (Centralize) các logic dùng chung vào module `common-lib`. Điều này giúp hệ thống ổn định và dễ bảo trì hơn trước khi triển khai các tính năng nghiệp vụ phức tạp.

## Quyết định triển khai (Implementation Decisions)

### Cấu trúc chung (Architecture)
- **Centralization:** Di chuyển toàn bộ logic xử lý JWT (Service, Filter) và cấu hình Redis mặc định vào module `common-lib`.
- **Dependency Management:** Các service con sẽ phụ thuộc vào `common-lib` và tái sử dụng các Bean được cấu hình sẵn.

### Redis Serialization
- **Serializer:** Sử dụng `GenericJackson2JsonRedisSerializer` để đảm bảo dữ liệu lưu trong Redis ở dạng JSON, giúp tránh lỗi `ClassCastException` và dễ dàng debug.
- **Shared Config:** Cung cấp một `RedisTemplate` mặc định trong `common-lib`.

### Security & JWT
- **Shared JWT Logic:** Xây dựng `JwtService` trong `common-lib` để xử lý việc trích xuất claims và validate token.
- **Shared Filter:** Tạo `JwtAuthenticationFilter` dùng chung có thể cấu hình linh hoạt cho từng service.
- **Consistency:** Đảm bảo tất cả các service sử dụng cùng một bộ `secret-key` trích xuất từ biến môi trường.

### Xử lý lỗi (Error Handling)
- **Global Format:** Định nghĩa cấu trúc lỗi chuẩn (ErrorResponse) trong `common-lib`.
- **Stability:** Cải thiện logic bắt lỗi khi parse JWT (hết hạn, sai chữ ký) để trả về 401 thay vì 500.

## Tham chiếu (Canonical References)
- `BE/common-lib/`: Module chứa các logic dùng chung.
- `BE/auth-service/`: Tham chiếu logic JWT hiện tại.
- `BE/order-service/`: Tham chiếu logic Cart và Redis hiện tại.

## Ghi chú khác
- Ưu tiên tính tái sử dụng và khả năng cấu hình (extensibility) của các thành phần trong `common-lib`.

---
*Phase: 01-cung-co-nen-tang*
*Context gathered: 2026-04-22 via discuss-phase*
