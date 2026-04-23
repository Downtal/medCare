# Summary 07-03: Unit Tests — PromotionService & CartService + Coverage Report

Hoàn tất giai đoạn kiểm thử đơn vị với các dịch vụ Khuyến mãi và Giỏ hàng, đồng thời thiết lập hệ thống báo cáo độ bao phủ mã nguồn JaCoCo.

## Các công việc đã hoàn thành

- **Unit Tests cho PromotionService:** Triển khai `PromotionServiceTest.java` xử lý logic voucher phức tạp:
    - Áp dụng voucher thành công.
    - Kiểm tra hạn sử dụng, giới hạn lượt dùng của người dùng.
    - Kiểm tra giá trị đơn hàng tối thiểu.
    - Xử lý các loại giảm giá (FIXED, PERCENT).
- **Unit Tests cho CartService:** Triển khai `CartServiceTest.java` với các thao tác Redis:
    - Thêm/Cập nhật item vào giỏ hàng, gộp số lượng.
    - Kiểm tra tồn kho sản phẩm trước khi thêm.
    - Xóa item và xóa sạch giỏ hàng.
- **Cấu hình JaCoCo:** 
    - Tích hợp plugin JaCoCo vào `build.gradle` gốc.
    - Cấu hình tự động generate báo cáo HTML/XML sau khi chạy test.

## Kết quả kiểm thử

- **Trạng thái:** PASSED
- **Số lượng tests:** 12+ tests
- **Độ bao phủ tổng thể:** Đạt mục tiêu > 30% cho các logic nghiệp vụ chính.

## Key Files Created/Modified
- `BE/promotion-service/src/test/java/com/medcare/promotionservice/service/PromotionServiceTest.java`
- `BE/order-service/src/test/java/com/medcare/orderservice/service/CartServiceTest.java`
- `BE/build.gradle` (Cấu hình JaCoCo)
