---
slug: fix-fetch-provinces-error
status: complete
---

# Summary - Fix "Failed to fetch provinces" Error in Frontend

Resolved the issue where the checkout page failed to load address master data (provinces, districts, wards).

## Accomplishments
- **Frontend Config**: Added missing `SHIPPING` and `INVENTORY` endpoint definitions to `FE/lib/config.ts`.
- **Frontend Logic**: Corrected the API paths in `FE/app/thanh-toan/page.tsx` to include the `/shipping` resource name, matching the backend controller.
- **Backend Security**: Updated `shipping-service` security configuration to allow public access to master data endpoints (`/provinces`, `/districts`, `/wards`, `/fee`), as they are used during checkout before a user might be fully authenticated or require session-less address selection.

## Status
Complete ✓
