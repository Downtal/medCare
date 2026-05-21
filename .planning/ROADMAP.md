# Milestone 8 Roadmap: Code Quality & AI UX Polish

### Phase 31: DTO Consolidation (common-lib)
- **Goal**: Loại bỏ sự trùng lặp mã nguồn và chuẩn hóa giao tiếp giữa các microservices.
- **Requirements**: REFACTOR-01, REFACTOR-02, REFACTOR-03
- **Success criteria**:
    1. Module `common-lib` chứa đầy đủ các DTO dùng chung.
    2. Các dịch vụ `order`, `payment`, `product`, `inventory` build thành công và chạy ổn định với thư viện dùng chung.
    3. Xóa bỏ được ít nhất 10 class DTO trùng lặp trong codebase.

### Phase 32: AI UX Refinement (Staged Loading)
- **Goal**: Cải thiện cảm nhận của người dùng về tốc độ xử lý khi phân tích đơn thuốc bằng AI.
- **Requirements**: UX-01, UX-02, UX-03
- **Success criteria**:
    1. UI hiển thị các thông báo tiến trình cụ thể theo thời gian thực (hoặc mô phỏng).
    2. Trải nghiệm người dùng mượt mà hơn, giảm tỷ lệ bỏ ngang khi chờ AI xử lý.

---
*Roadmap defined: 2026-05-15*
*Last updated: 2026-05-15 after milestone v1.8 definition (Refined)*
