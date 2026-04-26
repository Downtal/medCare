# Project State

## Project Reference

See: [.planning/PROJECT.md](file:///v:/TieuLuanTN\MedCare/.planning/PROJECT.md) (updated 2026-04-26)

## Quick Tasks

| Task ID | Date | Description |
| :--- | :--- | :--- |
| fix-auth-service-dependency | 2026-04-26 | Thêm missing dependency common-lib vào auth-service build.gradle. |
| fix-bom-encoding-issue | 2026-04-26 | Loại bỏ UTF-8 BOM khỏi các file java trong product-service gây lỗi biên dịch. |
| fix-missing-consult-image | 2026-04-26 | Tạo ảnh AI mới và thay thế link Cloudinary 404 cho phần tư vấn dược sĩ. |

**Core value:** Nâng tầm trải nghiệm người dùng MedCare với hệ thống tư vấn thông minh Chatbot AI.
**Current status:** Milestone 3 In Progress — Phase 11 Started.

## Milestone 1: Core Flow Integration [COMPLETED]

### Status
- [x] Phase 1-6 (Completed 2026-04-22)

## Milestone 2: Kiểm thử Toàn diện [COMPLETED]

### Status
- [x] Phase 7: Unit Testing — Backend (Completed 2026-04-23)
- [x] Phase 8: Integration Testing — REST Endpoints (Completed 2026-04-23)
- [x] Phase 9: Frontend Testing — Vitest (Completed 2026-04-23)
- [x] Phase 10: E2E Testing — Playwright (Completed 2026-04-23)

## Milestone 3: Hệ thống Chatbot AI Tư vấn [IN PROGRESS]

### Status
- [ ] Phase 11: AI Service Foundation (Todo)
- [ ] Phase 12: Prompt Engineering & Mapping Logic (Todo)
- [ ] Phase 13: UI Chatbot & Frontend Integration (Todo)
- [ ] Phase 14: Safety & Optimization (Todo)

### Next Action
Bắt đầu **Phase 11**: Khởi tạo dịch vụ `ai-service` và cấu hình kết nối LLM.

---
*Last updated: 2026-04-26*
