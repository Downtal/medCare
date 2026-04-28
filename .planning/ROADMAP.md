# Milestone 5 Roadmap: Prescription Management & AI OCR

### Phase 19: Prescription Storage & Backend Workflow
- **Mục tiêu:** Xây dựng nền tảng lưu trữ và quản lý trạng thái đơn thuốc.
- **Công việc:**
    - Thiết lập Cloudinary Service trong `order-service` hoặc `user-service`.
    - Tạo bảng `prescriptions` và các entity liên quan.
    - Xây dựng API Upload và CRUD đơn thuốc.
    - Cập nhật logic `order-service` để kiểm tra đơn thuốc khi mua sản phẩm RX.

### Phase 20: AI OCR & Medicine Mapping
- **Mục tiêu:** Sử dụng AI để đọc và đối soát đơn thuốc.
- **Công việc:**
    - Xây dựng `PrescriptionOCRService` trong `ai-service` sử dụng Gemini Multimodal.
    - Phát triển thuật toán Mapping (fuzzy match) giữa text AI trả về và ID thuốc trong DB.
    - Xây dựng API phân tích đơn thuốc thời gian thực cho Frontend.

### Phase 21: Real-time Notifications & Pharmacist UI
- **Mục tiêu:** Hoàn thiện giao diện quản trị và hệ thống thông báo.
- **Công việc:**
    - Tích hợp WebSocket (hoặc Firebase) để gửi thông báo trạng thái đơn thuốc.
    - Xây dựng trang quản trị dành cho Dược sĩ (List & Detail view).
    - Tích hợp UI hiển thị so sánh: "Ảnh đơn thuốc" vs "Thông tin AI trích xuất".

### Phase 22: End-to-end Prescription Checkout Flow
- **Mục tiêu:** Gắn kết các module và hoàn thiện trải nghiệm mua hàng RX.
- **Công việc:**
    - Xây dựng luồng UI: Chọn thuốc RX -> Yêu cầu upload đơn thuốc -> Chờ duyệt -> Thông báo duyệt -> Thanh toán.
    - Kiểm thử E2E toàn bộ luồng mua thuốc kê đơn.
    - Tối ưu hóa hiệu năng và bảo mật cho ảnh đơn thuốc.
