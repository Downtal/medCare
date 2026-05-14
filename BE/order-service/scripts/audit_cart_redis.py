#!/usr/bin/env python3
"""
Audit Redis cart data before/after serialization migration.

Scans keys with prefix `cart:*`, counts hash entries, and attempts to parse
each value into JSON-ish payload. Reports failures with sample keys/hash fields.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import List, Optional

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None


@dataclass
class FailedEntry:
    cart_key: str
    hash_key: str
    reason: str
    sample: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit cart:* Redis hash data and report parse compatibility."
    )
    parser.add_argument("--host", default=os.getenv("REDIS_HOST", "localhost"))
    parser.add_argument("--port", type=int, default=int(os.getenv("REDIS_PORT", "6379")))
    parser.add_argument("--db", type=int, default=0)
    parser.add_argument("--password", default=os.getenv("REDIS_PASSWORD"))
    parser.add_argument("--ssl", action="store_true", default=False)
    parser.add_argument(
        "--sample-limit",
        type=int,
        default=20,
        help="Maximum number of failed samples to print.",
    )
    parser.add_argument(
        "--scan-count",
        type=int,
        default=200,
        help="Redis SCAN count hint per iteration.",
    )
    return parser.parse_args()


def decode_bytes(raw: bytes) -> Optional[str]:
    try:
        return raw.decode("utf-8")
    except Exception:
        return None


def parse_payload(raw_value: bytes) -> Optional[str]:
    """
    Returns None if payload is parseable enough, otherwise reason string.
    We accept both:
    - JSON object/array
    - non-JSON binary values that can still be decoded and contain cart fields
    """
    text = decode_bytes(raw_value)
    if text is None:
        return "non-utf8-bytes"

    # Fast path for JSON payload
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return None
        if isinstance(parsed, list):
            return None
        return "json-scalar"
    except Exception:
        # Fallback heuristic for serializer payloads containing common cart fields
        if "medicineId" in text or "quantity" in text or "unitPrice" in text:
            return None
        return "not-json-and-no-cart-markers"


def connect_client(args: argparse.Namespace):
    if redis is None:
        print(
            "ERROR: Missing dependency 'redis'. Install with: pip install redis",
            file=sys.stderr,
        )
        sys.exit(2)

    try:
        client = redis.Redis(
            host=args.host,
            port=args.port,
            db=args.db,
            password=args.password,
            ssl=args.ssl,
            decode_responses=False,
            socket_timeout=5,
        )
        client.ping()
        return client
    except Exception as exc:
        print(f"ERROR: Redis connection failed: {exc}", file=sys.stderr)
        sys.exit(2)


def main() -> int:
    args = parse_args()
    client = connect_client(args)

    total_keys = 0
    total_entries = 0
    failed_entries = 0
    samples: List[FailedEntry] = []

    cursor = 0
    while True:
        cursor, keys = client.scan(cursor=cursor, match="cart:*", count=args.scan_count)
        for key_raw in keys:
            cart_key = (
                key_raw.decode("utf-8", errors="replace")
                if isinstance(key_raw, (bytes, bytearray))
                else str(key_raw)
            )
            total_keys += 1
            try:
                hash_items = client.hgetall(key_raw)
            except Exception as exc:
                failed_entries += 1
                if len(samples) < args.sample_limit:
                    samples.append(
                        FailedEntry(
                            cart_key=cart_key,
                            hash_key="<hgetall>",
                            reason=f"hgetall-error:{type(exc).__name__}",
                            sample=str(exc)[:120],
                        )
                    )
                continue

            for hash_key_raw, value_raw in hash_items.items():
                total_entries += 1
                hash_key = (
                    hash_key_raw.decode("utf-8", errors="replace")
                    if isinstance(hash_key_raw, (bytes, bytearray))
                    else str(hash_key_raw)
                )
                if not isinstance(value_raw, (bytes, bytearray)):
                    continue
                reason = parse_payload(value_raw)
                if reason is not None:
                    failed_entries += 1
                    if len(samples) < args.sample_limit:
                        snippet = decode_bytes(value_raw)
                        if snippet is None:
                            snippet = "<binary>"
                        samples.append(
                            FailedEntry(
                                cart_key=cart_key,
                                hash_key=hash_key,
                                reason=reason,
                                sample=snippet[:120].replace("\n", "\\n"),
                            )
                        )

        if cursor == 0:
            break

    print("=== Cart Redis Audit Summary ===")
    print(f"host={args.host}:{args.port} db={args.db} ssl={args.ssl}")
    print(f"cart_keys={total_keys}")
    print(f"hash_entries={total_entries}")
    print(f"failed_entries={failed_entries}")
    print(f"parse_success_rate={(0 if total_entries == 0 else (total_entries - failed_entries) * 100.0 / total_entries):.2f}%")

    if samples:
        print("\n=== Failed Samples ===")
        for idx, item in enumerate(samples, start=1):
            print(
                f"{idx}. cart_key={item.cart_key} hash_key={item.hash_key} "
                f"reason={item.reason} sample={item.sample}"
            )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
