# Các tích hợp của MedCare

## Tích hợp nội bộ (Internal Integrations)
- **Eureka Discovery Server:** Tất cả các microservices (bao gồm cả AI Service chạy Python) đăng ký với `discovery-server` để tự động phát hiện dịch vụ.
- **Spring Cloud Gateway:** `api-gateway` định tuyến các yêu cầu từ bên ngoài đến các dịch vụ nội bộ.
- **OpenFeign / HTTPX:** Giao tiếp REST giữa các dịch vụ Java (OpenFeign) và Python (HTTPX).
- **Redis:** Sử dụng cho caching giỏ hàng và quản lý phiên bản JWT. FE cũng sử dụng `ioredis` cho một số tác vụ backend-side.
- **MySQL:** Cơ sở dữ liệu quan hệ trung tâm cho tất cả các dịch vụ.

## Tích hợp bên ngoài (External Integrations)
- **Google Gemini AI:** Tích hợp qua `ai-service` (Python) để xử lý tư vấn y tế và phân tích đơn thuốc.
- **Cloudinary:** Lưu trữ hình ảnh sản phẩm và đơn thuốc.
- **GHN (Giao Hàng Nhanh):** Tích hợp trong `shipping-service` để quản lý logictics và phí vận chuyển.
- **VNPay:** Xử lý thanh toán trực tuyến trong `payment-service`.
- **Tesseract.js:** Thực hiện OCR phía client để trích xuất văn bản từ đơn thuốc trước khi gửi lên AI.
- **NextAuth.js:** Xác thực người dùng và liên kết với `auth-service`.

## Giao thức & Bảo mật
- **REST/JSON:** Phương thức giao tiếp chuẩn.
- **JWT:** Cơ chế bảo mật chính, được truyền qua header Authorization.
- **SSE (Server-Sent Events):** Sử dụng trong `ai-service` để stream kết quả phản hồi từ AI.
