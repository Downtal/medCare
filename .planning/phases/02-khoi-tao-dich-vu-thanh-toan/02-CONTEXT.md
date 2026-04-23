# Phase 2: Khởi tạo Dịch vụ Thanh toán - Context

**Ngày khởi tạo:** 2026-04-22
**Trạng thái:** Sẵn sàng lập kế hoạch

## Ranh giới giai đoạn (Phase Boundary)
Giai đoạn này tập trung vào việc thiết lập hạ tầng cho service mới `payment-service`. Mục tiêu là service có thể chạy độc lập, kết nối cơ sở dữ liệu, đăng ký với Eureka và tạo được URL thanh toán VNPay.

## Quyết định triển khai (Implementation Decisions)

### Cơ sở dữ liệu (Database)
- **Database Name:** `medcare_payment_db`.
- **ORM:** Spring Data JPA.
- **Migration:** Sử dụng schema đã có trong `medcare_init.sql`và có thể sửa đổi nếu cần thiết.

### Cấu hình VNPay
- **Environment:** Thông số VNPay (TmnCode, HashSecret) sẽ được để trống trong `.env` để người dùng bổ sung sau.
- **Utility:** Xây dựng class `VNPayUtil` để xử lý việc tạo chữ ký và hash tham số theo yêu cầu của VNPay.
- **Endpoints:**
  - `POST /api/payment/create`: Tạo URL thanh toán từ thông tin đơn hàng.

### Giao tiếp liên dịch vụ
- **Feign Client:** Sử dụng OpenFeign để gọi `order-service` lấy thông tin số tiền thanh toán (nếu cần xác thực lại số tiền).
- **Security:** Tích hợp `common-lib` để xử lý xác thực người dùng qua JWT.

## Tham chiếu (Canonical References)
- `DB/medcare_init.sql`: Định nghĩa bảng `payments` và `payment_logs`.
- `BE/common-lib/`: Cung cấp cấu hình bảo mật và Redis.

## Ghi chú khác
- Service cần đăng ký với Eureka server (`discovery-service`) để các service khác có thể tìm thấy qua API Gateway.

---
*Phase: 02-khoi-tao-dich-vu-thanh-toan*
*Context gathered: 2026-04-22 via discuss-phase*
