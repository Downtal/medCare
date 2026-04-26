# Lộ trình dự án: MedCare - Hoàn thiện luồng Order

## Tổng quan
Hành trình đưa MedCare từ một hệ thống microservices đang phát triển thành một nền tảng thương mại điện tử ổn định, với luồng đặt hàng khép kín từ lúc chọn thuốc đến khi nhận hàng thành công, tích hợp thanh toán VNPay và vận chuyển GHN tự động.

## Các giai đoạn (Phases)

- [x] **Phase 1: Củng cố nền tảng** - Sửa các lỗi tồn đọng về Redis và JWT để đảm bảo hệ thống chạy ổn định.
- [x] **Phase 2: Khởi tạo Dịch vụ Thanh toán** - Xây dựng `payment-service` và tích hợp SDK VNPay.
- [x] **Phase 3: Tích hợp Luồng Thanh toán** - Xử lý URL thanh toán, Callback và Webhook (IPN) từ VNPay.
- [x] **Phase 4: Hoàn thiện Dịch vụ Vận chuyển** - Thắt chặt kết nối với API GHN và đồng bộ dữ liệu địa chỉ.
- [x] **Phase 5: Tự động hóa Theo dõi Đơn hàng** - Tích hợp Webhooks từ GHN để cập nhật trạng thái tự động.
- [x] **Phase 6: Kiểm thử và Hoàn thiện** - Đồng bộ tồn kho, kiểm thử luồng E2E và tối ưu trải nghiệm người dùng.

## Chi tiết các giai đoạn

### Phase 1: Củng cố nền tảng [COMPLETED]
- [x] 01-01: Sửa lỗi Redis Serialization trong `CartService`.
- [x] 01-02: Fix lỗi logic parsing JWT và cập nhật security config.
- [x] 01-03: Áp dụng cho các service còn lại.

### Phase 2: Khởi tạo Dịch vụ Thanh toán [COMPLETED]
- [x] 02-01: Khởi tạo dự án `payment-service`.
- [x] 02-02: Tích hợp cấu hình VNPay và logic tạo Payment URL.

### Phase 3: Tích hợp Luồng Thanh toán [COMPLETED]
- [x] 03-01: Xây dựng Endpoint nhận IPN (Webhook) và Callback từ VNPay.
- [x] 03-02: Kết nối `payment-service` với `order-service`.

### Phase 4: Hoàn thiện Dịch vụ Vận chuyển [COMPLETED]
- [x] 04-01: Tự động tạo vận đơn GHN khi có đơn hàng mới.
- [x] 04-02: Đồng bộ dữ liệu địa chỉ hành chính từ GHN API.

### Phase 5: Tự động hóa Theo dõi Đơn hàng [COMPLETED]
- [x] 05-01: Xây dựng Endpoint Webhook trong shipping-service.
- [x] 05-02: Đồng bộ trạng thái vào Order Service.

### Phase 6: Kiểm thử và Hoàn thiện [COMPLETED]
- [x] 06-01: Đồng bộ tồn kho thực tế giữa Order và Inventory.
- [x] 06-02: Hoàn thiện API và Giao diện Tracking/Voucher.
- [x] 06-03: Kiểm thử E2E và Hoàn thiện Milestone 1.

## Tiến độ (Progress)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Củng cố nền tảng | 3/3 | Completed | 2026-04-22 |
| 2. Khởi tạo Payment Service | 2/2 | Completed | 2026-04-22 |
| 3. Tích hợp Thanh toán | 2/2 | Completed | 2026-04-22 |
| 4. Hoàn thiện Vận chuyển | 2/2 | Completed | 2026-04-22 |
| 5. Tự động hóa Theo dõi | 2/2 | Completed | 2026-04-22 |
| 6. Kiểm thử & Hoàn thiện | 3/3 | Completed | 2026-04-22 |

---
*Roadmap defined: 2026-04-22*
*Last updated: 2026-04-23*

---

## Milestone 2: Kiểm thử Toàn diện

### Mục tiêu
Đảm bảo chất lượng và độ tin cậy của hệ thống bằng bộ kiểm thử đa tầng. Coverage target: 30–50%.

### Các giai đoạn (Phases)

- [x] **Phase 7: Unit Testing — Backend Services** - Viết unit tests cho tất cả Service quan trọng (JUnit 5 + Mockito). (Completed)
- [x] **Phase 8: Integration Testing — REST Endpoints** - Kiểm tra endpoint HTTP và repository JPA bằng Spring Boot Test. (Completed)
- [x] **Phase 9: Frontend Testing — Vitest** - Thiết lập Vitest và test các component UI quan trọng. (Completed)
- [ ] **Phase 10: E2E Testing — Playwright** - Test 4 luồng người dùng cốt lõi (Đăng nhập, Mua sắm, Checkout COD, Checkout VNPay).

