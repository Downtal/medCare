# Phase 6: Kiểm thử và Hoàn thiện - Context

## Mục tiêu
Hoàn thiện luồng dữ liệu E2E, đồng bộ tồn kho thực tế, và nâng cấp giao diện người dùng để mang lại trải nghiệm chuyên nghiệp nhất.

## Quyết định thiết kế

### 1. Đồng bộ tồn kho (Inventory Sync)
- **Phương pháp:** Đồng bộ (Synchronous) qua OpenFeign.
- **Thời điểm:** `order-service` sẽ gọi `inventory-service` để **trừ tồn kho ngay khi đơn hàng được tạo thành công** (sau bước lưu `Order` vào DB).
- **Cơ chế:**
  - `inventory-service` cung cấp API `/api/inventory/internal/deduct`.
  - Logic trừ kho sẽ theo cơ chế **FIFO (First In First Out)**: Trừ ở các lô (batch) có ngày hết hạn gần nhất trước.
  - Nếu không đủ hàng, ném lỗi để rollback transaction tạo đơn hàng.

### 2. Dữ liệu Tracking & Voucher
- **Tracking:** `shipping-service` sẽ tích hợp API tra cứu trạng thái chi tiết của GHN (v2/shipping-order/detail) để lấy lộ trình (logs).
- **Voucher:** Đảm bảo `order-service` lưu và trả về đủ thông tin `voucherCode` và `discountAmount` trong API chi tiết đơn hàng.

### 3. Giao diện (Frontend)
- **Tracking Timeline:** Hiển thị một sơ đồ timeline (bước/trạng thái) trong trang chi tiết đơn hàng.
- **Voucher Info:** Hiển thị số tiền giảm giá và mã voucher trong phần tóm tắt đơn hàng (Checkout & Detail).

## Phụ thuộc
- Phụ thuộc vào `inventory-service` đã có sẵn khung.
- Phụ thuộc vào `shipping-service` đã có tracking code từ Phase 4/5.

## Yêu cầu thành công
- [STAB-03] Tồn kho được trừ chính xác sau mỗi đơn hàng.
- [ORDR-02] Người dùng xem được lộ trình đơn hàng chi tiết.
- [ORDR-03] Giao diện Checkout hiển thị đầy đủ thông tin ưu đãi.
