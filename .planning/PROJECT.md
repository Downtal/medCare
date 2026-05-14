# MedCare - Hệ thống Thương mại Điện tử Dược phẩm

## Giới thiệu chung

MedCare là một nền tảng thương mại điện tử chuyên biệt cho dược phẩm và các dịch vụ chăm sóc sức khỏe. Hệ thống được xây dựng trên kiến trúc microservices hiện đại, giúp người dùng dễ dàng tìm kiếm, đặt mua thuốc và quản lý hồ sơ sức khỏe cá nhân.

## Giá trị cốt lõi

Cung cấp trải nghiệm mua sắm dược phẩm an toàn, tin cậy với quy trình đặt hàng (Order Flow) khép kín, tích hợp thanh toán điện tử và vận chuyển tự động.

## Các yêu cầu hệ thống

### Đã hoàn thành (Trong Codebase)

- ✓ Hệ thống xác thực và phân quyền (JWT, OAuth2) — `auth-service`
- ✓ Quản lý danh mục và chi tiết sản phẩm — `product-service`
- ✓ Giỏ hàng lưu trữ trên Redis — `order-service/cart`
- ✓ Quản lý thông tin và địa chỉ người dùng — `user-service`
- ✓ Tích hợp đầy đủ với API Giao Hàng Nhanh (GHN) để tạo vận đơn và tính phí — `shipping-service`
- ✓ Tích hợp thanh toán VNPay (IPN/Callback) — `payment-service`

### Đang thực hiện / Vừa hoàn tất (Milestone 1)

- [x] **Hoàn thiện luồng Order:** Xây dựng máy trạng thái (State Machine) đầy đủ cho đơn hàng.
- [x] **Xây dựng `payment-service`:** Tích hợp thành công cổng thanh toán VNPay.
- [x] **Tự động hóa vận chuyển:** Tích hợp Webhooks từ GHN để cập nhật trạng thái đơn hàng thời gian thực.
- [x] **Đồng bộ tồn kho:** Trừ kho tự động theo đơn hàng thực tế (FIFO).
- [x] **Ổn định hệ thống:** Xử lý lỗi Serialization trên Redis và cải thiện JWT parsing.

### Đang thực hiện (Milestone 2)

- [ ] **Kiểm thử đơn vị (Unit Testing):** Viết test cho tất cả các lớp Service quan trọng (OrderService, PaymentService, ShippingService, PromotionService, CartService).
- [ ] **Kiểm thử tích hợp (Integration Testing):** Kiểm tra các endpoint REST và tương tác với repository/database.
- [ ] **Kiểm thử Frontend:** Triển khai Vitest cho các thành phần UI quan trọng (trang thanh toán, giỏ hàng, đăng nhập).
- [ ] **Kiểm thử E2E (End-to-End):** Sử dụng Playwright cho các luồng người dùng cốt lõi (Checkout, Đăng nhập, Tìm kiếm sản phẩm).

### Đã hoàn thành (Milestone 3)

- [x] **Chatbot AI Tư vấn:** Phát triển hệ thống Chatbot thông minh hỗ trợ người dùng tìm kiếm sản phẩm dựa trên triệu chứng.
    - [x] Nhận diện triệu chứng và nhu cầu từ ngôn ngữ tự nhiên.
    - [x] Mapping triệu chứng sang các nhóm sản phẩm/danh mục tương ứng.
    - [x] Hệ thống quản lý Mapping dành cho Admin.
    - [x] Chat history và cơ chế phản hồi (Feedback loop).

## Đã hoàn thành (Milestone 4)

- [x] **Personalized UI:** Mục "Dành riêng cho bạn" tại Trang chủ và Quick Actions tại Chatbot.
- [x] **Health Dashboard:** Phân tích bệnh sử tự động bằng AI và quản lý thông tin sức khỏe cá nhân (BMI, dị ứng).
- [x] **Proactive Safety:** Cảnh báo tương tác thuốc tại Checkout dựa trên lịch sử mua hàng.
- [x] **Adaptive Chatbot:** Xưng hô theo độ tuổi và hỗ trợ nhắc lịch/tái đặt đơn thuốc.

## Current Milestone: v1.6 Stability & Data Consistency Hardening

