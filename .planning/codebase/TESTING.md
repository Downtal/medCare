# Chiến lược kiểm thử của MedCare

## Trạng thái hiện tại
- **Kiểm thử tự động (Automated Tests):** Rất ít hoặc không tìm thấy trong các thư mục `src/test`.
- **Kiểm thử thủ công (Manual Testing):** Dựa vào thư mục `Data_test/` cho các dữ liệu đầu vào mẫu.
- **Công cụ:** JUnit 5 có mặt trong các phụ thuộc Gradle nhưng chưa được sử dụng rộng rãi.

## Chiến lược khuyến nghị
- **Kiểm thử đơn vị (Unit Testing):** Thêm các bài kiểm tra cho logic nghiệp vụ phức tạp trong các lớp Service.
- **Kiểm thử tích hợp (Integration Testing):** Kiểm tra các endpoint REST và tương tác với repository.
- **Kiểm thử Frontend:** Triển khai Vitest hoặc Jest cho các thành phần UI quan trọng.
- **Kiểm thử E2E (End-to-End):** Sử dụng Playwright hoặc Cypress cho các luồng người dùng cốt lõi (Thanh toán, Đăng nhập).
