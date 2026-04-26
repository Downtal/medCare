# Project State

## Project Reference

See: [.planning/PROJECT.md](file:///v:/TieuLuanTN\MedCare/.planning/PROJECT.md) (updated 2026-04-23)

## Quick Tasks

| Task ID | Date | Description |
| :--- | :--- | :--- |
| fix-env-malformed-entries | 2026-04-23 | Sửa lỗi DotenvException do file .env chứa thông tin thẻ test không đúng định dạng. |
| fix-missing-redis-dependency | 2026-04-23 | Sửa lỗi thiếu thư viện Redis trong order-service dẫn đến lỗi compile CartService. |
| fix-missing-repository-method | 2026-04-23 | Sửa lỗi "cannot find symbol" do thiếu method findByOrderCode trong OrderRepository. |
| fix-dto-type-mismatch | 2026-04-23 | Sửa lỗi không thể gán enum PaymentMethod vào trường String trong OrderDetailResponse. |
| fix-missing-redis-promotion | 2026-04-23 | Sửa lỗi thiếu thư viện Redis trong promotion-service dẫn đến lỗi compile PromotionService. |
| fix-missing-responseentity-import | 2026-04-23 | Sửa lỗi thiếu import ResponseEntity trong ShippingService. |
| fix-conflicting-bean-definition | 2026-04-23 | Sửa lỗi ConflictingBeanDefinitionException do trùng tên ShippingController ở 2 package. |
| fix-missing-datasource-config | 2026-04-23 | Sửa lỗi thiếu cấu hình Database (DataSource) trong application.yml của shipping-service. |
| fix-missing-localdatetime-import | 2026-04-23 | Sửa lỗi thiếu import LocalDateTime trong PaymentService. |
| fix-payment-db-access-denied | 2026-04-23 | Sửa lỗi Access denied cho user root trong payment-service do sai mật khẩu mặc định. |
| fix-port-conflict-promotion-payment | 2026-04-23 | Giải quyết xung đột port 8087 giữa payment và promotion service; bổ sung route thiếu trong Gateway. |
| fix-fetch-provinces-error | 2026-04-23 | Sửa lỗi "Failed to fetch provinces" do sai đường dẫn API và thiếu cấu hình permitAll cho master data shipping. |
| fix-checkout-400-error | 2026-04-23 | Sửa lỗi 400 Bad Request khi checkout: thêm GHN IDs vào form state, payload, và bỏ @NotBlank khỏi ward. |
| redesign-fe-pages | 2026-04-24 | Thiết kế lại Trang chủ, Liên hệ, Chính sách và Đồng bộ xác nhận đơn hàng với giao diện Premium. |

**Core value:** Đảm bảo chất lượng hệ thống MedCare với bộ kiểm thử đa tầng (Unit → Integration → Frontend → E2E).
**Current status:** Milestone 2 In Progress — Phase 9 Complete.

## Milestone 1: Core Flow Integration [COMPLETED]

### Status
- [x] Phase 1: Củng cố nền tảng (Completed)
- [x] Phase 2: Khởi tạo Dịch vụ Thanh toán (Completed)
- [x] Phase 3: Tích hợp Luồng Thanh toán (Completed)
- [x] Phase 4: Hoàn thiện Dịch vụ Vận chuyển (Completed)
- [x] Phase 5: Tự động hóa Theo dõi Đơn hàng (Completed)
- [x] Phase 6: Kiểm thử và Hoàn thiện (Completed)

## Milestone 2: Kiểm thử Toàn diện [IN PROGRESS]

### Status
- [x] Phase 7: Unit Testing — Backend Services (Completed 2026-04-23)
- [x] Phase 8: Integration Testing — REST Endpoints (Completed 2026-04-23)
  - [x] Plan 08-01: Order Service Integration Tests (Completed)
  - [x] Plan 08-02: Payment & Shipping Integration Tests (Completed)
  - [x] Plan 08-03: Promotion Service Integration Tests (Completed)
- [x] Phase 9: Frontend Testing — Vitest (Completed 2026-04-23)
  - [x] Plan 09-01: Setup & Basic UI Tests (Completed)
  - [x] Plan 09-02: Complex Component Tests (Completed)
- [x] Phase 10: E2E Testing — Playwright (Completed 2026-04-23)
  - [x] Plan 10-01: Setup & Login E2E (Completed)
  - [x] Plan 10-02: Purchase & Checkout Flow E2E (Completed)

### Next Action
Hệ thống MedCare đã hoàn thành tất cả các giai đoạn phát triển và kiểm thử theo lộ trình Milestone 2. Các bước tiếp theo bao gồm:
1. Tổng kết dự án và chuẩn bị tài liệu bàn giao.
2. Kiểm tra hiệu năng (Performance Testing) nếu cần thiết.
3. Triển khai thử nghiệm (Staging/Production).

---
*Last updated: 2026-04-23*
