# Chiến lược kiểm thử của MedCare

## Công cụ & Framework
- **Backend (Java):** JUnit 5, Mockito.
- **Backend (Python):** Pytest (khuyến nghị).
- **Frontend:** Vitest (Unit/Component), React Testing Library.
- **E2E:** Playwright (đã cấu hình trong thư mục `FE/e2e`).

## Trạng thái hiện tại
- **Unit Testing:** Đã có nền tảng Vitest trong FE. BE vẫn còn hạn chế về coverage.
- **E2E Testing:** Đã có cấu hình Playwright, cần bổ sung các kịch bản cho luồng OCR và Thanh toán.
- **Dữ liệu mẫu:** Sử dụng thư mục `Data_test/` để import sản phẩm và kiểm thử thủ công.

## Kế hoạch cải thiện
1. Tăng cường Unit Test cho `ai-service` để đảm bảo logic trích xuất text ổn định.
2. Xây dựng bộ test E2E cho luồng: Đăng nhập -> Tải đơn thuốc -> AI OCR -> Thanh toán.
3. Kiểm thử tích hợp giữa `api-gateway` và các dịch vụ sau khi update dependency.
