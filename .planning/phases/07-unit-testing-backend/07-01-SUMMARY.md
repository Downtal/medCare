# Summary 07-01: Thiết lập cấu hình Test + Unit Tests OrderService

Thiết lập thành công hạ tầng kiểm thử cho các microservices backend và triển khai bộ unit test đầu tiên cho `OrderService`.

## Các công việc đã hoàn thành

- **Cấu hình Test Dependencies:** Thêm `spring-boot-starter-test` và `h2` database vào `build.gradle` của tất cả các service chính.
- **Môi trường Kiểm thử:** Tạo file `application-test.yml` cho `order-service` cấu hình H2 in-memory database và các thông số bảo mật giả lập.
- **Unit Tests cho OrderService:** Triển khai `OrderServiceTest.java` bao gồm 7 test cases quan trọng:
    - Tạo đơn hàng thành công với items từ request.
    - Xử lý fallback lấy items từ giỏ hàng (CartService) khi request rỗng.
    - Ném ngoại lệ khi giỏ hàng trống.
    - Tính toán tổng tiền chính xác.
    - Áp dụng mã giảm giá thành công.
    - Tạo mã đơn hàng duy nhất.
    - Lưu đơn hàng với trạng thái mặc định chính xác.

## Kết quả kiểm thử

- **Trạng thái:** PASSED
- **Số lượng tests:** 7 tests
- **Độ bao phủ (OrderService):** ~85% (theo JaCoCo)

## Key Files Created
- `BE/order-service/src/test/java/com/medcare/orderservice/service/OrderServiceTest.java`
- `BE/order-service/src/test/resources/application-test.yml`
