# BÁO CÁO TIẾN ĐỘ THỰC HIỆN TIỂU LUẬN/ĐỒ ÁN TỐT NGHIỆP: DỰ ÁN MEDCARE

**Ngày cập nhật:** 02/05/2026
**Tên dự án:** MedCare - Nền tảng Y tế và Chăm sóc Sức khỏe Toàn diện

---

## 1. TỔNG QUAN HỆ THỐNG
Dự án MedCare đã được xây dựng theo kiến trúc **Microservices (Polyglot)**, tận dụng các công nghệ hiện đại nhằm đảm bảo tính mở rộng, độ tin cậy và trải nghiệm người dùng tốt nhất.

### 1.1. Kiến trúc Hạ tầng & Backend
- **Core Framework:** Spring Boot 3.4.x (Java 21+).
- **Điều phối Microservices:** Hệ thống áp dụng triệt để Spring Cloud Netflix Eureka làm Discovery Server và Spring Cloud Gateway làm điểm truy cập duy nhất (API Gateway).
- **Giao tiếp Dịch vụ:** Tích hợp OpenFeign cho giao tiếp REST giữa các vi dịch vụ bằng Java và HTTPX cho các dịch vụ Python.
- **Dữ liệu & Bộ nhớ đệm:** Sử dụng MySQL cho dữ liệu bền vững (Persistence) thông qua Spring Data JPA/Hibernate và Redis Cloud cho việc lưu trữ bộ nhớ đệm (Caching).
- **AI Service:** Tách biệt thành một service độc lập sử dụng **Python 3.12+ (FastAPI)**, tích hợp **LangChain** và **Google Gemini AI** (Gemini 1.5) nhằm xử lý tối ưu các bài toán AI/OCR và tư vấn y tế.

### 1.2. Frontend
- **Công nghệ cốt lõi:** Next.js 15.5.x (App Router), React 18.3.1, TypeScript.
- **Giao diện & Trải nghiệm:** Áp dụng Tailwind CSS 4.0, Shadcn UI, và Framer Motion cho giao diện mượt mà, hiện đại.
- **Quản lý Trạng thái:** Zustand kết hợp với TanStack Query.

### 1.3. Các Tích Hợp Nổi Bật
- **Thanh toán trực tuyến:** VNPay.
- **Vận chuyển:** Giao Hàng Nhanh (GHN).
- **Trích xuất thông tin (OCR):** Tesseract.js (Client-side) kết hợp với Google Gemini AI (Server-side) cho tính năng phân tích đơn thuốc, ánh xạ thuốc chính xác.

---

## 2. TIẾN ĐỘ THỰC HIỆN CÁC GIAI ĐOẠN (MILESTONES)

Hệ thống đã hoàn tất xuất sắc 5 Milestone lớn, bao phủ từ luồng mua bán cơ bản đến các chức năng thông minh cốt lõi:

- **Milestone 1:** Hoàn thiện luồng mua bán cốt lõi (Core Flow Integration) - **[HOÀN THÀNH]**
- **Milestone 2:** Kiểm thử toàn diện hệ thống - **[HOÀN THÀNH]**
- **Milestone 3:** Tích hợp hệ thống Chatbot AI Tư vấn y tế - **[HOÀN THÀNH]**
- **Milestone 4:** Định hình và tối ưu hóa hệ thống - **[HOÀN THÀNH]**
- **Milestone 5:** Quản lý Đơn thuốc & AI OCR - **[HOÀN THÀNH]**
  - Phase 19: Lưu trữ đơn thuốc và luồng Backend xử lý.
  - Phase 20: AI OCR & Ánh xạ thông tin thuốc tự động với kho hàng hiện có.
  - Phase 21: Thiết kế giao diện cho Dược sĩ và hệ thống thông báo Real-time.
  - Phase 22: Hoàn thiện luồng thanh toán E2E từ đơn thuốc được AI phân tích.

**Tình trạng chung:** Tiến độ dự án đạt 100% so với kế hoạch ban đầu (hết Milestone 5). Các tính năng liên quan đến trích xuất văn bản từ hình ảnh (AI OCR) và kết nối với cơ sở dữ liệu sản phẩm để gợi ý đơn hàng đã hoạt động xuyên suốt từ Frontend qua API Gateway đến AI Service và ngược lại một cách mượt mà.

---

## 3. ĐÁNH GIÁ CHẤT LƯỢNG MÃ NGUỒN & KIỂM THỬ

- **Cấu trúc & Quy ước:** Codebase được duy trì chuyên nghiệp. Cả Backend (Java, Python) và Frontend (Next.js) đều tuân thủ chặt chẽ các quy ước viết code chuẩn công nghiệp (Architecture layers, MVC, RESTful Design). 
- **Kiểm thử (Testing):**
  - Đã tích hợp các framework kiểm thử như: JUnit 5 (Backend), Vitest và Playwright (Frontend).
  - Tình trạng: Đã có nền tảng cấu hình rõ ràng, các luồng kiểm thử E2E (End-to-End) quan trọng như thanh toán và nhận diện AI OCR đang được duy trì thông qua Playwright.

---

## 4. KẾ HOẠCH TIẾP THEO TRƯỚC KHI BẢO VỆ

- **Đóng gói dự án (Dockerization):** Chuyển đổi cấu trúc chạy thủ công bằng script (file .bat) sang môi trường Container hóa bằng Docker Compose nhằm dễ dàng triển khai ứng dụng cho hội đồng chấm đồ án.
- **Hoàn thiện tài liệu:** Tổng hợp lại tài liệu thiết kế hệ thống, kết xuất sơ đồ luồng dữ liệu cuối cùng và hoàn chỉnh quyển báo cáo tốt nghiệp.
- **Chuẩn bị Demo:** Đảm bảo luồng AI tư vấn và AI OCR đơn thuốc hoạt động mượt mà không gặp vấn đề về độ trễ, đây sẽ là những tính năng mũi nhọn "wow factor" khi demo cho hội đồng.
