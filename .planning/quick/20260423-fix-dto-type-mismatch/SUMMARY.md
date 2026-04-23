---
slug: fix-dto-type-mismatch
status: complete
---

# Summary - Fix DTO Type Mismatch in Order Service

Fixed compilation error in `OrderDetailResponse` where an enum was being assigned to a String field.

## Accomplishments
- Updated `OrderDetailResponse.fromEntity` to convert `PaymentMethod` enum to `String` using `.name()`.
- Added null safety check for the payment method.

## Status
Complete ✓
