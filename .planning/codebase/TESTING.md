# Chiến lược kiểm thử của MedCare

Hệ thống MedCare áp dụng mô hình kim tự tháp kiểm thử (Testing Pyramid) bao gồm: Kiểm thử đơn vị (Unit Test), Kiểm thử tích hợp (Integration Test) và Kiểm thử hộp đen toàn trình (End-to-End Test).

---

## 1. Kiểm thử Đơn vị & Tích hợp Backend (Java & Python)

### Kiểm thử Java (Spring Boot)
*   **Thư viện sử dụng:** JUnit 5, Spring Boot Starter Test, Mockito, H2 Database (In-memory database phục vụ test cô lập).
*   **Cấu trúc thư mục:** Các lớp kiểm thử nằm trong thư mục `src/test/java/` của mỗi microservice tương ứng.
*   **Chiến lược:**
    *   **Unit Test:** Sử dụng Mockito để cô lập tầng Service khỏi Repository. Mock các Feign Client gọi sang dịch vụ khác.
    *   **Integration Test:** Sử dụng `@SpringBootTest` kết hợp `@ActiveProfiles("test")` để khởi động ứng dụng với database H2, kiểm thử các API Endpoints thực tế ở Controller.
*   **Lệnh chạy kiểm thử backend:**
    Chạy toàn bộ các ca kiểm thử của các service từ thư mục `BE/`:
    ```bash
    ./gradlew test
    ```

### Kiểm thử Python (FastAPI)
*   **Thư viện sử dụng:** `pytest`, `pytest-asyncio`, `httpx` (để gửi request ảo tới app FastAPI).
*   **Chiến lược:** Kiểm thử tính ổn định của hàm phân tích dữ liệu gợi ý sản phẩm và khả năng kết nối tới mock Gemini API.

---

## 2. Kiểm thử Frontend (FE/)

Tầng giao diện Next.js được kiểm thử chặt chẽ thông qua Unit Test cho các hooks/components và E2E Test cho luồng mua hàng.

### Kiểm thử Unit & Component (Vitest)
*   **Công cụ:** Vitest (Trình chạy test tốc độ cao được tối ưu hóa cho React/Next.js) + React Testing Library + JSDOM.
*   **Cấu trúc thư mục:** Nằm tại `FE/test/` (ví dụ: `FE/test/components/cart-drawer.test.tsx`, `FE/test/store/useCartStore.test.ts`).
*   **Các thành phần đã có kiểm thử:**
    *   `useCartStore.test.ts`: Kiểm thử trạng thái giỏ hàng (thêm sản phẩm mới, cộng dồn số lượng khi trùng thuốc, giảm số lượng, xóa sản phẩm).
    *   `cart-drawer.test.tsx`: Render giỏ hàng, hiển thị sản phẩm, tương tác tăng/giảm số lượng và kiểm tra trường hợp giỏ hàng trống.
*   **Lệnh chạy kiểm thử đơn vị FE:**
    ```bash
    npm run test
    # hoặc
    npx vitest run
    ```

### Kiểm thử toàn trình E2E (Playwright)
*   **Công cụ:** Playwright Test.
*   **Cấu trúc thư mục:** `FE/e2e/` chứa các kịch bản kiểm thử giả lập trình duyệt của người dùng thực.
*   **Kịch bản kiểm thử trọng tâm:**
    1.  **Đăng nhập & Đăng ký:** Giả lập nhập tài khoản, mật khẩu, xác nhận lỗi định dạng và đăng nhập thành công.
    2.  **Đặt hàng và thanh toán:** Thêm sản phẩm vào giỏ, điền thông tin giao nhận, tích hợp tính phí GHN, chọn VNPay và xác nhận chuyển trang thanh toán thành công.
*   **Lệnh chạy kiểm thử E2E:**
    ```bash
    npx playwright test
    ```
