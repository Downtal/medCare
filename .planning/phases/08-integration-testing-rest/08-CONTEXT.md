# Context Phase 8: Integration Testing — REST Endpoints

Giai đoạn này tập trung vào việc đảm bảo các microservices backend hoạt động chính xác khi kết hợp các tầng Controller, Service và Repository, đồng thời xác thực khả năng bảo mật của API.

## Các quyết định quan trọng

1. **Hạ tầng Test:**
   - Sử dụng **H2 In-memory database** để đảm bảo tốc độ và tính cô lập của môi trường test.
   - Sử dụng `@SpringBootTest` với `WebEnvironment.RANDOM_PORT` để thực hiện các cuộc gọi API thực tế qua `TestRestTemplate` hoặc `MockMvc`.
   - Mock các dịch vụ bên ngoài (External Feign Clients như GHN, VNPay) bằng `MockRestServiceServer` hoặc `@MockBean`.

2. **Bảo mật (Security):**
   - Kiểm tra tầng **JWT Authentication**: Đảm bảo các API endpoint yêu cầu token hợp lệ và trả về 401/403 khi thiếu hoặc sai token.
   - Giả lập người dùng bằng cách tạo token test trong `application-test.yml`.

3. **Dữ liệu mẫu (Data Population):**
   - Sử dụng `@Sql` annotation để load dữ liệu từ các file `.sql` (ví dụ: `vouchers.sql`, `categories.sql`) trước mỗi test class.
   - Sử dụng `@Transactional` trên các test method để tự động rollback dữ liệu sau khi chạy xong, đảm bảo tính sạch sẽ của database.

## Phạm vi kiểm thử

- **Order Service:** Luồng checkout đầy đủ, lưu đơn hàng và cập nhật trạng thái.
- **Payment Service:** Luồng tạo giao dịch và xử lý IPN từ VNPay.
- **Shipping Service:** Luồng tính phí vận chuyển và tạo đơn hàng vận chuyển GHN.
- **Promotion Service:** Luồng áp dụng voucher và kiểm tra tính hợp lệ của mã giảm giá.

## Rủi ro và Giải pháp

- **Rủi ro:** Các Feign Client gọi chéo giữa các service có thể gây lỗi khi chạy Integration Test cô lập.
- **Giải pháp:** Sử dụng `@MockBean` để giả lập phản hồi từ các service khác (ví dụ: Mock `ProductClient` khi test `OrderService`).
