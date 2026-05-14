# Cart Redis Audit Script

Script: `BE/order-service/scripts/audit_cart_redis.py`

## Purpose

Audit `cart:*` keys in Redis before and after deploying cart serialization hardening.

The script reports:
- total cart keys
- total hash entries
- failed entries (cannot parse payload as expected)
- sample failed records (`cart_key`, `hash_key`, reason, payload snippet)

## Prerequisites

- Python 3.10+
- Redis client package:

```bash
pip install redis
```

## Usage

Run from repo root:

```bash
python BE/order-service/scripts/audit_cart_redis.py --host localhost --port 6379 --db 0
```

Using environment variables:

```bash
set REDIS_HOST=localhost
set REDIS_PORT=6379
set REDIS_PASSWORD=your_password
python BE/order-service/scripts/audit_cart_redis.py
```

With SSL and sample control:

```bash
python BE/order-service/scripts/audit_cart_redis.py --ssl --sample-limit 50
```

## Recommended rollout flow

1. **Pre-migration audit**
   - Run script on current production/staging Redis.
   - Save output as baseline.
2. **Deploy serialization hardening**
   - Release cart template isolation + fallback/rewrite logic.
3. **Post-migration audit**
   - Run script again on same environment.
   - Compare `failed_entries`, `parse_success_rate`, and failed sample distribution.
4. **Decision gate**
   - If failed entries decrease and no critical user carts fail: proceed.
   - If failed entries spike: pause rollout and inspect sample keys.
