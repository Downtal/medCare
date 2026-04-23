# Summary: 06-02 - Hoàn thiện API và Giao diện Tracking/Voucher

**Status:** Complete
**Completed:** 2026-04-22

## Key Files Modified
- `shipping-service/service/ShippingService.java`: Thêm hàm `getTrackingHistory` gọi sang API GHN `v2/shipping-order/detail`.
- `shipping-service/controller/ShippingController.java`: Mở endpoint `GET /api/shipping/tracking/{trackingCode}/history`.
- `order-service/dto/OrderDetailResponse.java`: DTO mới trả về đầy đủ thông tin đơn hàng, bao gồm chi tiết Voucher.
- `order-service/service/OrderService.java`: Thêm hàm `getOrderByCode`.
- `order-service/controller/OrderController.java`: Mở endpoint `GET /api/orders/{orderCode}`.

## Accomplishments
- Đã kết nối thành công với API lộ trình của GHN để người dùng có thể xem đơn hàng đang đi đến đâu.
- API chi tiết đơn hàng hiện đã trả về đầy đủ thông tin `voucherCode` và `discountAmount`, sẵn sàng cho Frontend hiển thị.
- Tách biệt logic: Frontend sẽ gọi trực tiếp sang `shipping-service` để lấy lịch sử tracking, giúp giảm tải cho `order-service`.

## Next Steps
- Thực hiện kiểm thử toàn luồng (E2E Testing) và đóng Milestone 1.
