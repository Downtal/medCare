# Milestone 6 Roadmap: Stability & Data Consistency Hardening

### Phase 23: Cart Redis Serialization Hardening
- **Goal:** Chuẩn hóa serialization của CartService để loại bỏ lỗi `ClassCastException` và đảm bảo tương thích dữ liệu giỏ hàng hiện có.
- **Requirements:** CART-01, CART-02
- **Success criteria:**
1. Cấu hình Redis cho cart dùng nhất quán `GenericJackson2JsonRedisSerializer` cho hash key/value.
2. Các thao tác add/update/remove/read cart không còn ném `ClassCastException`.
3. Dữ liệu cart hợp lệ đã có trước đó vẫn được đọc thành công hoặc có fallback/migration an toàn.

### Phase 24: JWT Error Handling Standardization
- **Goal:** Chuẩn hóa phản hồi lỗi xác thực ở security filter để token expired/malformed luôn trả `401 Unauthorized`.
- **Requirements:** AUTH-01, AUTH-02, AUTH-03
- **Success criteria:**
1. `ExpiredJwtException` được bắt tại filter và phản hồi `401` với body lỗi ổn định.
2. Token sai định dạng/chữ ký cũng trả `401` thay vì `500`.
3. FE có thể phân biệt và kích hoạt refresh token theo cấu trúc lỗi đã thống nhất.

### Phase 25: Inventory Concurrency Control
- **Goal:** Loại bỏ race condition trừ tồn kho bằng cơ chế khóa phù hợp khi có checkout đồng thời.
- **Requirements:** INV-01, INV-02
- **Success criteria:**
1. Luồng trừ tồn kho sử dụng pessimistic lock (hoặc lock tương đương) tại điểm cập nhật tồn.
2. Không xuất hiện oversell khi chạy nhiều checkout song song trên cùng SKU.
3. Số lượng tồn kho trả về cho FE khớp trạng thái đã commit trong DB.

### Phase 26: Regression, Tests, and Observability
- **Goal:** Khóa chất lượng sau khi fix bằng test hồi quy và khả năng quan sát vận hành.
- **Requirements:** QUAL-01, QUAL-02
- **Success criteria:**
1. Có test backend cho các case cart serialization, JWT expired/malformed, và inventory concurrency.
2. Log/metrics cho các điểm lỗi chính được bổ sung để truy vết nhanh.
3. Smoke test các luồng cart/profile/checkout pass sau khi áp dụng fix.
