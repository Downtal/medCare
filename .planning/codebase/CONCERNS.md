# Các vấn đề kỹ thuật của MedCare

## Các vấn đề đã biết (Known Issues)
- **Redis Serialization:** Lỗi `ClassCastException` trong `CartService` do việc tuần tự hóa (serialization) khóa hash Redis không đồng nhất.
- **JWT Parsing:** Lỗi 500 Internal Server Error khi truy xuất hồ sơ người dùng liên quan đến logic phân tích (parsing) JWT.
- **Tính nhất quán dữ liệu:** Vấn đề đồng bộ giữa tồn kho sản phẩm và hiển thị trên Frontend.

## Nợ kỹ thuật (Technical Debt)
- **Thiếu hụt Testing:** Việc thiếu độ bao phủ của kiểm thử tự động làm tăng rủi ro lỗi lặp lại (regressions).
- **Độ phức tạp Microservices:** Quản lý nhiều dịch vụ mà không có hệ thống ghi log hoặc truy vết tập trung (ví dụ: Sleuth/Zipkin).
- **Cấu hình Hardcoded:** Một số chi tiết tích hợp (như các endpoint của GHN) có thể được cải thiện bằng cách quản lý cấu hình mạnh mẽ hơn.

## Thách thức trong tương lai
- **Khả năng mở rộng (Scalability):** Khi danh mục sản phẩm phát triển, cần có giải pháp tìm kiếm và đánh chỉ mục hiệu quả (ví dụ: Elasticsearch).
- **Triển khai (Deployment):** Chuyển đổi từ chạy thủ công (qua các file `.bat`) sang điều phối bằng container (Docker Compose / Kubernetes).
