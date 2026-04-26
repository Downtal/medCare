# Yêu cầu Milestone 3: Hệ thống Chatbot AI Tư vấn (MedCare)

> **Cập nhật:** 2026-04-26  
> **Milestone:** 3 — AI Integration  
> **Trạng thái:** Đang lên kế hoạch

---

## 1. Mục tiêu tổng thể

Xây dựng một hệ thống Chatbot thông minh tích hợp vào nền tảng MedCare, cho phép người dùng mô tả triệu chứng hoặc nhu cầu bằng ngôn ngữ tự nhiên để nhận được gợi ý sản phẩm phù hợp, hướng dẫn sử dụng và các cảnh báo y tế cần thiết.

---

## 2. Phạm vi yêu cầu (In Scope)

### 2.1 Tiếp nhận đầu vào (Input Handling)
- Giao diện chat thân thiện trên Frontend (Next.js).
- Hỗ trợ nhập liệu văn bản tiếng Việt.
- Xử lý các triệu chứng phổ biến (đau đầu, sốt, ho, dị ứng, v.v.).

### 2.2 Xử lý ngôn ngữ tự nhiên (NLP Processing)
- **Intent Recognition:** Xác định ý định của người dùng (Hỏi thuốc, Hỏi triệu chứng, Cần tư vấn).
- **Entity Extraction:** Trích xuất các thực thể quan trọng (Tên triệu chứng, Đối tượng sử dụng - trẻ em/người lớn, Mức độ nghiêm trọng).
- **Công nghệ gợi ý:** OpenAI API (GPT-4o) hoặc Gemini API để xử lý ngữ cảnh y tế.

### 2.3 Mapping & Recommendation Logic
- Kết nối thông tin triệu chứng với danh mục sản phẩm (Category) và sản phẩm (Product) trong `product-service`.
- Gợi ý danh sách thuốc không kê đơn (OTC) phù hợp.
- Trả về thông tin:
    - Tên thuốc và hình ảnh.
    - Công dụng chính.
    - Hướng dẫn sử dụng cơ bản (Liều dùng, cách dùng).
    - **Cảnh báo quan trọng:** Chống chỉ định, tác dụng phụ, hoặc yêu cầu thăm khám bác sĩ nếu triệu chứng nặng.

### 2.4 Tích hợp Microservices
- Tạo một service mới: `ai-service` để xử lý logic Chatbot.
- `ai-service` giao tiếp với `product-service` qua OpenFeign để lấy dữ liệu sản phẩm.
- Tích hợp vào API Gateway để FE có thể truy cập.

---

## 3. Phạm vi ngoài (Out of Scope)

- Chẩn đoán bệnh thay bác sĩ (Chatbot chỉ mang tính chất tư vấn sản phẩm).
- Kê đơn thuốc (Chỉ gợi ý các thuốc không kê đơn hoặc thực phẩm chức năng).
- Hỗ trợ giọng nói (Voice-to-text).
- Xử lý các trường hợp cấp cứu (Chỉ đưa ra cảnh báo gọi 115).

---

## 4. Tiêu chí hoàn thành (Definition of Done)

### Phase 11 (AI Infrastructure & Service):
- [ ] Khởi tạo `ai-service` (Spring Boot).
- [ ] Cấu hình kết nối với LLM API (OpenAI/Gemini).
- [ ] Thiết lập OpenFeign client tới `product-service`.

### Phase 12 (Prompt Engineering & Logic):
- [ ] Xây dựng System Prompt tối ưu cho dược sĩ ảo.
- [ ] Triển khai logic trích xuất từ khóa và mapping sản phẩm.
- [ ] Xử lý luồng hội thoại đa bước (Multi-turn conversation).

### Phase 13 (Frontend Integration):
- [ ] Xây dựng UI Chat Widget (Floating button hoặc trang riêng).
- [ ] Tích hợp API Chatbot.
- [ ] Hiển thị sản phẩm gợi ý dưới dạng card có thể click vào chi tiết.

### Phase 14 (Validation & Security):
- [ ] Kiểm thử các kịch bản tư vấn sai lệch.
- [ ] Đảm bảo các cảnh báo y tế luôn được hiển thị rõ ràng.
- [ ] Rate limiting cho API để tránh lạm dụng token.

---

## 5. Rủi ro và giảm thiểu

| Rủi ro | Giảm thiểu |
|--------|------------|
| Chatbot tư vấn sai thuốc | Luôn kèm disclaimer "Tham khảo ý kiến bác sĩ" và chỉ gợi ý OTC. |
| Chi phí API cao | Sử dụng caching cho các câu hỏi phổ biến và rate limiting. |
| Độ trễ phản hồi (Latency) | Sử dụng streaming response nếu cần hoặc hiển thị trạng thái "đang suy nghĩ". |
| Dữ liệu sản phẩm không đủ | Cập nhật metadata cho sản phẩm (tag triệu chứng) trong `product-service`. |

---
*Yêu cầu được tạo: 2026-04-26*