### Chi tiết các giai đoạn

#### Phase 7: Unit Testing — Backend Services [COMPLETED]
- [x] 07-01: Thiết lập cấu hình test (build.gradle, application-test.yml) + test OrderService
- [x] 07-02: Test PaymentService, ShippingService
- [x] 07-03: Test PromotionService, CartService + Coverage report

#### Phase 8: Integration Testing — REST Endpoints [COMPLETED]
- [x] 08-01: Setup Spring Boot Test + test `/api/orders/checkout` endpoint
- [x] 08-02: Test `/api/payments/**` và `/api/shipping/**` endpoints + Repository tests
- [x] 08-03: Integration Tests for Promotion Service + Final Coverage

#### Phase 9: Frontend Testing — Vitest [COMPLETED]
- [x] 09-01: Cài đặt và cấu hình Vitest + React Testing Library
- [x] 09-02: Viết tests cho CheckoutPage, CartPage và AuthPage (Đã hoàn thành test các component cốt lõi)

#### Phase 10: E2E Testing — Playwright [TODO]
- [ ] 10-01: Cài đặt Playwright + cấu hình base URL, auth helpers
- [ ] 10-02: Viết E2E test cho luồng Đăng nhập và Mua sắm
- [ ] 10-03: Viết E2E test cho luồng Checkout COD và VNPay + HTML report

### Tiến độ (Progress)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. Unit Testing — Backend | 3/3 | Completed | 2026-04-23 |
| 8. Integration Testing | 3/3 | Completed | 2026-04-23 |
| 9. Frontend Testing — Vitest | 2/2 | Completed | 2026-04-23 |
| 10. E2E — Playwright | 0/3 | Todo | - |

---
*Milestone 2 started: 2026-04-23*

---

## Milestone 3: Hệ thống Chatbot AI Tư vấn

### Mục tiêu
Xây dựng trợ lý ảo thông minh giúp người dùng tìm kiếm sản phẩm y tế bằng ngôn ngữ tự nhiên.

### Các giai đoạn (Phases)

- [ ] **Phase 11: AI Service Foundation** - Khởi tạo `ai-service` và cấu hình kết nối LLM (OpenAI/Gemini).
- [ ] **Phase 12: Prompt Engineering & Mapping Logic** - Phát triển Prompt dược sĩ ảo và logic mapping sản phẩm từ triệu chứng.
- [ ] **Phase 13: UI Chatbot & Frontend Integration** - Xây dựng Widget Chat và tích hợp vào Website.
- [ ] **Phase 14: Safety & Optimization** - Cài đặt các rào chắn an toàn (Guardrails), xử lý lỗi và tối ưu hiệu năng.

### Chi tiết các giai đoạn

#### Phase 11: AI Service Foundation [TODO]
- [ ] 11-01: Khởi tạo Spring Boot `ai-service` + OpenFeign client tới `product-service`.
- [ ] 11-02: Cấu hình kết nối LLM (API Key, Model config) và xây dựng REST API cơ bản cho Chat.

#### Phase 12: Prompt Engineering & Mapping Logic [TODO]
- [ ] 12-01: Xây dựng System Prompt chuyên sâu về y tế/dược phẩm (OTC).
- [ ] 12-02: Triển khai logic Mapping: Trích xuất intent -> Query `product-service` -> Tổng hợp kết quả.

#### Phase 13: UI Chatbot & Frontend Integration [TODO]
- [ ] 13-01: Phát triển Chat Widget bằng React/Next.js (Floating widget).
- [ ] 13-02: Tích hợp API Chatbot và hiển thị sản phẩm dưới dạng Card tương tác.

#### Phase 14: Safety & Optimization [TODO]
- [ ] 14-01: Triển khai hệ thống cảnh báo y tế bắt buộc và kiểm soát nội dung (Content filtering).
- [ ] 14-02: Tối ưu Latency (Streaming response) và kiểm thử các kịch bản thực tế.

### Tiến độ (Progress)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 11. AI Foundation | 0/2 | Todo | - |
| 12. Prompt & Mapping Logic | 0/2 | Todo | - |
| 13. UI & FE Integration | 0/2 | Todo | - |
| 14. Safety & Optimization | 0/2 | Todo | - |

---
*Milestone 3 started: 2026-04-26*
