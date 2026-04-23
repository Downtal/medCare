# MedCare Implementation Tasks (Tháng 4)

## Tuần 1: Nền tảng Core E-commerce & Xác thực
- [ ] **Backend (Spring Boot & DB)**
  - [ ] Kiểm tra và chạy script `medcare_init.sql` (Cơ sở dữ liệu).
  - [ ] Phát triển `Auth Service` (JWT, Đăng ký, Đăng nhập).
  - [ ] Phát triển `User Service` (Xem thông tin cá nhân).
  - [ ] Phát triển `Product Service` cơ bản (CRUD Sản phẩm, Danh mục).
- [ ] **Frontend (NextJS - Premium UI)**
  - [ ] Cấu hình TailwindCSS với các màu sắc/fonts hiện đại.
  - [ ] Xây dựng trang Đăng nhập / Đăng ký.
  - [ ] Xây dựng giao diện Trang chủ & Danh sách sản phẩm.
  - [ ] Tích hợp gọi API Auth với Backend.

## Tuần 2: Giỏ hàng, Đơn hàng & Thanh toán
- [ ] **Backend**
  - [ ] Phát triển chức năng Giỏ hàng.
  - [ ] Phát triển luồng đặt hàng (Order API).
  - [ ] Tích hợp VNPay Sandbox.
- [ ] **Frontend**
  - [ ] Giao diện Giỏ hàng & Checkout.
  - [ ] Theo dõi đơn hàng.
  - [ ] Admin Dashboard cơ bản.

## Tuần 3: AI Service & Chatbot
- [ ] Khởi tạo dự án AI Service (Python FastAPI).
- [ ] Tích hợp OpenAI API xử lý hội thoại & trích xuất triệu chứng.
- [ ] Kết nối AI Service với DB (Gợi ý thuốc theo triệu chứng).
- [ ] Phát triển Frontend Chatbot Interface.

## Tuần 4: Nâng cao, Hoàn thiện & Demo
- [ ] Xây dựng luồng cảnh báo (Risk Warning) khi người dùng chọn thuốc.
- [ ] Bổ sung Semantic Search (nếu cần).
- [ ] Fix bug, đánh bóng UI/UX (Mượt mà, Responsive).
- [ ] End-to-End Test chuẩn bị Demo.
