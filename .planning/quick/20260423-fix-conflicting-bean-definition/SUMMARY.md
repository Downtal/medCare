---
slug: fix-conflicting-bean-definition
status: complete
---

# Summary - Fix Conflicting Bean Definition in Shipping Service

Fixed `ConflictingBeanDefinitionException` caused by duplicate `ShippingController` classes in different packages.

## Accomplishments
- Identified two `ShippingController` classes: one in `controller` and one in `controllers`.
- Merged the functionality of both (Order creation/tracking + GHN Location/Fee services) into a single standard `ShippingController`.
- Standardized package naming by moving `GHNService` to the singular `service` package.
- Deleted redundant `controllers` and `services` (plural) packages to prevent future conflicts.

## Status
Complete ✓
