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

- [x] **Adaptive Chatbot:** Xưng hô theo độ tuổi và hỗ trợ nhắc lịch/tái đặt đơn thuốc.

## Đã hoàn thành (Milestone 6)

- [x] **Product Recommendation MVP:** Xây dựng hệ thống gợi ý sản phẩm rule-based cho trang chủ và trang chi tiết.
    - [x] Thuật toán ranking dựa trên Order/Cart/Popularity.
    - [x] Tích hợp widget gợi ý vào Frontend với đầy đủ các trạng thái runtime.
    - [x] Hoàn tất kiểm chứng contract và hiệu năng backend.

## Current Milestone: v1.8 Code Quality & AI UX Polish

**Goal:** Consolidate shared data structures and enhance the user experience for long-running AI operations to meet production-grade maintainability and usability standards.

**Target features:**
- **Technical Debt Cleanup:**
    - Consolidate duplicated DTOs (OrderRequest, ProductDTO, PaymentInfo, etc.) from Order, Payment, and Product services into the centralized `common-lib`.
    - Update all microservices to use the unified DTOs, reducing boilerplate and potential mapping errors.
- **AI UX Optimization:**
    - Implement a "Stage-based Loading" system for Prescription OCR analysis to provide real-time feedback during the 3-7s processing window.

### Out of Scope

- Implementing new business features.
- Large-scale database schema refactoring.
- DevOps/Containerization (Docker/ELK) - moved to next milestone.

## Project Context

- Milestone 1-6 established core flows, AI integration, and recommendation systems.
- Milestone 8 focuses on hardening the existing architecture, removing redundancy, and polishing the user experience for slow AI operations.
- This is a critical "cleanup" phase to ensure the codebase meets academic/production standards.

## Constraints

- **Consistency**: All shared DTOs must be moved to `common-lib` without breaking existing API contracts.
- **Performance**: Locking mechanisms in Inventory must not introduce significant latency under low load.
- **Aesthetics**: Loading states must follow the established UI brand guidelines (Framer Motion, Shadcn).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Move DTOs to common-lib | Reduces code duplication and maintenance overhead | - Pending |
| Implement Stage-based Loading UI | Manages user expectations for long-running AI tasks | - Pending |

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
*Last updated: 2026-05-15 after milestone v1.7 initialization*
