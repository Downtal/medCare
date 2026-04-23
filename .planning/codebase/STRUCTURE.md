# Cấu trúc thư mục của MedCare

## Thư mục gốc (Root)
- `BE/`: Các microservices của Backend (Dự án đa module Gradle).
- `FE/`: Ứng dụng Frontend Next.js.
- `DB/`: Các script khởi tạo và di cư (migration) cơ sở dữ liệu.
- `Data_test/`: Dữ liệu mẫu để kiểm thử (chủ yếu liên quan đến sản phẩm).
- `.planning/`: Các artifact của quy trình GSD và sơ đồ codebase.

## Backend (BE/)
- `api-gateway/`: Dịch vụ Gateway.
- `auth-service/`: Quản lý danh tính và quyền truy cập (IAM).
- `discovery-server/`: Bộ đăng ký Eureka.
- `common-lib/`: Các tiện ích và DTO dùng chung (nếu có).
- `product-service/`, `order-service/`, v.v.: Các microservices theo nghiệp vụ cụ thể.
  - `src/main/java/.../controller/`: Các endpoint REST.
  - `src/main/java/.../service/`: Logic nghiệp vụ.
  - `src/main/java/.../entity/`: Các thực thể JPA.
  - `src/main/java/.../repository/`: Truy cập dữ liệu.

## Frontend (FE/)
- `app/`: Các trang và layout của Next.js (App Router).
- `components/`: Các thành phần UI có thể tái sử dụng (Shadcn/UI).
- `services/`: Các hàm gọi API (API client).
- `hooks/`: Các React hooks tùy chỉnh.
- `lib/`: Các hàm tiện ích và cấu hình dùng chung.
- `types/`: Các interface và kiểu dữ liệu TypeScript.