**Goal:** Ổn định các luồng nghiệp vụ cốt lõi bằng cách xử lý triệt để lỗi Redis serialization, chuẩn hóa phản hồi JWT lỗi về `401 Unauthorized`, và đồng bộ tồn kho an toàn khi checkout đồng thời.

**Target features:**
- **Cart Redis Serialization:** Chuẩn hóa cấu hình serialization Redis của giỏ hàng sang `GenericJackson2JsonRedisSerializer` để loại bỏ `ClassCastException` khi đọc/ghi hash.
- **JWT Error Handling:** Bắt `ExpiredJwtException`/token lỗi ngay tại Spring Security Filter và trả lỗi chuẩn `401` để FE xử lý refresh token.
- **Inventory Concurrency Control:** Áp dụng khóa khi trừ tồn kho (ưu tiên pessimistic lock trong JPA, phương án mở rộng là Redis distributed lock) để tránh race condition và lệch tồn kho hiển thị.

### Ngoài phạm vi (Out of Scope)

- [Ứng dụng Mobile Native] — Hiện tại tập trung hoàn toàn vào Web Responsive (Next.js).
- [Coverage target 70%+] — Mức target là 30-50% cho mục đích demo và đảm bảo chất lượng.

## Ngữ cảnh dự án

- Dự án đã hoàn thành Milestone 1, 2, 3, 4 và 5; các năng lực nghiệp vụ chính đã đi vào trạng thái vận hành.
- Milestone 6 tập trung vào hardening kỹ thuật sau triển khai: xử lý lỗi runtime có tác động trải nghiệm người dùng, tăng tính nhất quán dữ liệu, và giảm rủi ro regression ở các luồng checkout/profile/cart.

## Các ràng buộc (Constraints)

- **Công nghệ (Tech Stack)**: Java 17+ / Spring Boot 3 (Backend), Next.js 16 / TypeScript (Frontend).
- **Phụ thuộc**: Các dịch vụ API bên thứ ba (VNPay, GHN, Cloudinary).
- **Cơ sở dữ liệu**: Mô hình Database-per-service với MySQL.
- **Coverage target**: 30-50% (đảm bảo chất lượng trước deploy, phù hợp cho demo).
- **Testing Stack**: JUnit 5 + Mockito (Backend), Vitest (Frontend), Playwright (E2E).

## Các quyết định quan trọng

| Quyết định | Lý do | Trạng thái |
|------------|-------|------------|
| Kiến trúc Microservices | Đảm bảo khả năng mở rộng độc lập cho các module. | Đã triển khai |
| Tích hợp VNPay | Cổng thanh toán phổ biến và ổn định tại Việt Nam. | Đã hoàn thành |
| GHN Webhooks | Cập nhật trạng thái đơn hàng thời gian thực. | Đã hoàn thành |
| Đồng bộ tồn kho FIFO | Đảm bảo quản lý lô hàng và hạn sử dụng chính xác. | Đã hoàn thành |
| Playwright cho E2E | Framework hiện đại, hỗ trợ tốt Next.js, API phong phú. | Milestone 2 |
| Vitest cho Frontend | Tích hợp sẵn với Vite/Next.js, nhanh hơn Jest. | Milestone 2 |
| Gemini Multimodal | OCR và phân tích đơn thuốc từ hình ảnh. | Milestone 5 |
| Cloudinary Storage | Lưu trữ ảnh đơn thuốc và ảnh sản phẩm hiệu quả. | Milestone 5 |
| GenericJackson2JsonRedisSerializer cho cart | Đồng nhất hash key/value serialization, giảm lỗi cast khi đọc dữ liệu Redis. | Milestone 6 |
| JWT lỗi phải trả 401 tại filter | FE cần trạng thái xác thực chuẩn để điều phối refresh token. | Milestone 6 |
| Pessimistic lock cho trừ tồn kho | Ngăn oversell và lệch tồn kho khi có nhiều checkout đồng thời. | Milestone 6 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

## Sự tiến triển

Tài liệu này sẽ tiếp tục được cập nhật theo từng Milestone mới.

---
*Cập nhật lần cuối: 2026-05-14 — Bắt đầu Milestone 6: Stability & Data Consistency Hardening*
