---
slug: fix-missing-redis-dependency
status: complete
---

# Summary - Fix Missing Redis Dependency in Order Service

Fixed compilation error in `order-service` related to missing Redis classes.

## Accomplishments
- Added `spring-boot-starter-data-redis` to `order-service/build.gradle`.
- Verified that `CartService.java` can now import `RedisTemplate`.

## Status
Complete ✓
