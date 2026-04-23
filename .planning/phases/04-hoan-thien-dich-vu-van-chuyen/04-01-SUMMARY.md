# Summary: 04-01 - Tự động tạo vận đơn GHN khi có đơn hàng mới

**Status:** Complete
**Completed:** 2026-04-22

## Key Files Modified
- `shipping-service/GHNConfig.java`: Cấu hình GHN API.
- `shipping-service/GHNCreateOrderRequest.java` & `Response`: DTO mapping với GHN API.
- `shipping-service/ShippingService.java`: Logic gọi API tạo đơn hàng GHN thông qua `RestTemplate`.
- `shipping-service/ShippingController.java`: Mở endpoint nhận request từ `order-service`.
- `order-service/ShippingClient.java`: OpenFeign client gọi qua `shipping-service`.
- `order-service/OrderService.java`: Bổ sung logic tự tạo vận đơn khi trạng thái chuyển sang `PAID`.

## Accomplishments
- Đã cấu hình thành công việc giao tiếp với GHN API sử dụng `RestTemplate`.
- Hệ thống có khả năng tự động tạo mã vận đơn (Tracking Code) khi có đơn hàng được thanh toán.
- Entity `Shipment` được khởi tạo để theo dõi trạng thái vận chuyển.

## Next Steps
- Cập nhật logic để lấy `district_id` và `ward_code` linh động từ Database thay vì hardcode (Wave 2).
