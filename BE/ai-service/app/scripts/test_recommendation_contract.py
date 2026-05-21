import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from fastapi.testclient import TestClient

from app.main import app
from app.services.recommendation_service import recommendation_service


class CaptureHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self.messages: List[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.messages.append(record.getMessage())


def _assert_runtime_metadata_contract(metadata: Dict, *, endpoint: str) -> None:
    required_keys = {"degraded", "degradedReasons", "source", "fallback", "limit", "cacheTtlSeconds", "cacheHit", "generatedAt"}
    missing = required_keys.difference(metadata.keys())
    assert not missing, f"{endpoint} metadata missing keys: {sorted(missing)}"
    assert isinstance(metadata.get("degraded"), bool)
    assert isinstance(metadata.get("degradedReasons"), list)
    assert isinstance(metadata.get("source"), str)
    assert isinstance(metadata.get("fallback"), bool)
    assert isinstance(metadata.get("cacheHit"), bool)


def _test_home_route_contract_and_identity_policy() -> None:
    original_get_home = recommendation_service.get_home_recommendation
    captured_calls: List[Dict[str, Optional[int]]] = []

    async def fake_get_home_recommendation(user_id, limit):
        captured_calls.append({"user_id": user_id, "limit": limit})
        return {
            "items": [{"id": 77, "name": "Contract Item", "status": True}],
            "metadata": {
                "degraded": False,
                "degradedReasons": [],
                "source": "personalized",
                "fallback": False,
                "identityType": "authenticated" if user_id is not None else "anonymous",
                "limit": limit,
                "cacheTtlSeconds": 90,
                "cacheHit": False,
                "generatedAt": "2026-05-15T00:00:00+00:00",
            },
        }

    recommendation_service.get_home_recommendation = fake_get_home_recommendation

    try:
        with TestClient(app) as client:
            canonical = client.get("/api/recommendations/home?limit=1", headers={"X-User-Id": "11"})
            alias = client.get("/api/ai/recommendations?limit=1", headers={"X-User-Id": "11"})
            invalid_identity = client.get("/api/recommendations/home?limit=2", headers={"X-User-Id": "abc"})

            assert canonical.status_code == 200
            assert alias.status_code == 200
            assert invalid_identity.status_code == 200

            canonical_json = canonical.json()
            alias_json = alias.json()
            invalid_identity_json = invalid_identity.json()

            assert isinstance(canonical_json, dict)
            assert "items" in canonical_json
            assert "metadata" in canonical_json
            _assert_runtime_metadata_contract(canonical_json["metadata"], endpoint="home")
            assert canonical_json["metadata"]["identityType"] in {"authenticated", "anonymous"}
            assert isinstance(canonical_json["items"], list)
            assert isinstance(alias_json, list)
            assert alias_json == canonical_json["items"], "Alias route must preserve legacy Product[] shape"

            assert invalid_identity_json["metadata"]["identityType"] == "anonymous"
            assert captured_calls[0]["user_id"] == 11
            assert captured_calls[1]["user_id"] == 11
            assert captured_calls[2]["user_id"] is None
    finally:
        recommendation_service.get_home_recommendation = original_get_home


def _test_related_route_contract_and_seed_policy() -> None:
    original_get_related = recommendation_service.get_related_recommendation
    captured_calls: List[Dict[str, int]] = []

    async def fake_get_related_recommendation(product_id: int, limit: int):
        captured_calls.append({"product_id": product_id, "limit": limit})
        return {
            "items": [{"id": 99, "name": "Related Item", "status": True}],
            "metadata": {
                "degraded": False,
                "degradedReasons": [],
                "source": "related",
                "fallback": False,
                "seedProductId": product_id,
                "limit": limit,
                "cacheTtlSeconds": 90,
                "cacheHit": False,
                "generatedAt": "2026-05-15T00:00:00+00:00",
            },
        }

    recommendation_service.get_related_recommendation = fake_get_related_recommendation

    try:
        with TestClient(app) as client:
            canonical = client.get("/api/recommendations/related?productId=10&limit=2")
            alias = client.get("/api/ai/recommendations/related?productId=10&limit=2")
            missing_seed = client.get("/api/recommendations/related?limit=2")
            invalid_seed = client.get("/api/recommendations/related?productId=abc&limit=2")
            negative_seed = client.get("/api/recommendations/related?productId=-1&limit=2")

            assert canonical.status_code == 200
            assert alias.status_code == 200
            assert missing_seed.status_code == 400
            assert invalid_seed.status_code == 400
            assert negative_seed.status_code == 400

            canonical_json = canonical.json()
            alias_json = alias.json()
            assert isinstance(canonical_json, dict)
            assert "items" in canonical_json
            assert "metadata" in canonical_json
            _assert_runtime_metadata_contract(canonical_json["metadata"], endpoint="related")
            assert canonical_json["metadata"]["seedProductId"] == 10
            assert alias_json == canonical_json["items"], "Related alias must remain array-compatible"
            assert captured_calls[0]["product_id"] == 10
            assert captured_calls[1]["product_id"] == 10
    finally:
        recommendation_service.get_related_recommendation = original_get_related


async def _test_home_deterministic_cache_window() -> None:
    original_fetch_products = recommendation_service._fetch_all_products
    original_fetch_signals = recommendation_service._fetch_user_signals
    original_fetch_popularity = recommendation_service._fetch_popularity_map
    original_resolve_stock_map = recommendation_service._resolve_stock_map
    original_cache_ttl = recommendation_service.response_cache_ttl_seconds
    original_response_cache = dict(recommendation_service._response_cache)

    async def fake_fetch_products(runtime) -> List[Dict]:
        return [
            {"id": 1, "name": "A", "status": True, "categoryId": 10, "createdAt": "2026-05-01T00:00:00"},
            {"id": 2, "name": "B", "status": True, "categoryId": 10, "createdAt": "2026-05-02T00:00:00"},
            {"id": 3, "name": "C", "status": True, "categoryId": 11, "createdAt": "2026-05-03T00:00:00"},
        ]

    async def fake_fetch_signals(user_id: int, runtime) -> Dict[str, List[Dict]]:
        return {
            "orderSignals": [
                {"medicineId": 1, "quantity": 2, "createdAt": "2026-05-10T00:00:00", "status": "PAID"},
            ],
            "cartSignals": [
                {"medicineId": 2, "quantity": 1},
            ],
        }

    async def fake_fetch_popularity(runtime) -> Dict[int, float]:
        return {1: 10.0, 2: 9.0, 3: 8.0}

    def fake_resolve_stock_map(medicine_ids: List[int], user_id: int, runtime):
        return ({medicine_id: 100 for medicine_id in medicine_ids}, False)

    recommendation_service._fetch_all_products = fake_fetch_products
    recommendation_service._fetch_user_signals = fake_fetch_signals
    recommendation_service._fetch_popularity_map = fake_fetch_popularity
    recommendation_service._resolve_stock_map = fake_resolve_stock_map
    recommendation_service.response_cache_ttl_seconds = 90
    recommendation_service._response_cache.clear()

    try:
        first = await recommendation_service.get_home_recommendation(123, 3)
        second = await recommendation_service.get_home_recommendation(123, 3)

        first_ids = [item["id"] for item in first["items"]]
        second_ids = [item["id"] for item in second["items"]]

        assert first_ids == second_ids, "Deterministic ordering regression detected"
        assert first["metadata"]["cacheHit"] is False
        assert second["metadata"]["cacheHit"] is True

        cache_key = recommendation_service._build_response_cache_key(123, 3)
        cached_payload, _ = recommendation_service._response_cache[cache_key]
        recommendation_service._response_cache[cache_key] = (
            cached_payload,
            datetime.now(timezone.utc) - timedelta(seconds=1),
        )

        third = await recommendation_service.get_home_recommendation(123, 3)
        third_ids = [item["id"] for item in third["items"]]
        assert third["metadata"]["cacheHit"] is False
        assert third_ids == first_ids, "Deterministic ordering must remain stable after cache expiry recompute"
    finally:
        recommendation_service._fetch_all_products = original_fetch_products
        recommendation_service._fetch_user_signals = original_fetch_signals
        recommendation_service._fetch_popularity_map = original_fetch_popularity
        recommendation_service._resolve_stock_map = original_resolve_stock_map
        recommendation_service.response_cache_ttl_seconds = original_cache_ttl
        recommendation_service._response_cache = original_response_cache


async def _test_related_determinism_and_seed_exclusion() -> None:
    original_fetch_products = recommendation_service._fetch_all_products
    original_fetch_popularity = recommendation_service._fetch_popularity_map
    original_resolve_stock_map = recommendation_service._resolve_stock_map
    original_cache_ttl = recommendation_service.response_cache_ttl_seconds
    original_response_cache = dict(recommendation_service._response_cache)

    async def fake_fetch_products(runtime) -> List[Dict]:
        return [
            {"id": 100, "name": "Seed", "status": True, "categoryId": 10, "brand": "SeedBrand", "createdAt": "2026-05-01T00:00:00"},
            {"id": 1, "name": "BestMatch", "status": True, "categoryId": 10, "brand": "SeedBrand", "createdAt": "2026-05-02T00:00:00"},
            {"id": 2, "name": "CategoryMatch", "status": True, "categoryId": 10, "brand": "OtherBrand", "createdAt": "2026-05-03T00:00:00"},
            {"id": 3, "name": "BrandMatch", "status": True, "categoryId": 20, "brand": "SeedBrand", "createdAt": "2026-05-04T00:00:00"},
            {"id": 4, "name": "PopularityOnly", "status": True, "categoryId": 30, "brand": "AnotherBrand", "createdAt": "2026-05-05T00:00:00"},
        ]

    async def fake_fetch_popularity(runtime) -> Dict[int, float]:
        return {1: 5.0, 2: 10.0, 3: 8.0, 4: 7.0}

    def fake_resolve_stock_map(medicine_ids: List[int], user_id: Optional[int], runtime):
        return ({medicine_id: 100 for medicine_id in medicine_ids}, False)

    recommendation_service._fetch_all_products = fake_fetch_products
    recommendation_service._fetch_popularity_map = fake_fetch_popularity
    recommendation_service._resolve_stock_map = fake_resolve_stock_map
    recommendation_service.response_cache_ttl_seconds = 90
    recommendation_service._response_cache.clear()

    try:
        first = await recommendation_service.get_related_recommendation(100, 3)
        second = await recommendation_service.get_related_recommendation(100, 3)

        first_ids = [item["id"] for item in first["items"]]
        second_ids = [item["id"] for item in second["items"]]
        assert first_ids == [1, 2, 3], "Unexpected related ranking order"
        assert 100 not in first_ids, "Seed product must be excluded from related results"
        assert first_ids == second_ids
        assert first["metadata"]["cacheHit"] is False
        assert second["metadata"]["cacheHit"] is True

        cache_key = recommendation_service._build_related_response_cache_key(100, 3)
        cached_payload, _ = recommendation_service._response_cache[cache_key]
        recommendation_service._response_cache[cache_key] = (
            cached_payload,
            datetime.now(timezone.utc) - timedelta(seconds=1),
        )

        third = await recommendation_service.get_related_recommendation(100, 3)
        third_ids = [item["id"] for item in third["items"]]
        assert third["metadata"]["cacheHit"] is False
        assert third_ids == first_ids, "Related ordering must remain deterministic after cache expiry recompute"
    finally:
        recommendation_service._fetch_all_products = original_fetch_products
        recommendation_service._fetch_popularity_map = original_fetch_popularity
        recommendation_service._resolve_stock_map = original_resolve_stock_map
        recommendation_service.response_cache_ttl_seconds = original_cache_ttl
        recommendation_service._response_cache = original_response_cache


async def _test_related_degraded_semantics() -> None:
    original_fetch_products = recommendation_service._fetch_all_products
    original_fetch_popularity = recommendation_service._fetch_popularity_map
    original_fetch_inventory_stocks = recommendation_service._fetch_inventory_stocks
    original_stock_snapshot = dict(recommendation_service._stock_snapshot_cache)
    original_response_cache = dict(recommendation_service._response_cache)

    async def fake_fetch_products(runtime) -> List[Dict]:
        return [
            {"id": 100, "name": "Seed", "status": True, "categoryId": 10, "brand": "SeedBrand", "createdAt": "2026-05-01T00:00:00"},
            {"id": 9, "name": "Fallback", "status": True, "categoryId": 10, "brand": "SeedBrand", "createdAt": "2026-05-04T00:00:00"},
        ]

    async def fake_fetch_popularity(runtime) -> Dict[int, float]:
        return {9: 1.0}

    def fake_fetch_inventory_stocks(medicine_ids: List[int], user_id: Optional[int]):
        raise RuntimeError("inventory down")

    recommendation_service._fetch_all_products = fake_fetch_products
    recommendation_service._fetch_popularity_map = fake_fetch_popularity
    recommendation_service._fetch_inventory_stocks = fake_fetch_inventory_stocks
    recommendation_service._stock_snapshot_cache.clear()
    recommendation_service._response_cache.clear()

    logger = logging.getLogger("app.services.recommendation_service")
    capture = CaptureHandler()
    logger.addHandler(capture)

    try:
        payload = await recommendation_service.get_related_recommendation(100, 1)
        assert payload["metadata"]["degraded"] is True
        reasons = set(payload["metadata"]["degradedReasons"])
        assert "inventory_service_unavailable" in reasons
        assert "inventory_filter_degraded" in reasons
        assert any("inventory_filter_degraded" in message for message in capture.messages), (
            "Expected inventory_filter_degraded marker was not emitted"
        )
    finally:
        logger.removeHandler(capture)
        recommendation_service._fetch_all_products = original_fetch_products
        recommendation_service._fetch_popularity_map = original_fetch_popularity
        recommendation_service._fetch_inventory_stocks = original_fetch_inventory_stocks
        recommendation_service._stock_snapshot_cache = original_stock_snapshot
        recommendation_service._response_cache = original_response_cache


def main() -> None:
    _test_home_route_contract_and_identity_policy()
    _test_related_route_contract_and_seed_policy()
    asyncio.run(_test_home_deterministic_cache_window())
    asyncio.run(_test_related_determinism_and_seed_exclusion())
    asyncio.run(_test_related_degraded_semantics())
    print("test_recommendation_contract: OK")


if __name__ == "__main__":
    main()
