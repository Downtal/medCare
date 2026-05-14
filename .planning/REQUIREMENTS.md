# Milestone 6 Requirements: Stability & Data Consistency Hardening

**Defined:** 2026-05-14
**Core Value:** Cung cấp trải nghiệm mua dược phẩm an toàn, tin cậy với dữ liệu nhất quán và phản hồi xác thực chuẩn.

## v1 Requirements

### Cart Reliability

- [ ] **CART-01**: User có thể đọc/ghi giỏ hàng mà không phát sinh `ClassCastException` khi dữ liệu lưu trên Redis hash.
- [ ] **CART-02**: User vẫn truy cập được giỏ hàng đã tồn tại sau khi chuẩn hóa sang `GenericJackson2JsonRedisSerializer` (không mất dữ liệu hợp lệ).

### Authentication Robustness

- [ ] **AUTH-01**: User nhận `401 Unauthorized` (không phải `500`) khi access token hết hạn.
- [ ] **AUTH-02**: User nhận `401 Unauthorized` (không phải `500`) khi access token sai định dạng hoặc chữ ký không hợp lệ.
- [ ] **AUTH-03**: FE nhận payload lỗi xác thực ổn định để kích hoạt luồng refresh token tự động.

### Inventory Consistency

- [ ] **INV-01**: User checkout đồng thời không gây trừ tồn kho trùng cho cùng lô hàng/sản phẩm.
- [ ] **INV-02**: User luôn thấy số lượng tồn kho phản ánh đúng ngay sau giao dịch checkout thành công.

### Quality Guardrails

- [ ] **QUAL-01**: Dev có test bao phủ các nhánh lỗi serialization cart, JWT expired/malformed, và stock deduction cạnh tranh.
- [ ] **QUAL-02**: Dev có log/chỉ báo đủ để truy vết lỗi xác thực hoặc lệch tồn kho khi vận hành.

## v2 Requirements

### Future Hardening

- **LOCK-01**: Mở rộng sang Redis distributed lock đa node nếu tải tăng vượt khả năng pessimistic lock.
- **QUAL-03**: Bổ sung stress test tự động với tải cao cho luồng checkout song song.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Refactor toàn bộ kiến trúc Redis các service khác ngoài cart | Không cần thiết cho phạm vi bug-fix milestone này |
| Thiết kế lại cơ chế auth end-to-end (OAuth flow, session model) | Chỉ cần chuẩn hóa handling lỗi JWT hiện có |
| Tối ưu hiệu năng toàn hệ thống ở mức hạ tầng | Milestone tập trung độ đúng và độ ổn định nghiệp vụ |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CART-01 | Phase 23 | Pending |
| CART-02 | Phase 23 | Pending |
| AUTH-01 | Phase 24 | Pending |
| AUTH-02 | Phase 24 | Pending |
| AUTH-03 | Phase 24 | Pending |
| INV-01 | Phase 25 | Pending |
| INV-02 | Phase 25 | Pending |
| QUAL-01 | Phase 26 | Pending |
| QUAL-02 | Phase 26 | Pending |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-05-14*
*Last updated: 2026-05-14 after milestone v1.6 definition*
