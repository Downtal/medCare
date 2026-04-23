# Phase 3: Tích hợp Luồng Thanh toán - Context

**Ngày khởi tạo:** 2026-04-22
**Trạng thái:** Sẵn sàng lập kế hoạch

## Ranh giới giai đoạn (Phase Boundary)
Giai đoạn này tập trung vào việc xử lý kết quả trả về từ VNPay. Mục tiêu là đảm bảo đơn hàng được cập nhật trạng thái chính xác (PAID/FAILED) ngay khi có thông báo từ VNPay, đồng thời xử lý việc điều hướng người dùng về trang kết quả trên Frontend.

## Quyết định triển khai (Implementation Decisions)

### Xử lý IPN (Instant Payment Notification)
- **Cơ chế:** Webhook từ VNPay gọi trực tiếp đến Backend.
- **Bảo mật:** Bắt buộc kiểm tra chữ ký (`vnp_SecureHash`) và số tiền (`vnp_Amount`) trước khi cập nhật DB.
- **Tính idempotent:** Phải đảm bảo nếu IPN gọi nhiều lần cho cùng một giao dịch thì kết quả vẫn nhất quán (không cộng tiền nhiều lần).

### Giao tiếp liên dịch vụ
- **Order Service Integration:** Sử dụng OpenFeign để gọi `order-service` cập nhật trạng thái đơn hàng sang `CONFIRMED` hoặc `PAID`.
- **Event-driven (Tùy chọn):** Nếu hệ thống phức tạp hơn, có thể dùng Kafka/RabbitMQ, nhưng hiện tại OpenFeign là đủ cho yêu cầu này.

### Trình tự xử lý
1. VNPay gửi IPN về `payment-service`.
2. `payment-service` kiểm tra chữ ký và đối soát với bản ghi `Payment` đang ở trạng thái `PENDING`.
3. Nếu hợp lệ, cập nhật `Payment` thành `SUCCESS` và gọi `order-service` cập nhật trạng thái đơn hàng.
4. Trả về kết quả cho VNPay theo format yêu cầu (JSON `{"RspCode":"00","Message":"Confirm Success"}`).

## Tham chiếu (Canonical References)
- VNPay API Documentation (v2.1.0).
- `order-service` API (Endpoint cập nhật trạng thái).

---
*Phase: 03-tich-hop-luong-thanh-toan*
*Context gathered: 2026-04-22 via discuss-phase*
