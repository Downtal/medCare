---
slug: fix-port-conflict-promotion-payment
status: complete
---

# Summary - Fix Port Conflict between Promotion and Payment Services

Fixed "Port already in use" error during microservice startup.

## Accomplishments
- Identified that both `payment-service` and `promotion-service` were configured to use port `8087`.
- Changed `promotion-service` port to `8089` to resolve the conflict.
- Discovered and fixed a missing route for `payment-service` in the `api-gateway` configuration.

## Status
Complete ✓
