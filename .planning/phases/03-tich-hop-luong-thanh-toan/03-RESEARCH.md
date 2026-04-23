# Phase 3: Tích hợp Luồng Thanh toán - Research

**Ngày hoàn thành:** 2026-04-22
**Mục tiêu:** Tìm hiểu quy trình xử lý IPN và Callback VNPay 2.1.0.

## 1. Quy trình IPN (Instant Payment Notification)
IPN là cơ chế Server-to-Server để VNPay thông báo kết quả thanh toán. Đây là kênh tin cậy nhất để cập nhật trạng thái đơn hàng.

### Các bước xử lý tại Backend:
1. **Kiểm tra chữ ký:** Tính toán lại hash từ các tham số nhận được (trừ `vnp_SecureHash`) và so sánh.
2. **Kiểm tra đơn hàng:** Tìm `Payment` dựa trên `vnp_TxnRef`.
3. **Kiểm tra số tiền:** Đảm bảo `vnp_Amount` khớp với số tiền đã lưu (lưu ý chia cho 100).
4. **Kiểm tra trạng thái:** Đảm bảo đơn hàng chưa được xử lý trước đó (Tránh lặp lại - Idempotency).
5. **Cập nhật:** Cập nhật trạng thái `Payment` và gọi `order-service` cập nhật đơn hàng.

### Format phản hồi yêu cầu:
```json
{
    "RspCode": "00",
    "Message": "Confirm Success"
}
```
Các mã lỗi `RspCode`:
- `01`: Order not found
- `02`: Order already confirmed
- `04`: Invalid amount
- `97`: Invalid checksum
- `99`: Unknown error

## 2. Quy trình Callback (Return URL)
Đây là trang người dùng được chuyển hướng về sau khi thanh toán xong tại VNPay.

### Đặc điểm:
- Không an toàn (Người dùng có thể can thiệp tham số trình duyệt).
- Chỉ dùng để hiển thị thông báo cho người dùng (Thành công/Thất bại).
- Backend vẫn cần kiểm tra chữ ký trước khi hiển thị dữ liệu.

## 3. Giao tiếp với Order Service
Cần Endpoint tại `order-service` để cập nhật trạng thái:
- `PUT /api/orders/{orderCode}/status-payment`
- Tham số: `status` (PAID, FAILED).

## 4. Bảo mật và Đối soát
- Lưu toàn bộ log IPN vào bảng `payment_logs`.
- Sử dụng `@Transactional` để đảm bảo tính nhất quán dữ liệu khi cập nhật trạng thái.

## Kết luận
Logic IPN là phần quan trọng nhất. Cần xử lý cẩn thận các mã phản hồi để VNPay không gửi lại IPN nhiều lần nếu đã xử lý thành công.
