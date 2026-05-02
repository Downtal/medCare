# Công nghệ sử dụng trong MedCare (Tech Stack)

## Backend (BE)
- **Framework Chính:** Spring Boot 3.4.x
- **Ngôn ngữ:** Java 21+
- **AI Service:** Python 3.12+, FastAPI, LangChain
- **Điều phối Microservices:** Spring Cloud Netflix Eureka (Discovery Server)
- **API Gateway:** Spring Cloud Gateway
- **Giao tiếp giữa các dịch vụ:** Spring Cloud OpenFeign (Java) & HTTPX (Python)
- **Bảo mật:** Spring Security, JWT (JSON Web Tokens)
- **Lưu trữ dữ liệu (Persistence):** Spring Data JPA, Hibernate, SQLAlchemy (Python)
- **Cơ sở dữ liệu:** MySQL
- **Bộ nhớ đệm (Caching):** Redis Cloud
- **Messaging/Events:** Custom REST-based events qua OpenFeign
- **Công cụ Build:** Gradle (Java), pip/venv (Python)

## Frontend (FE)
- **Framework:** Next.js 15.5.x (App Router)
- **Ngôn ngữ:** TypeScript, React 18.3.1
- **Styling:** Tailwind CSS 4.0
- **Thành phần UI (UI Components):** Shadcn UI (Radix UI)
- **Hiệu ứng (Animations):** Framer Motion
- **Xác thực (Auth):** NextAuth.js 5.0 (Auth.js)
- **Quản lý trạng thái (State Management):** Zustand, TanStack Query (React Query)
- **AI/OCR:** Tesseract.js (Client-side OCR), Gemini API (via AI Service)
- **Icons:** Lucide React

## Cơ sở hạ tầng & Công cụ
- **Quản lý môi trường:** `.env` (FE/BE), `application.yml` (Java), `.env.local` (FE)
- **Lưu trữ đa phương tiện:** Cloudinary
- **Dịch vụ bên thứ ba:** GHN (Giao Hàng Nhanh) cho vận chuyển, VNPay cho thanh toán, Google Gemini AI.
- **IDE:** IntelliJ IDEA / VS Code
- **Testing:** JUnit 5 (BE), Vitest (FE), Playwright (E2E)
