---
slug: fix-missing-redis-promotion
status: complete
---

# Summary - Fix Missing Redis Dependency in Promotion Service

Fixed compilation error in `promotion-service` related to missing Redis classes.

## Accomplishments
- Added `spring-boot-starter-data-redis` to `promotion-service/build.gradle`.
- Verified that `PromotionService.java` can now import `StringRedisTemplate`.

## Status
Complete ✓
