# Các vấn đề kỹ thuật của MedCare

## Các vấn đề cần lưu ý (Concerns)
- **Đa ngôn ngữ (Polyglot Complexity):** Việc duy trì cả Java và Python yêu cầu team có kỹ năng đa dạng và quy trình CI/CD phức tạp hơn.
- **Độ trễ AI (AI Latency):** Việc gọi Gemini API có thể mất vài giây, cần xử lý UI (loading states, streaming) tốt để không gây khó chịu cho người dùng.
- **Độ chính xác OCR:** OCR phía client (Tesseract.js) phụ thuộc vào chất lượng ảnh, đôi khi cần AI "sửa lỗi" text bị sai.
- **Quản lý Token:** Cần cơ chế refresh token và logout đồng bộ giữa FE và các Microservices.

## Nợ kỹ thuật (Technical Debt)
- **Code Duplication:** Một số DTO có thể bị lặp lại giữa các microservices Java nếu không được đưa vào `common-lib` triệt để.
- **Logging tập trung:** Chưa có hệ thống log tập trung (ELK/Loki), gây khó khăn khi debug lỗi liên chuỗi dịch vụ.
- **Dockerization:** Hệ thống vẫn đang chạy bằng script `.bat`, cần chuyển sang Docker Compose để dễ triển khai.

## Thách thức tương lai
- **Mở rộng AI:** Thêm các tính năng AI tư vấn chuyên sâu, yêu cầu quản lý Vector Database (nếu cần RAG).
- **High Availability:** Cấu hình Eureka và Gateway để chạy nhiều instance của các dịch vụ quan trọng.
