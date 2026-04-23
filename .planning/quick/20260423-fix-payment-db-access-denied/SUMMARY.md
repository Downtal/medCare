---
slug: fix-payment-db-access-denied
status: complete
---

# Summary - Fix Payment Database Access Denied

Fixed `java.sql.SQLException: Access denied for user 'root'@'localhost'` in `payment-service`.

## Accomplishments
- Identified that `payment-service` was using a default password `admin` for MySQL, which caused connection failure on the local environment.
- Updated `payment-service/application.yml` to use an empty default password, matching the configuration of other microservices.

## Status
Complete ✓
