# Summary: 02-01 - Khởi tạo dự án payment-service

**Status:** Complete
**Completed:** 2026-04-22

## Key Files Created
- [payment-service/build.gradle](file:///v:/TieuLuanTN/MedCare/BE/payment-service/build.gradle): Cấu hình dependency.
- [PaymentServiceApplication.java](file:///v:/TieuLuanTN/MedCare/BE/payment-service/src/main/java/com/medcare/paymentservice/PaymentServiceApplication.java): Main class với Eureka và Feign client.
- [application.yml](file:///v:/TieuLuanTN/MedCare/BE/payment-service/src/main/resources/application.yml): Cấu hình hệ thống và VNPay placeholders.

## Decisions Made
- Sử dụng cổng **8087** cho `payment-service`.
- Kết nối tới Database `medcare_payment_db` (MySQL).
- Kế thừa `common-lib` để sử dụng chung cấu hình bảo mật và Redis.

## Verification
- Dự án đã được thêm vào `settings.gradle`.
- Sẵn sàng để xây dựng các logic nghiệp vụ thanh toán.
