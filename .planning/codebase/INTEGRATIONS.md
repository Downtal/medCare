# Các tích hợp của MedCare

## Tích hợp nội bộ (Internal Integrations)
- **Eureka Discovery Server:** Tất cả các microservices đăng ký với `discovery-server` để tự động phát hiện dịch vụ.
- **Spring Cloud Gateway:** `api-gateway` định tuyến các yêu cầu từ bên ngoài đến các dịch vụ nội bộ dựa trên đường dẫn (path).
- **OpenFeign:** Được sử dụng cho việc giao tiếp REST đồng bộ giữa các dịch vụ (ví dụ: `shipping-service` giao tiếp với các dịch vụ khác).
- **Redis:** Được sử dụng để lưu trữ bộ nhớ đệm (caching) và quản lý phiên (session) (ví dụ: dữ liệu giỏ hàng, danh sách đen JWT/phiên bản JWT).
- **MySQL:** Cơ sở dữ liệu quan hệ chính được sử dụng bởi tất cả các dịch vụ cần lưu trữ dữ liệu bền vững.

## Tích hợp bên ngoài (External Integrations)
- **Cloudinary:** Được sử dụng để lưu trữ và phân phối hình ảnh trong `product-service` và `FE`.
- **GHN (Giao Hàng Nhanh):** Được tích hợp trong `shipping-service` để lấy dữ liệu Tỉnh/Huyện/Xã và tính phí vận chuyển.
- **VNPay:** Được tích hợp trong `payment-service` để xử lý thanh toán trực tuyến.
- **NextAuth.js:** Được tích hợp với `auth-service` cho các luồng xác thực trên Frontend.

## Giao thức tích hợp
- **REST/JSON:** Giao thức chính cho tất cả các giao tiếp dịch vụ-với-dịch vụ và khách-với-máy chủ.
- **JWT:** Được sử dụng để bảo mật các API và truyền ngữ cảnh người dùng giữa các dịch vụ.
