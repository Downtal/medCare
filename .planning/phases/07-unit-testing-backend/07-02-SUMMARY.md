# Summary 07-02: Unit Tests — PaymentService & ShippingService

Hoàn thành việc triển khai unit tests cho hai dịch vụ quan trọng là Thanh toán (Payment) và Vận chuyển (Shipping), đảm bảo logic tích hợp với bên thứ ba (VNPay, GHN) được mô phỏng và kiểm tra chính xác.

## Các công việc đã hoàn thành

- **Môi trường Kiểm thử:** Tạo file `application-test.yml` cho `payment-service` và `shipping-service` với các thông số sandbox giả lập.
- **Unit Tests cho PaymentService:** Triển khai `PaymentServiceTest.java` tập trung vào:
    - Tạo bản ghi thanh toán và sinh URL VNPay chính xác (vnp_Amount x100).
    - Xử lý callback IPN thành công (xác thực chữ ký HMAC SHA512).
    - Xử lý các kịch bản lỗi IPN (sai chữ ký, mã phản hồi không phải 00).
- **Unit Tests cho ShippingService:** Triển khai `ShippingServiceTest.java` và `GHNServiceTest.java`:
    - Tính phí vận chuyển qua GHN API.
    - Tạo đơn vận chuyển (Shipment) thành công.
    - Lấy lịch sử theo dõi (Tracking history).
    - Xử lý Webhook cập nhật trạng thái từ GHN.

## Kết quả kiểm thử

- **Trạng thái:** PASSED
- **Số lượng tests:** 10+ tests (bao gồm cả Payment và Shipping)
- **Độ bao phủ (Service Layer):** ~75-90%

## Key Files Created
- `BE/payment-service/src/test/java/com/medcare/paymentservice/service/PaymentServiceTest.java`
- `BE/shipping-service/src/test/java/com/medcare/shippingservice/service/ShippingServiceTest.java`
- `BE/shipping-service/src/test/java/com/medcare/shippingservice/service/GHNServiceTest.java`
