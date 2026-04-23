# Tổng kết Dự án MedCare

Chào bạn! Dưới đây là tóm tắt chi tiết về những gì chúng ta đã thực hiện và các công nghệ cốt lõi đang được áp dụng trong project **MedCare** (hệ thống thương mại điện tử dược phẩm microservices).

---

## 1. Công nghệ Backend (BE)
Hệ thống Backend được xây dựng theo kiến trúc **Microservices** hiện đại, sử dụng hệ sinh thái Spring Boot.

| Công nghệ | Mục đích | Vị trí áp dụng trong Code |
| :--- | :--- | :--- |
| **Spring Boot 3.4 / Java 21+** | Framework chính cho các dịch vụ. | Toàn bộ các thư mục trong `BE/` |
| **Spring Cloud Netflix Eureka** | Service Discovery - Giúp các microservice tìm thấy nhau. | `BE/discovery-server` |
| **Spring Cloud Gateway** | API Gateway - Điều hướng request, bảo mật tập trung. | `BE/api-gateway` |
| **Spring Security & JWT** | Xác thực và phân quyền dựa trên Token. | `BE/auth-service`, `auth-service/src/main/java/com/medcare/authservice/config/JwtService.java` |
| **Spring Data JPA / Hibernate** | Quản lý dữ liệu và tương tác với Database. | Các file Repository trong `user-service`, `product-service`, `order-service` |
| **MySQL** | Cơ sở dữ liệu quan hệ chính. | Cấu hình trong `application.yml` của mỗi service (cổng 3306) |
| **Redis Cloud** | Caching phân tán - Tăng tốc độ truy vấn (Menu, danh mục). | `BE/product-service/src/main/resources/application.yml` và các logic `@Cacheable` |
| **Spring Mail (SMTP)** | Gửi email xác nhận, thông báo. | `BE/auth-service` (cấu hình Google SMTP) |
| **Gradle** | Công cụ build và quản lý thư viện (Multi-project). | `BE/build.gradle`, `BE/settings.gradle` |

---

## 2. Công nghệ Frontend (FE)
Frontend được xây dựng với mục tiêu hiệu năng cao (SEO-friendly) và giao diện cao cấp (Premium UI).

| Công nghệ | Mục đích | Vị trí áp dụng trong Code |
| :--- | :--- | :--- |
| **Next.js 16 (App Router)** | React Framework mạnh mẽ nhất hiện nay. | Toàn bộ thư mục `FE/` (Cấu trúc `app/`) |
| **React 19** | Thư viện giao diện người dùng mới nhất. | `FE/package.json` |
| **Tailwind CSS 4.0** | Styling cực nhanh, linh hoạt và hiện đại. | `FE/tailwind.config.mjs`, `FE/app/globals.css` |
| **NextAuth.js 5.0 (Auth.js)** | Quản lý phiên đăng nhập và bảo mật Client-side. | `FE/auth.ts`, `FE/middleware.ts` |
| **Shadcn UI (Radix UI)** | Bộ thành phần giao diện (UI Components) chất lượng cao. | `FE/components/ui/` (Accordion, Dialog, Dropdown,...) |
| **Framer Motion** | Tạo các hiệu ứng chuyển động mượt mà (Micro-animations). | Các component như `header.tsx`, `product-card.tsx` |
| **Zustand** | Quản lý State toàn cục (Giỏ hàng, trạng thái user). | `FE/hooks/use-cart.ts` (Dự kiến/Đã áp dụng) |
| **DOMPurify** | Làm sạch HTML để chống tấn công XSS khi render. | `FE/app/products/[id]/page.tsx` (dùng cho `medicine_details`) |
| **Lucide React** | Bộ icon vector hiện đại. | Toàn bộ các component giao diện. |

---

## 3. Những việc quan trọng đã hoàn thành

1.  **Thiết lập Microservices**: Kết nối thành công các service thông qua Eureka và Gateway.
2.  **Hệ thống Authentication**: Hoàn thiện luồng Đăng ký/Đăng nhập với JWT và tích hợp NextAuth ở FE.
3.  **Quản lý Sản phẩm**: Xây dựng Product Service với phân loại danh mục, hỗ trợ render HTML an toàn cho chi tiết thuốc.
4.  **Tối ưu hiệu năng**: Triển khai **Redis Caching** cho Menu và Category tree để giảm tải cho database.
5.  **Giao diện người dùng**:
    *   Thiết kế Header thông minh với dropdown tài khoản.
    *   Trang chi tiết sản phẩm chuyên nghiệp.
    *   Sidebar điều hướng linh hoạt cho trang cá nhân.
6.  **Migrate Cloud**: Đã chuẩn bị sẵn sàng cấu hình để triển khai Redis lên Cloud (Redis Cloud).

---

## 4. Cấu trúc Thư mục chính

- `BE/`: Chứa mã nguồn các dịch vụ Java Spring Boot.
- `FE/`: Chứa mã nguồn dự án Next.js (TypeScript).
- `DB/`: Chứa các file script SQL khởi tạo dữ liệu (`medcare_init.sql`).
- `common-lib`: Thư viện dùng chung cho các service BE (DTO, Exception handler).

> [!TIP]
> Hệ thống hiện tại đang sử dụng những phiên bản công nghệ rất mới (Next.js 16, React 19, Spring Boot 3.4), giúp dự án có khả năng mở rộng tốt và hiệu năng tối ưu trong tương lai.
