# Yêu cầu Milestone 2: Kiểm thử Toàn diện (MedCare)

> **Cập nhật:** 2026-04-23  
> **Milestone:** 2 — Chất lượng & Kiểm thử  
> **Trạng thái:** Đang lên kế hoạch

---

## 1. Mục tiêu tổng thể

Đảm bảo chất lượng và độ tin cậy của hệ thống MedCare trước khi deploy production bằng cách xây dựng bộ kiểm thử đa tầng bao gồm Unit Testing, Integration Testing, Frontend Testing và E2E Testing. Coverage target: 30–50%.

---

## 2. Phạm vi yêu cầu (In Scope)

### 2.1 Kiểm thử đơn vị Backend (Unit Testing)
- **Công nghệ:** JUnit 5 + Mockito (đã có trong Gradle dependencies)
- **Dịch vụ cần coverage:**
  - `OrderService` — Logic tạo đơn, selective checkout, state machine
  - `PaymentService` — Tạo URL VNPay, xử lý IPN callback
  - `ShippingService` — Tính phí GHN, tạo vận đơn
  - `PromotionService` — Validate voucher, tính discount
  - `CartService` — Redis serialization/deserialization, thêm/xóa item
- **Tiêu chí:** Mỗi Service cần ≥ 5 test cases bao gồm happy path và error cases

### 2.2 Kiểm thử tích hợp Backend (Integration Testing)
- **Công nghệ:** Spring Boot Test (`@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`)
- **Phạm vi:**
  - Endpoint `/api/orders/checkout` — Kiểm tra validation, luồng tạo đơn
  - Endpoint `/api/payments/**` — Kiểm tra IPN processing
  - Endpoint `/api/shipping/**` — Kiểm tra tính phí và tạo vận đơn
  - Repository layer — JPA queries cho `OrderRepository`, `PaymentRepository`
- **Database:** Dùng H2 in-memory hoặc TestContainers (MySQL)

### 2.3 Kiểm thử Frontend (Unit/Component Testing)
- **Công nghệ:** Vitest + React Testing Library
- **Component cần test:**
  - Trang Thanh toán (`/thanh-toan`) — Form validation, address auto-fill
  - Trang Giỏ hàng (`/gio-hang`) — Add/remove item, total calculation
  - Trang Đăng nhập — Auth form, error handling
  - Component Voucher — Apply/remove voucher
- **Tiêu chí:** Render đúng, user interaction đúng, không crash khi data rỗng

### 2.4 Kiểm thử E2E (End-to-End Testing)
- **Công nghệ:** Playwright (TypeScript)
- **Luồng người dùng cốt lõi:**
  1. **Luồng Đăng nhập** — Email/Password → Dashboard
  2. **Luồng Mua sắm** — Tìm kiếm sản phẩm → Thêm vào giỏ → Xem giỏ hàng
  3. **Luồng Thanh toán COD** — Checkout → Chọn địa chỉ → Xác nhận đơn hàng
  4. **Luồng Thanh toán VNPay** — Checkout → VNPay redirect → Callback thành công
- **Browser coverage:** Chromium (required), Firefox (optional)

---

## 3. Phạm vi ngoài (Out of Scope)

- Coverage target 70%+ (quá tốn thời gian so với deadline)
- Load testing / Performance testing
- Security penetration testing
- Mobile browser testing
- Test cho tất cả các service nhỏ (review-service, auth-service được bỏ qua)

---

## 4. Tiêu chí hoàn thành (Definition of Done)

### Phase 7 (Unit Tests — Backend):
- [ ] Tất cả 5 service có test files
- [ ] Mỗi service ≥ 5 test cases (happy + error)
- [ ] Build pass (`gradle test`)
- [ ] Coverage report được generate

### Phase 8 (Integration Tests — Backend):
- [ ] ≥ 3 endpoints được test end-to-end qua HTTP layer
- [ ] Repository tests cho các query phức tạp
- [ ] Test không phụ thuộc vào môi trường bên ngoài (mock external APIs)

### Phase 9 (Frontend Tests — Vitest):
- [ ] Vitest được cài đặt và cấu hình
- [ ] ≥ 3 components/pages có test
- [ ] `npm run test` pass

### Phase 10 (E2E — Playwright):
- [ ] Playwright được cài đặt và cấu hình
- [ ] 4 luồng cốt lõi có test scripts
- [ ] Tests chạy được trên Chromium
- [ ] Test report được export (HTML)

---

## 5. Rủi ro và giảm thiểu

| Rủi ro | Giảm thiểu |
|--------|------------|
| External APIs (VNPay, GHN) không available khi test | Mock bằng WireMock hoặc Mockito |
| Redis không chạy khi unit test | Dùng EmbeddedRedis hoặc mock RedisTemplate |
| Playwright flaky tests do timing | Dùng `waitFor()` và retry mechanisms |
| JUnit 5 chưa được cấu hình đúng | Kiểm tra build.gradle và thêm dependency nếu thiếu |

---
*Yêu cầu được tạo: 2026-04-23*
