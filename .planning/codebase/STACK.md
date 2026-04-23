# Công nghệ sử dụng trong MedCare (Tech Stack)

## Backend (BE)
- **Framework:** Spring Boot 3.4.x
- **Ngôn ngữ:** Java 21+
- **Điều phối Microservices:** Spring Cloud Netflix Eureka (Discovery Server)
- **API Gateway:** Spring Cloud Gateway
- **Giao tiếp giữa các dịch vụ:** Spring Cloud OpenFeign (Dựa trên REST)
- **Bảo mật:** Spring Security, JWT (JSON Web Tokens)
- **Lưu trữ dữ liệu (Persistence):** Spring Data JPA, Hibernate
- **Cơ sở dữ liệu:** MySQL
- **Bộ nhớ đệm (Caching):** Redis Cloud
- **Messaging/Events:** Các "events" tùy chỉnh dựa trên REST thông qua OpenFeign
- **Công cụ Build:** Gradle

## Frontend (FE)
- **Framework:** Next.js 16 (App Router)
- **Ngôn ngữ:** TypeScript, React 19
- **Styling:** Tailwind CSS 4.0
- **Thành phần UI (UI Components):** Shadcn UI (Radix UI)
- **Hiệu ứng (Animations):** Framer Motion
- **Xác thực (Auth):** NextAuth.js 5.0 (Auth.js)
- **Quản lý trạng thái (State Management):** Zustand
- **Icons:** Lucide React

## Cơ sở hạ tầng & Công cụ
- **Quản lý môi trường:** `.env` và `application.yml`
- **Lưu trữ đa phương tiện:** Cloudinary
- **Dịch vụ bên thứ ba:** GHN (Giao Hàng Nhanh) cho vận chuyển, VNPay cho thanh toán.
- **IDE:** IntelliJ IDEA / VS Code (dựa trên thư mục `.idea` và `.vscode`)
- **Tài liệu API:** Không tìm thấy cụ thể (ví dụ: Swagger/OpenAPI)
