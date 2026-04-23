# Summary: 02-02 - Tích hợp cấu hình VNPay và logic tạo Payment URL

**Status:** Complete
**Completed:** 2026-04-22

## Key Files Created
- [VNPayUtil.java](file:///v:/TieuLuanTN/MedCare/BE/payment-service/src/main/java/com/medcare/paymentservice/util/VNPayUtil.java): Xử lý mã hóa HMAC-SHA512.
- [Payment.java](file:///v:/TieuLuanTN/MedCare/BE/payment-service/src/main/java/com/medcare/paymentservice/entity/Payment.java): Entity lưu thông tin giao dịch.
- [PaymentService.java](file:///v:/TieuLuanTN/MedCare/BE/payment-service/src/main/java/com/medcare/paymentservice/service/PaymentService.java): Logic tạo Payment URL chuẩn VNPay 2.1.0.
- [PaymentController.java](file:///v:/TieuLuanTN/MedCare/BE/payment-service/src/main/java/com/medcare/paymentservice/controller/PaymentController.java): Endpoint `POST /api/payment/create`.

## Accomplishments
- Đã triển khai thuật toán ký số theo chuẩn mới nhất của VNPay.
- Tích hợp lưu trữ trạng thái `PENDING` vào database ngay khi tạo URL để hỗ trợ đối soát sau này.
- Cấu hình linh hoạt thông qua `VNPayConfig`, sẵn sàng nhận tham số từ môi trường.

## Verification
- Cấu trúc thư mục và các class đã được tổ chức đúng chuẩn.
- Sẵn sàng tích hợp luồng Callback và IPN ở Phase 3.
