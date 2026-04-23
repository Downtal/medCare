# Phase 4: Hoàn thiện Dịch vụ Vận chuyển - Context

**Ngày khởi tạo:** 2026-04-22
**Trạng thái:** Sẵn sàng lập kế hoạch

## Ranh giới giai đoạn (Phase Boundary)
Giai đoạn này tập trung vào `shipping-service` và sự liên kết với hệ thống của Giao Hàng Nhanh (GHN). Mục tiêu là hệ thống có khả năng giao tiếp 2 chiều với GHN: đẩy đơn hàng lên GHN khi đã xác nhận/thanh toán, và đồng bộ dữ liệu địa chỉ hành chính.

## Quyết định triển khai (Implementation Decisions)

### 1. Tự động tạo vận đơn (Create Order on GHN)
- **Khi nào:** Khi đơn hàng chuyển sang trạng thái `CONFIRMED` hoặc `PAID`. `order-service` sẽ gọi API (OpenFeign) hoặc gửi Event đến `shipping-service`.
- **Dữ liệu cần thiết:** Cần mapping chính xác thông tin cân nặng, kích thước, và quan trọng nhất là mã Tỉnh/Huyện/Xã theo chuẩn của GHN.
- **Lưu trữ:** Lưu lại `tracking_code` (mã vận đơn) từ GHN vào bảng `shipments`.

### 2. Đồng bộ dữ liệu địa chỉ (Master Data)
- **Vấn đề:** Người dùng nhập địa chỉ text (hoặc ID cũ) có thể không khớp với ID hiện tại của GHN, dẫn đến lỗi tạo đơn.
- **Giải pháp:** Cung cấp API nội bộ trong `shipping-service` để lấy danh sách Tỉnh/Huyện/Xã trực tiếp từ GHN API (hoặc cache lại trong Redis/DB) để Frontend sử dụng khi checkout.

## Tham chiếu (Canonical References)
- Tài liệu API GHN (v2).
- `medcare_shipping_db` -> bảng `shipments`.
- `user_profiles` -> `addresses` (Cần đảm bảo cấu trúc lưu city_id, district_id, ward_code).

---
*Phase: 04-hoan-thien-dich-vu-van-chuyen*
*Context gathered: 2026-04-22 via discuss-phase*
