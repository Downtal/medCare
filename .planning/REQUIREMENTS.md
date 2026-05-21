# Requirements: MedCare

**Defined:** 2026-05-15
**Core Value:** Nâng cao chất lượng mã nguồn thông qua tái cấu trúc DTO và cải thiện trải nghiệm người dùng cho các tác vụ AI.

## v1 Requirements

### Technical Debt (Refactoring)

- [ ] **REFACTOR-01**: Di chuyển các DTO trùng lặp (OrderRequest, ProductDTO, PaymentInfo, InventoryLookup...) từ các microservice riêng lẻ vào module `common-lib`.
- [ ] **REFACTOR-02**: Cập nhật các service phụ thuộc (`order`, `payment`, `product`, `inventory`) để sử dụng DTO tập trung từ `common-lib`.
- [ ] **REFACTOR-03**: Loại bỏ các class DTO trùng lặp và không còn sử dụng sau khi đã migrate sang `common-lib`.

### UX Improvements (AI Feedback)

- [ ] **UX-01**: Nâng cấp giao diện phân tích đơn thuốc (OCR) với trạng thái loading đa giai đoạn (Stage-based loading messages).
- [ ] **UX-02**: Tích hợp các thông báo trạng thái cụ thể (ví dụ: "Đang tải ảnh...", "Gemini đang phân tích...", "Đang đối chiếu sản phẩm...") vào component loading.
- [ ] **UX-03**: Đảm bảo hiệu ứng chuyển đổi mượt mà sử dụng Framer Motion cho các dòng thông báo.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Thay đổi cấu trúc Database | Rủi ro cao, không thuộc phạm vi dọn dẹp DTO |
| Dockerization | Dời sang Milestone tiếp theo |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REFACTOR-01 | Phase 31 | Pending |
| REFACTOR-02 | Phase 31 | Pending |
| REFACTOR-03 | Phase 31 | Pending |
| UX-01 | Phase 32 | Pending |
| UX-02 | Phase 32 | Pending |
| UX-03 | Phase 32 | Pending |

**Coverage:**
- v1 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0

---
*Requirements defined: 2026-05-15*
*Last updated: 2026-05-15 after milestone v1.8 definition (Refined)*
