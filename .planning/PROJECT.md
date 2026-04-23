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

### Ngoài phạm vi (Out of Scope)

- [Hệ thống tư vấn trực tuyến] — Ưu tiên hoàn thiện luồng mua sắm trước.
- [Ứng dụng Mobile Native] — Hiện tại tập trung hoàn toàn vào Web Responsive (Next.js).
- [Coverage target 70%+] — Mức target là 30-50% cho mục đích demo và đảm bảo chất lượng.

## Ngữ cảnh dự án

- Dự án đã hoàn thành Milestone 1, thiết lập thành công luồng nghiệp vụ cốt lõi.
- Milestone 2 tập trung vào đảm bảo chất lượng: Unit Test, Integration Test, Frontend Test và E2E với Playwright.
- Các microservices giao tiếp chặt chẽ qua OpenFeign.
- Tập trung vào trải nghiệm người dùng tại thị trường Việt Nam với các tích hợp nội địa (GHN, VNPay).

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

## Sự tiến triển

Tài liệu này sẽ tiếp tục được cập nhật theo từng Milestone mới.

---
*Cập nhật lần cuối: 2026-04-23 — Bắt đầu Milestone 2: Kiểm thử Toàn diện*
