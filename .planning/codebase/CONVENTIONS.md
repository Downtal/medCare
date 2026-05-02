# Các quy ước lập trình của MedCare

## Backend Java (Spring Boot)
- **Naming:** PascalCase (Class), camelCase (Method/Variable).
- **Architecture:** Controller -> Service -> Repository.
- **Persistence:** JPA + Lombok.
- **REST:** JSON, PascalCase hoặc snake_case tùy theo module (khuyến nghị thống nhất snake_case cho JSON).

## Backend Python (FastAPI)
- **Naming:** snake_case cho hàm và biến, PascalCase cho Class (PEP 8).
- **Type Hinting:** Sử dụng Pydantic cho validation và documentation.
- **Structure:** Router-based organization.

## Frontend (Next.js/React)
- **Naming:** PascalCase (Component), camelCase (Hook/Util).
- **Logic:** Functional Components + Hooks.
- **State:** Zustand (Global), TanStack Query (Server).
- **Forms:** React Hook Form + Zod.

## Quy ước chung
- **API Versioning:** `/api/v1/...`
- **Security:** JWT Header `Authorization: Bearer <token>`.
- **Git:** Feature branches, commit messages rõ ràng.
