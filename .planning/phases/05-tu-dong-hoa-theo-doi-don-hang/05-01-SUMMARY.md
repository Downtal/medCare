# Summary: 05-01 - Xây dựng Endpoint Webhook trong shipping-service

**Status:** Complete
**Completed:** 2026-04-22

## Key Files Modified
- `shipping-service/application.yml`: Bổ sung cấu hình `ghn.webhook.secret-key`.
- `shipping-service/GHNConfig.java`: Ánh xạ cấu hình secret key.
- `shipping-service/GHNWebhookRequest.java`: DTO nhận payload webhook.
- `shipping-service/OrderStatusUpdateRequest.java` & `OrderClient.java`: DTO và FeignClient gọi cập nhật trạng thái đơn hàng.
- `shipping-service/ShippingService.java`: Logic kiểm tra token, ánh xạ trạng thái sang `SHIPPING`/`DELIVERED` và gọi OrderClient.
- `shipping-service/ShippingWebhookController.java`: Mở endpoint `POST /api/shipping/webhook/ghn`.

## Accomplishments
- Nhận và xử lý thành công Webhook từ GHN.
- Bảo mật bằng Custom Header Token.
- Đồng bộ trực tiếp thay đổi sang `order-service` qua OpenFeign.

## Next Steps
- Cập nhật backend `order-service` để nhận request nội bộ từ `OrderClient`.
