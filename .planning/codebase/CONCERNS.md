# Các vấn đề kỹ thuật của MedCare

Bản tài liệu này thống kê chi tiết các thách thức kỹ thuật hiện tại, nợ công nghệ (Technical Debt) và các đề xuất khắc phục cho các phiên bản phát triển tiếp theo của hệ thống MedCare.

---

## 1. Các vấn đề cần lưu ý (Concerns)

*   **Tính chính xác của AI & OCR đơn thuốc:**
    *   *Vấn đề:* Tesseract.js thực hiện nhận diện văn bản (OCR) ngay tại trình duyệt client, chất lượng ảnh chụp (ánh sáng, góc chụp, độ mờ chữ viết bác sĩ) ảnh hưởng mạnh đến kết quả. AI Service đôi khi phải xử lý chuỗi văn bản bị nhiễu lớn.
    *   *Rủi ro:* Có khả năng nhận diện nhầm hoạt chất hoặc liều lượng.
    *   *Khắc phục hiện tại:* Hệ thống luôn hiển thị cảnh báo "Thông tin mang tính chất tham khảo" và bắt buộc người dùng kiểm tra, chỉnh sửa lại thông tin trước khi nhấn xác nhận gửi đơn.
*   **Quản lý trạng thái Token JWT trên API Gateway:**
    *   *Vấn đề:* Do sử dụng Stateless JWT, khi người dùng đăng xuất hoặc đổi mật khẩu, token cũ vẫn có hiệu lực cho đến khi hết thời gian sống (TTL).
    *   *Khắc phục hiện tại:* Sử dụng một danh sách đen (Blacklist) lưu trữ các token bị thu hồi trong Redis. API Gateway sẽ tra cứu nhanh Redis cho mỗi request.
*   **Độ trễ phản hồi của AI (Latency):**
    *   *Vấn đề:* Việc gọi API Gemini để phân tích ngữ cảnh hoặc đơn thuốc có độ trễ từ 1-3 giây.
    *   *Khắc phục hiện tại:* Triển khai phản hồi dạng dòng (Streaming Response) bằng giao thức Server-Sent Events (SSE) để giảm thời gian chờ đợi cảm nhận (perceived latency) của người dùng.

---

## 2. Nợ kỹ thuật (Technical Debt)

*   **Thiếu công cụ di cư dữ liệu tự động (Database Migrations):**
    *   Hiện tại cơ sở dữ liệu vẫn được khởi tạo thủ công bằng file SQL `DB/medcare_init.sql`. Việc thay đổi cấu trúc bảng trong tương lai sẽ gặp khó khăn nếu không tích hợp công cụ như **Flyway** hoặc **Liquibase** vào Spring Boot.
*   **Hệ thống Log tập trung:**
    *   Do chạy kiến trúc Microservices, mỗi dịch vụ tự ghi log cục bộ ra console hoặc file riêng. Khi xảy ra lỗi liên chuỗi dịch vụ (ví dụ: lỗi thanh toán dẫn đến lỗi kho), việc truy vết rất khó khăn. Cần triển khai giải pháp log tập trung (ELK Stack hoặc Grafana Loki) và mã định danh duy nhất cho mỗi yêu cầu (Correlation ID).
*   **Docker hóa (Containerization):**
    *   Hiện tại hệ thống khởi chạy bằng các file kịch bản `.bat` trên Windows (`runBE.bat`, `runFE.bat`, `run-AI.bat`). Dự án cần viết `Dockerfile` cho từng microservice và cấu hình một file `docker-compose.yml` hoàn chỉnh để có thể triển khai dễ dàng trên mọi hệ điều hành chỉ với 1 lệnh duy nhất.

---

## 3. Đề xuất Hướng Phát triển tiếp theo (Next Phases Proposal)

*   **Tích hợp cơ sở dữ liệu tri thức Vector (RAG - Retrieval-Augmented Generation):**
    *   Xây dựng Vector Database (như pgvector hoặc ChromaDB) chứa hàng chục ngàn tài liệu hướng dẫn dược lâm sàng chính thống của Bộ Y tế. Khi người dùng hỏi chatbot, AI sẽ đối chiếu dữ liệu chuyên môn này trước khi đưa ra câu trả lời, loại bỏ tối đa hiện tượng "ảo tưởng" (hallucination) của AI.
*   **Xây dựng Dịch vụ Thông báo tập trung (Notification Service):**
    *   Chuyển các event thông báo gửi mail OTP, báo đơn hàng thành công, báo duyệt đơn thuốc thành một Message Broker (như RabbitMQ hoặc Apache Kafka) để xử lý bất đồng bộ, tránh làm nghẽn luồng xử lý chính.
*   **Hoàn thiện luồng mua thuốc kê đơn tự động:**
    *   Khi dược sĩ phê duyệt đơn thuốc y tế của người dùng tải lên, hệ thống sẽ tự động tạo một giỏ hàng chứa đúng các loại thuốc kê đơn được duyệt và gửi thông báo trực tiếp qua Zalo/Email để người dùng chỉ cần bấm "Thanh toán".
