# Các quy ước lập trình của MedCare

Để duy trì tính nhất quán trên toàn bộ hệ thống microservices đa nền tảng, đội ngũ MedCare tuân thủ các quy ước lập trình nghiêm ngặt dưới đây.

---

## 1. Quy ước REST API & Giao thức

*   **Phiên bản hóa API (API Versioning):** Tất cả các endpoint nghiệp vụ phải bắt đầu bằng tiền tố `/api/v1/` để đảm bảo tính mở rộng tương thích ngược trong tương lai.
*   **Quy tắc đặt tên Endpoint (URI Naming):**
    *   Sử dụng danh từ số nhiều (ví dụ: `/api/v1/products`, `/api/v1/orders`).
    *   Sử dụng chữ thường cách nhau bởi dấu gạch ngang (kebab-case) cho các đường dẫn con (ví dụ: `/api/v1/auth/refresh-token`).
*   **Định dạng dữ liệu trao đổi:**
    *   Sử dụng định dạng `application/json` làm chuẩn trao đổi dữ liệu chính.
    *   **Thống nhất định dạng Key trong JSON:** Sử dụng **camelCase** cho các trường khóa JSON trong tất cả các API kết nối bên ngoài và nội bộ nhằm tương thích tối đa với hệ sinh thái JavaScript của Frontend.
*   **HTTP Status Codes chuẩn:**
    *   `200 OK`: Truy vấn hoặc cập nhật thành công.
    *   `201 Created`: Tạo mới bản ghi thành công (đăng ký, tạo đơn hàng).
    *   `400 Bad Request`: Dữ liệu đầu vào không hợp lệ (xác thực form thất bại).
    *   `401 Unauthorized`: Token JWT hết hạn hoặc không hợp lệ.
    *   `403 Forbidden`: Người dùng không đủ thẩm quyền truy cập (Ví dụ: Member cố gắng gọi API của Dược sĩ/Admin).
    *   `404 Not Found`: Không tìm thấy thực thể được yêu cầu.
    *   `500 Internal Server Error`: Lỗi hệ thống backend chưa được xử lý.

---

## 2. Quy ước Backend Java (Spring Boot)

*   **Quy tắc đặt tên (Naming Conventions):**
    *   **Class/Interface:** Sử dụng PascalCase (ví dụ: `ProductService`, `OrderRepository`).
    *   **Method/Variable:** Sử dụng camelCase (ví dụ: `createOrder`, `totalPrice`).
    *   **Constants:** Sử dụng UPPER_SNAKE_CASE (ví dụ: `MAX_RETRY_COUNT`).
*   **Kiến trúc Phân lớp tiêu chuẩn:**
    *   `Controller`: Chỉ tiếp nhận request, validate dữ liệu đầu vào cơ bản (`@Valid`), và điều phối response. Không chứa logic nghiệp vụ.
    *   `Service` / `ServiceImpl`: Chứa logic xử lý nghiệp vụ, quản lý Transactions (`@Transactional`).
    *   `Repository`: Interface mở rộng từ `JpaRepository` thực hiện các truy vấn dữ liệu.
*   **Quản lý Thực thể (Entities):**
    *   Sử dụng Lombok `@Data`, `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor` để giảm thiểu code sinh tự động.
    *   Luôn định nghĩa rõ ràng kiểu dữ liệu của các cột cơ sở dữ liệu (`columnDefinition`, `nullable`, `length`).

---

## 3. Quy ước Backend Python (FastAPI)

*   **Tuân thủ PEP 8:**
    *   Sử dụng snake_case cho các hàm và tên biến (ví dụ: `get_related_recommendation`, `user_id`).
    *   Sử dụng PascalCase cho các lớp (ví dụ: `RecommendationService`, `ChatLog`).
*   **Xác thực dữ liệu (Pydantic):**
    *   Sử dụng các Pydantic Schemas (`BaseModel`) để khai báo kiểu dữ liệu đầu vào và đầu ra của các router.
    *   Tận dụng kiểu gõ tĩnh (Type Hinting) tối đa giúp sinh tài liệu Swagger chính xác.

---

## 4. Quy ước Frontend (Next.js / TypeScript)

*   **Quy tắc đặt tên tệp tin:**
    *   Thư mục trang trong `app/` sử dụng chữ thường cách nhau bởi dấu gạch ngang (kebab-case). Ví dụ: `tai-khoan`, `thanh-toan`.
    *   Component React sử dụng PascalCase. Ví dụ: `CartDrawer.tsx`, `AiChatbot.tsx`.
*   **Quy tắc viết React Components:**
    *   Sử dụng Functional Components kết hợp với Hooks thay vì Class Components.
    *   Tách biệt các State cục bộ sử dụng `useState` và các State toàn cục sử dụng `Zustand`.
    *   Kiểm soát việc tải dữ liệu server sử dụng React Query (`useQuery`, `useMutation`).
*   **Type Safety:**
    *   Không được phép sử dụng kiểu `any` trừ trường hợp ngoại lệ cực kỳ đặc biệt.
    *   Khai báo rõ ràng interface/type cho các props của components và các đối tượng dữ liệu API nhận được.
