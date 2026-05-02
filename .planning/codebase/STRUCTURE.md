# Cấu trúc thư mục của MedCare

## Thư mục gốc (Root)
- `BE/`: Backend Microservices.
- `FE/`: Frontend Next.js (TypeScript).
- `DB/`: Database scripts.
- `Data_test/`: Dữ liệu kiểm thử.
- `.planning/`: Tài liệu dự án và lộ trình phát triển.

## Backend (BE/)
- **Dịch vụ Java:**
  - `auth-service/`, `product-service/`, v.v. (Cấu trúc Spring Boot chuẩn).
  - `common-lib/`: Module chứa các class dùng chung cho Java services.
- **Dịch vụ Python:**
  - `ai-service/`:
    - `app/`: Source code FastAPI (routers, services, core).
    - `requirements.txt`: Dependencies.
    - `venv/`: Virtual environment.

## Frontend (FE/)
- `app/`: Next.js App Router (Pages, Layouts, API routes).
- `components/`: UI Components (Shadcn UI).
- `services/`: API Clients mapped to Microservices.
- `hooks/`: Custom React hooks.
- `lib/`: Utilities (VNPay logic, Cloudinary config).
- `types/`: TypeScript definitions.
- `e2e/`: Playwright test scripts.
