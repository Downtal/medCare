# Phase 2: Khởi tạo Dịch vụ Thanh toán - Research

**Ngày hoàn thành:** 2026-04-22
**Mục tiêu:** Tìm hiểu tham số tích hợp VNPay 2.1.0 và cấu trúc `payment-service`.

## 1. Tham số VNPay API (v2.1.0)
Để tạo URL thanh toán, cần các tham số chính sau:
- `vnp_Version`: 2.1.0
- `vnp_Command`: pay
- `vnp_TmnCode`: Mã định danh (lấy từ .env)
- `vnp_Amount`: Số tiền * 100
- `vnp_TxnRef`: Mã tham chiếu đơn hàng (Order Code)
- `vnp_OrderInfo`: Mô tả giao dịch
- `vnp_OrderType`: `other` (mặc định)
- `vnp_Locale`: `vn`
- `vnp_ReturnUrl`: URL quay về sau khi thanh toán (Frontend URL)
- `vnp_IpAddr`: IP của khách hàng
- `vnp_CreateDate`: Định dạng `yyyyMMddHHmmss`
- `vnp_SecureHash`: Chữ ký HMAC-SHA512

## 2. Giải thuật ký (Hashing)
- Sắp xếp các tham số theo bảng chữ cái (alphabetical order) của Key.
- Nối các tham số thành query string (ví dụ: `a=1&b=2`).
- Sử dụng thuật toán **HMAC-SHA512** với `vnp_HashSecret` để tạo mã hash.

## 3. Cấu trúc `payment-service`
- **Framework:** Spring Boot 3.4.4.
- **Dependencies:**
  - `spring-boot-starter-data-jpa`: Tương tác MySQL.
  - `mysql-connector-j`: Driver MySQL.
  - `spring-cloud-starter-netflix-eureka-client`: Đăng ký service.
  - `spring-cloud-starter-openfeign`: Gọi Order Service.
  - `common-lib`: Bảo mật và cấu hình dùng chung.
- **Model:** 
  - `Payment`: Lưu thông tin giao dịch (id, order_id, amount, status, etc.)
  - `PaymentLog`: Lưu vết phản hồi từ VNPay.

## 4. Rủi ro và Giải pháp
- **Xác thực số tiền:** VNPay IPN có thể bị giả mạo. Giải pháp: Luôn gọi lại `order-service` hoặc kiểm tra lại chữ ký và số tiền trong IPN với dữ liệu đã lưu trong `payments` table.
- **Tính duy nhất:** `vnp_TxnRef` phải là duy nhất. Giải pháp: Sử dụng `orderCode` kết hợp với timestamp hoặc ID thanh toán.

## Kết luận
Quy trình tích hợp VNPay khá rõ ràng. Việc quan trọng nhất là bảo mật chuỗi Hash và xác thực IPN ở giai đoạn sau (Phase 3). Trong Phase 2, chúng ta tập trung vào việc tạo URL thành công.
