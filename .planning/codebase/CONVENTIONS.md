# Các quy ước lập trình của MedCare

## Backend (Java/Spring Boot)
- **Đặt tên (Naming):** PascalCase cho các class, camelCase cho các phương thức/biến.
- **Kiến trúc:** Kiến trúc phân lớp (Controller -> Service -> Repository).
- **Thực thể (Entities):** Sử dụng JPA kết hợp với Lombok để giảm thiểu mã lặp (boilerplate).
- **APIs:** Các endpoint RESTful với cách đặt tên nhất quán (ví dụ: `/api/v1/...`).
- **Xử lý lỗi:** Xử lý tập trung (GlobalExceptionHandler) hoặc xử lý theo từng dịch vụ.

## Frontend (TypeScript/React)
- **Đặt tên (Naming):** PascalCase cho các component, camelCase cho các hooks/utilities.
- **Styling:** Sử dụng Tailwind CSS theo phong cách utility-first.
- **Components:** Các functional components kết hợp với Hooks.
- **Trạng thái (State):** Zustand cho trạng thái toàn cục (global state), React Query cho trạng thái từ máy chủ (server state).
- **Biểu mẫu (Forms):** Các controlled components sử dụng React Hook Form và thư viện Zod để kiểm thực dữ liệu.

## Quy ước chung
- **Git:** Sử dụng mô hình feature-branching hoặc commit trực tiếp vào main (tùy thuộc vào quy mô nhóm nhỏ).
- **Bảo mật:** Xác thực dựa trên JWT được truyền qua header Authorization.
