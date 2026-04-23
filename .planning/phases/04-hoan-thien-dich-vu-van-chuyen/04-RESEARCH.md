# Phase 4: Hoàn thiện Dịch vụ Vận chuyển - Research

**Ngày hoàn thành:** 2026-04-22
**Mục tiêu:** Tìm hiểu tham số tích hợp GHN API và quy trình đồng bộ Master Data.

## 1. GHN API - Tạo đơn hàng (Create Order)
Endpoint: `POST https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create`
Headers:
- `Token`: API Token của tài khoản.
- `ShopId`: ID của Shop (cửa hàng).

**Các tham số quan trọng:**
- `payment_type_id`: `1` (Shop trả phí), `2` (Người nhận trả phí - COD). Với đơn hàng `PAID`, thường shop sẽ trả phí (hoặc đã thu phí shipping từ khách).
- `required_note`: `KHONGCHOXEMHANG` hoặc `CHOXEMHANGKHONGTHU`.
- **Thông tin người nhận:**
  - `to_name`, `to_phone`, `to_address`
  - `to_ward_code` (String), `to_district_id` (Integer). **Lưu ý:** GHN yêu cầu truyền chính xác mã hành chính của họ.
- **Kích thước/Trọng lượng:** `weight` (gram), `length`, `width`, `height` (cm).
- **Items:** Danh sách sản phẩm `[ { name, code, quantity, price, weight } ]`.

## 2. GHN API - Lấy dữ liệu hành chính (Master Data)
Để `to_ward_code` và `to_district_id` chính xác, Backend cần đồng bộ dữ liệu:
1. `GET /master-data/province`: Lấy danh sách Tỉnh/Thành phố.
2. `GET /master-data/district`: Lấy danh sách Quận/Huyện (dựa trên province_id).
3. `GET /master-data/ward`: Lấy danh sách Phường/Xã (dựa trên district_id).

## 3. Rủi ro và Giải pháp
- **Rủi ro:** Dữ liệu địa chỉ hiện tại trong `user_profiles` hoặc `orders` có thể là dạng text tự do, không có `district_id` và `ward_code`.
- **Giải pháp:** 
  - Tạo một Endpoint trung gian trong `shipping-service` proxy request đến GHN để Frontend dùng khi tạo địa chỉ.
  - Sửa lại bảng `addresses` (đã có trường `city_id`, `district_id`, `ward_code` trong schema) để bắt buộc Frontend phải gửi các ID này.
  - Khi Checkout, `OrderRequest` cũng phải đính kèm các ID này.

## Kết luận
Tích hợp GHN đòi hỏi sự chính xác tuyệt đối về Master Data (địa chỉ). Kế hoạch cần chia làm 2 phần: 
1. Mở API để Frontend lấy dữ liệu địa chỉ.
2. Xây dựng logic gọi API tạo đơn khi Order Service yêu cầu.
