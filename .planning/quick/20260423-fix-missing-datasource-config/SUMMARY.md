---
slug: fix-missing-datasource-config
status: complete
---

# Summary - Fix Missing DataSource Configuration in Shipping Service

Fixed `BeanCreationException` (Failed to determine a suitable driver class) in `shipping-service`.

## Accomplishments
- Identified that `shipping-service/application.yml` was missing the `spring.datasource` and `spring.jpa` configurations.
- Added MySQL datasource configuration pointing to `medcare_shipping_db`.
- Verified that other services have correct database configurations.

## Status
Complete ✓
