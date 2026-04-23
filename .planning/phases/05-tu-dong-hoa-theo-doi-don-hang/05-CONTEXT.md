# Phase 5: Tự động hóa Theo dõi Đơn hàng - Context

**Ngày tạo:** 2026-04-22
**Trạng thái:** Đã chốt yêu cầu, sẵn sàng lập kế hoạch

## Ranh giới giai đoạn (Domain Boundary)
Phase này tập trung vào việc **nhận Webhook từ GHN**, ánh xạ trạng thái giao hàng từ hệ thống GHN sang hệ thống của MedCare, và đồng bộ trạng thái này từ `shipping-service` sang `order-service` theo thời gian thực.

## Các quyết định triển khai (Decisions)

### 1. Bảo mật Webhook
- **Quyết định:** Sử dụng **Custom Header Token**.
- **Chi tiết:** Cấu hình trên hệ thống GHN gửi kèm một custom header (ví dụ: `Token`) trong request Webhook. `shipping-service` sẽ đối chiếu giá trị này với secret key lưu trong biến môi trường (`.env`).

### 2. Ánh xạ Trạng thái (State Mapping)
- **Quyết định:** Áp dụng **Map cơ bản** (gộp các trạng thái trung gian).
- **Chi tiết:**
  - `ready_to_pick`, `picking`, `storing`, `delivering` ➔ Chuyển thành trạng thái **`SHIPPING`**.
  - `delivered` ➔ Chuyển thành trạng thái **`DELIVERED`**.
  - `return`, `returned` ➔ Chuyển thành trạng thái **`RETURNED`**.

### 3. Đồng bộ liên dịch vụ
- **Quyết định:** Sử dụng **OpenFeign**.
- **Chi tiết:** Khi trạng thái `Shipment` thay đổi, `shipping-service` sẽ gọi API nội bộ của `order-service` (ví dụ: `PUT /api/orders/internal/{orderCode}/status`) để cập nhật `OrderStatus`. Điều này đảm bảo tính nhất quán của dữ liệu theo cùng một pattern đã áp dụng ở Phase 3.

## Tham chiếu (Canonical References)
- Tài liệu API Webhook của GHN v2.
- `Shipment.ShippingStatus` (shipping-service)
- `Order.OrderStatus` (order-service)

---
*Context gathered: 2026-04-22 via discuss-phase*
