# Công nghệ sử dụng trong MedCare (Tech Stack)

Hệ thống MedCare được xây dựng dựa trên kiến trúc Microservices phân tán với sự kết hợp đa ngôn ngữ (Polyglot), tối ưu hóa thế mạnh của từng công nghệ trong việc xử lý nghiệp vụ y tế và AI.

## 1. Backend Architecture (BE)

### Dịch vụ Nghiệp vụ chính (Java/Spring Boot)
*   **Ngôn ngữ lập trình:** Java 21 LTS (sử dụng các tính năng mới như Record, Pattern Matching, Pattern matching for switch, Virtual Threads).
*   **Framework chính:** Spring Boot 3.4.4.
*   **Quản lý dependencies và build tool:** Gradle.
*   **Quản lý cấu hình & Điều phối dịch vụ:**
    *   **Spring Cloud Netflix Eureka Server:** Discovery Service phục vụ đăng ký và phát hiện dịch vụ tự động.
    *   **Spring Cloud Gateway:** API Gateway trung tâm định tuyến, lọc request và phân quyền JWT.
    *   **Spring Cloud OpenFeign:** Hỗ trợ giao tiếp đồng bộ giữa các microservices Java dạng khai báo client (Declarative REST Client).
*   **Bảo mật:** Spring Security 6.x & JSON Web Tokens (JWT) với cơ chế tự động xoay vòng refresh token.
*   **Persistence & ORM:** Spring Data JPA + Hibernate.
*   **Các thư viện quan trọng khác:**
    *   `dotenv-java` (Quản lý biến môi trường).
    *   `Lombok` (Giảm thiểu boilerplate code).
    *   `Jackson` (Xử lý Serialization/Deserialization JSON).

### Dịch vụ AI & Recommendations (Python/FastAPI)
*   **Ngôn ngữ lập trình:** Python 3.12+
*   **Framework chính:** FastAPI (hiệu năng cao, tự động sinh tài liệu Swagger/OpenAPI, tích hợp Async/Await).
*   **Thư viện AI:** 
    *   **Google GenAI SDK / LangChain:** Tương tác với mô hình ngôn ngữ lớn (LLM) Google Gemini 1.5 Pro / Flash.
    *   **py-eureka-client:** Đăng ký dịch vụ FastAPI vào hệ sinh thái Spring Cloud Eureka.
    *   **SQLAlchemy / Pydantic:** ORM kết nối cơ sở dữ liệu và xác thực cấu trúc dữ liệu đầu vào/đầu ra.
    *   **HTTPX:** Client thực hiện các truy vấn HTTP không đồng bộ (Async HTTP Client) kết nối với các microservices Java.
    *   **slowapi:** Rate limiting cho các endpoint chatbot và OCR để tránh spam.

## 2. Frontend Architecture (FE)

*   **Framework chính:** Next.js 15.5.15 (sử dụng mô hình App Router mới nhất, kết hợp tối ưu giữa Server Components và Client Components).
*   **Thư viện UI chính:** React 18.3.1.
*   **Ngôn ngữ:** TypeScript (Type-safe tuyệt đối).
*   **Styling:** Tailwind CSS 4.1.9 (với trình biên dịch mới, tối ưu hóa CSS bundle) + `tailwindcss-animate`.
*   **Thành phần giao diện (Component Library):** Shadcn UI (xây dựng trên nền tảng Radix UI cội nguồn như Accordion, Dialog, Dropdown Menu, Popover, Select, Sheet, Tabs, Tooltip).
*   **Quản lý trạng thái (State Management):**
    *   **Zustand (phiên bản 5.0.12):** Quản lý State toàn cục phía Client (Giỏ hàng, trạng thái đăng nhập, trạng thái chat).
    *   **TanStack Query / React Query (phiên bản 5.96.2):** Quản lý bộ đệm trạng thái server (caching, synchronization).
*   **Xác thực người dùng:** NextAuth.js 5.0 Beta (Auth.js) tích hợp credentials login với backend JWT.
*   **Hiệu ứng & Chuyển động:** Framer Motion (phiên bản 12.38.0) cho các chuyển cảnh mượt mà và micro-animations.
*   **AI / OCR phía Client:** Tesseract.js (phiên bản 7.0.0) dùng để xử lý và nhận diện văn bản từ hình ảnh đơn thuốc ngay tại client trước khi gửi phân tích chuyên sâu.
*   **Các thư viện quan trọng khác:**
    *   `axios` (HTTP Client).
    *   `react-hook-form` + `zod` (Quản lý form và validate dữ liệu).
    *   `sonner` (Hiển thị toast notifications cao cấp).
    *   `lucide-react` (Bộ icon vector đồng bộ).
    *   `recharts` (Vẽ biểu đồ thống kê doanh thu/đơn hàng cho Admin).

## 3. Cơ sở dữ liệu & Caching (Database & Cache)

*   **Hệ quản trị CSDL:** MySQL 8.x (Mỗi microservice sở hữu một schema riêng biệt để đảm bảo tính độc lập dữ liệu tối đa).
*   **Caching & Session Storage:** Redis Cloud / Redis Local (caching giỏ hàng, danh sách đen token JWT hết hạn, và lưu lịch sử chatbot tạm thời).

## 4. Công cụ & Kiểm thử (Infrastructure & Tooling)

*   **Biến môi trường:** `.env` tập trung, `application.yml` cho Java, `.env.local` cho Next.js.
*   **Lưu trữ đám mây:** Cloudinary (lưu ảnh thuốc, ảnh đơn thuốc người dùng tải lên).
*   **Tích hợp bên thứ ba:**
    *   **GHN (Giao Hàng Nhanh):** API lấy danh mục Tỉnh/Huyện/Xã và tính phí vận chuyển theo thời gian thực.
    *   **VNPay:** Cổng thanh toán trực tuyến của ngân hàng Việt Nam.
*   **Công cụ kiểm thử:**
    *   **Backend:** JUnit 5, Mockito.
    *   **Frontend:** Vitest (Unit test), Playwright (E2E testing).
