# Kiến trúc hệ thống MedCare

## Kiến trúc Microservices (Polyglot)
Hệ thống sử dụng kiến trúc microservices đa ngôn ngữ để tận dụng thế mạnh của từng nền tảng:

### Dịch vụ Hạ tầng (Infrastructure)
- **Discovery Server:** Eureka (Java) - Quản lý danh sách dịch vụ.
- **API Gateway:** Spring Cloud Gateway (Java) - Entry point duy nhất.

### Dịch vụ Nghiệp vụ Java (Spring Boot)
- **Auth Service:** Quản lý danh tính, JWT.
- **User Service:** Thông tin người dùng.
- **Product Service:** Quản lý thuốc và dược phẩm.
- **Order Service:** Quy trình mua hàng.
- **Payment Service:** Tích hợp VNPay.
- **Shipping Service:** Tích hợp GHN.
- **Inventory, Promotion, Review, Notification Services:** Các module nghiệp vụ khác.

### Dịch vụ AI (Python/FastAPI)
- **AI Service:** Xử lý logic AI, LangChain, kết nối Gemini API. Hỗ trợ streaming response qua SSE.

## Luồng xử lý AI OCR (Milestone 5)
1. Người dùng tải ảnh đơn thuốc lên FE.
2. FE sử dụng **Tesseract.js** để tiền xử lý và trích xuất text sơ bộ.
3. Text và ảnh được gửi đến **AI Service**.
4. AI Service sử dụng **Gemini 1.5 Pro/Flash** để phân tích, trích xuất thông tin thuốc và ánh xạ vào danh mục sản phẩm của hệ thống.
5. Kết quả trả về FE để người dùng xác nhận và tạo đơn hàng.

## Luồng dữ liệu & Giao tiếp
- **Đồng bộ:** REST API qua OpenFeign/HTTPX.
- **Bất đồng bộ:** Notification (dự kiến sử dụng Message Broker).
- **Trạng thái:** MySQL (Bền vững), Redis (Tạm thời/Tốc độ cao).
