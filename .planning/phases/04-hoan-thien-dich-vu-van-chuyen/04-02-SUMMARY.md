# Summary: 04-02 - Đồng bộ dữ liệu địa chỉ hành chính từ GHN API

**Status:** Complete
**Completed:** 2026-04-22

## Key Files Modified
- `shipping-service/GHNClient.java`: Feign client gọi API Master Data của GHN.
- `shipping-service/MasterDataService.java` & `Controller`: Proxy API lấy danh sách Tỉnh/Huyện/Xã.
- `user-service/Address.java` & `AddressDto.java`: Xác nhận đã có sẵn các trường ID để lưu `district_id` và `ward_code`.
- `order-service/OrderRequest.java` & `Order.java`: Bổ sung lưu trữ `cityId`, `districtId`, `wardCode` trong đơn hàng.
- `order-service/OrderService.java`: Cập nhật logic truyền ID địa chỉ chuẩn sang `shipping-service` khi tạo vận đơn.

## Accomplishments
- Đã mở API nội bộ để Frontend có thể lấy dữ liệu chuẩn từ GHN.
- Cấu trúc Backend (`user-service` và `order-service`) đã hoàn thiện việc lưu trữ và luân chuyển các mã ID hành chính.
- `shipping-service` sử dụng trực tiếp các mã ID này để gửi lên GHN, giảm thiểu rủi ro tạo đơn hàng lỗi.

## Next Steps
- Cập nhật Webhook từ GHN để theo dõi trạng thái đơn (Phase 5).
