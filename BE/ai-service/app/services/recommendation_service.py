import logging
from collections import defaultdict
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

import httpx

from app.config.settings import settings

logger = logging.getLogger(__name__)


class RecommendationService:
    def __init__(self):
        self.order_service_url = settings.ORDER_SERVICE_URL
        self.product_service_url = settings.PRODUCT_SERVICE_URL
        self.inventory_service_url = settings.INVENTORY_SERVICE_URL
        self.signal_window_days = settings.RECOMMENDATION_SIGNAL_WINDOW_DAYS
        self.default_limit = settings.RECOMMENDATION_DEFAULT_LIMIT
        self.popular_pool_size = settings.RECOMMENDATION_FALLBACK_POPULAR_POOL_SIZE
        self.newest_pool_size = settings.RECOMMENDATION_FALLBACK_NEWEST_POOL_SIZE
        self.stock_snapshot_ttl = timedelta(seconds=settings.RECOMMENDATION_STOCK_SNAPSHOT_TTL_SECONDS)
        self.response_cache_ttl_seconds = settings.RECOMMENDATION_RESPONSE_CACHE_TTL_SECONDS
        self.http_timeout = settings.RECOMMENDATION_HTTP_TIMEOUT_SECONDS
        self.weights = {
            "order": 0.45,  # Increased from 0.35
            "cart": 0.45,   # Increased from 0.35
            "popularity": 0.10,
        }
        self.related_weights = {
            "category": settings.RECOMMENDATION_RELATED_WEIGHT_CATEGORY,
            "brand": settings.RECOMMENDATION_RELATED_WEIGHT_BRAND,
            "popularity": settings.RECOMMENDATION_RELATED_WEIGHT_POPULARITY,
        }
        self._stock_snapshot_cache: Dict[int, Tuple[int, datetime]] = {}
        self._response_cache: Dict[str, Tuple[Dict, datetime]] = {}

    async def get_personalized_recommendations(self, user_id: Optional[int] = None, limit: int = 8) -> List[Dict]:
        payload = await self.get_home_recommendation(user_id, limit)
        return payload.get("items", [])

    async def get_home_recommendation(self, user_id: Optional[int] = None, limit: int = 8) -> Dict:
        safe_limit = self._normalize_limit(limit)
        cache_key = self._build_response_cache_key(user_id, safe_limit)
        now_utc = datetime.now(timezone.utc)

        cached = self._response_cache.get(cache_key)
        if cached is not None:
            cached_payload, expires_at = cached
            if now_utc < expires_at:
                payload = self._clone_payload(cached_payload)
                payload["metadata"]["cacheHit"] = True
                return payload

        runtime = {
            "degraded": False,
            "degradedReasons": set(),
            "source": "personalized" if user_id is not None else "anonymous_fallback",
        }

        items: List[Dict]
        try:
            items = await self._compute_recommendations(user_id=user_id, limit=safe_limit, runtime=runtime)
        except Exception:
            logger.exception("Recommendation pipeline failed")
            self._mark_degraded(runtime, "pipeline_exception")
            items = []

        payload = {
            "items": items[:safe_limit],
            "metadata": {
                "degraded": bool(runtime["degraded"]),
                "degradedReasons": sorted(runtime["degradedReasons"]),
                "source": runtime["source"],
                "fallback": "fallback" in str(runtime["source"]),
                "identityType": "authenticated" if user_id is not None else "anonymous",
                "limit": safe_limit,
                "cacheTtlSeconds": self.response_cache_ttl_seconds,
                "cacheHit": False,
                "generatedAt": now_utc.isoformat(),
            },
        }

        expires_at = now_utc + timedelta(seconds=self.response_cache_ttl_seconds)
        self._response_cache[cache_key] = (self._clone_payload(payload), expires_at)
        return payload

    async def get_related_recommendation(self, product_id: int, limit: int = 8) -> Dict:
        safe_limit = self._normalize_limit(limit)
        cache_key = self._build_related_response_cache_key(product_id, safe_limit)
        now_utc = datetime.now(timezone.utc)

        cached = self._response_cache.get(cache_key)
        if cached is not None:
            cached_payload, expires_at = cached
            if now_utc < expires_at:
                payload = self._clone_payload(cached_payload)
                payload["metadata"]["cacheHit"] = True
                return payload

        runtime = {
            "degraded": False,
            "degradedReasons": set(),
            "source": "related",
        }

        items: List[Dict]
        try:
            items = await self._compute_related_recommendations(
                product_id=product_id,
                limit=safe_limit,
                runtime=runtime,
            )
        except Exception:
            logger.exception("Related recommendation pipeline failed productId=%s", product_id)
            self._mark_degraded(runtime, "pipeline_exception")
            items = []

        payload = {
            "items": items[:safe_limit],
            "metadata": {
                "degraded": bool(runtime["degraded"]),
                "degradedReasons": sorted(runtime["degradedReasons"]),
                "source": runtime["source"],
                "fallback": "fallback" in str(runtime["source"]),
                "seedProductId": product_id,
                "limit": safe_limit,
                "cacheTtlSeconds": self.response_cache_ttl_seconds,
                "cacheHit": False,
                "generatedAt": now_utc.isoformat(),
            },
        }

        expires_at = now_utc + timedelta(seconds=self.response_cache_ttl_seconds)
        self._response_cache[cache_key] = (self._clone_payload(payload), expires_at)
        return payload

    async def _compute_recommendations(
        self,
        user_id: Optional[int],
        limit: int,
        runtime: Dict[str, object],
    ) -> List[Dict]:
        all_products = await self._fetch_all_products(runtime)
        if not all_products:
            return []

        products_by_id = {
            int(product["id"]): product
            for product in all_products
            if isinstance(product, dict) and product.get("id") is not None
        }
        if not products_by_id:
            return []

        active_products = {
            medicine_id: product
            for medicine_id, product in products_by_id.items()
            if bool(product.get("status")) and not bool(product.get("requiresPrescription"))
        }
        if not active_products:
            return []

        popularity_map = await self._fetch_popularity_map(runtime)
        selected_ids: List[int]

        if user_id is None:
            selected_ids = await self._select_from_fallback(
                active_products=active_products,
                popularity_map=popularity_map,
                selected_ids=[],
                limit=limit,
                user_id=user_id,
                runtime=runtime,
            )
        else:
            user_signals = await self._fetch_user_signals(user_id, runtime)
            ranked_ids, score_map = self._build_ranked_candidate_ids(
                active_products=active_products,
                popularity_map=popularity_map,
                user_signals=user_signals,
            )

            selected_ids = self._apply_ranked_pipeline(
                ranked_ids=ranked_ids,
                score_map=score_map,
                products_by_id=active_products,
                user_id=user_id,
                limit=limit,
                runtime=runtime,
            )

            if len(selected_ids) < limit:
                runtime["source"] = "personalized_with_fallback"
                selected_ids = await self._select_from_fallback(
                    active_products=active_products,
                    popularity_map=popularity_map,
                    selected_ids=selected_ids,
                    limit=limit,
                    user_id=user_id,
                    runtime=runtime,
                )

        return [active_products[medicine_id] for medicine_id in selected_ids][:limit]

    async def _compute_related_recommendations(
        self,
        product_id: int,
        limit: int,
        runtime: Dict[str, object],
    ) -> List[Dict]:
        all_products = await self._fetch_all_products(runtime)
        if not all_products:
            return []

        products_by_id = {
            int(product["id"]): product
            for product in all_products
            if isinstance(product, dict) and product.get("id") is not None
        }

        seed_product = products_by_id.get(product_id)
        if seed_product is None:
            raise ValueError("Invalid productId")

        active_products = {
            medicine_id: product
            for medicine_id, product in products_by_id.items()
            if bool(product.get("status")) and medicine_id != product_id and not bool(product.get("requiresPrescription"))
        }
        if not active_products:
            return []

        popularity_map = await self._fetch_popularity_map(runtime)
        ranked_ids, score_map = self._build_related_ranked_candidate_ids(
            seed_product=seed_product,
            active_products=active_products,
            popularity_map=popularity_map,
        )

        selected_ids = self._apply_ranked_pipeline(
            ranked_ids=ranked_ids,
            score_map=score_map,
            products_by_id=active_products,
            user_id=None,
            limit=limit,
            runtime=runtime,
        )

        if len(selected_ids) < limit:
            runtime["source"] = "related_with_fallback"
            selected_ids = await self._select_from_fallback(
                active_products=active_products,
                popularity_map=popularity_map,
                selected_ids=selected_ids,
                limit=limit,
                user_id=None,
                runtime=runtime,
            )

        return [active_products[medicine_id] for medicine_id in selected_ids][:limit]

    def _build_response_cache_key(self, user_id: Optional[int], limit: int) -> str:
        identity_segment = self._identity_cache_segment(user_id)
        return f"{identity_segment}|limit:{limit}"

    def _build_related_response_cache_key(self, product_id: int, limit: int) -> str:
        return f"related:seed:{product_id}|limit:{limit}"

    def _identity_cache_segment(self, user_id: Optional[int]) -> str:
        if user_id is None:
            return "anonymous"
        return f"user:{user_id}"

    def _normalize_limit(self, limit: int) -> int:
        if limit <= 0:
            return self.default_limit
        return limit

    def _clone_payload(self, payload: Dict) -> Dict:
        return deepcopy(payload)

    def _mark_degraded(self, runtime: Dict[str, object], reason: str) -> None:
        runtime["degraded"] = True
        runtime["degradedReasons"].add(reason)

    def _build_related_ranked_candidate_ids(
        self,
        seed_product: Dict,
        active_products: Dict[int, Dict],
        popularity_map: Dict[int, float],
    ) -> Tuple[List[int], Dict[int, float]]:
        candidate_ids = list(active_products.keys())
        if not candidate_ids:
            return [], {}

        seed_category_id = self._safe_int(seed_product.get("categoryId"))
        seed_brand = self._extract_brand(seed_product)

        category_raw: Dict[int, float] = {}
        brand_raw: Dict[int, float] = {}
        popularity_raw: Dict[int, float] = {}

        for medicine_id in candidate_ids:
            candidate = active_products[medicine_id]
            candidate_category_id = self._safe_int(candidate.get("categoryId"))
            candidate_brand = self._extract_brand(candidate)

            category_raw[medicine_id] = 1.0 if seed_category_id is not None and candidate_category_id == seed_category_id else 0.0
            brand_raw[medicine_id] = 1.0 if seed_brand and candidate_brand == seed_brand else 0.0
            popularity_raw[medicine_id] = popularity_map.get(medicine_id, 0.0)

        category_norm = self._normalize_component(category_raw, candidate_ids)
        brand_norm = self._normalize_component(brand_raw, candidate_ids)
        popularity_norm = self._normalize_component(popularity_raw, candidate_ids)

        final_scores: Dict[int, float] = {}
        for medicine_id in candidate_ids:
            final_scores[medicine_id] = (
                self.related_weights["category"] * category_norm.get(medicine_id, 0.0)
                + self.related_weights["brand"] * brand_norm.get(medicine_id, 0.0)
                + self.related_weights["popularity"] * popularity_norm.get(medicine_id, 0.0)
            )

        ranked_ids = sorted(candidate_ids, key=lambda medicine_id: (-final_scores[medicine_id], medicine_id))
        return ranked_ids, final_scores

    def _build_ranked_candidate_ids(
        self,
        active_products: Dict[int, Dict],
        popularity_map: Dict[int, float],
        user_signals: Dict[str, List[Dict]],
    ) -> Tuple[List[int], Dict[int, float]]:
        candidate_ids = list(active_products.keys())
        if not candidate_ids:
            return [], {}

        order_raw = self._build_order_scores(user_signals.get("orderSignals", []))
        cart_raw = self._build_cart_scores(user_signals.get("cartSignals", []))
        popularity_raw = {medicine_id: popularity_map.get(medicine_id, 0.0) for medicine_id in candidate_ids}

        order_norm = self._normalize_component(order_raw, candidate_ids)
        cart_norm = self._normalize_component(cart_raw, candidate_ids)
        popularity_norm = self._normalize_component(popularity_raw, candidate_ids)

        final_scores: Dict[int, float] = {}
        for medicine_id in candidate_ids:
            final_scores[medicine_id] = (
                self.weights["order"] * order_norm.get(medicine_id, 0.0)
                + self.weights["cart"] * cart_norm.get(medicine_id, 0.0)
                + self.weights["popularity"] * popularity_norm.get(medicine_id, 0.0)
            )

        ranked_ids = sorted(candidate_ids, key=lambda medicine_id: (-final_scores[medicine_id], medicine_id))
        return ranked_ids, final_scores

    def _apply_ranked_pipeline(
        self,
        ranked_ids: List[int],
        score_map: Dict[int, float],
        products_by_id: Dict[int, Dict],
        user_id: Optional[int],
        limit: int,
        runtime: Dict[str, object],
    ) -> List[int]:
        if not ranked_ids:
            return []

        filtered_ids, in_stock_map = self._apply_inventory_filter(
            ranked_ids,
            products_by_id,
            user_id,
            runtime=runtime,
        )
        sorted_filtered = sorted(
            filtered_ids,
            key=lambda medicine_id: (-score_map.get(medicine_id, 0.0), -in_stock_map.get(medicine_id, 0), medicine_id),
        )
        return sorted_filtered[:limit]

    async def _select_from_fallback(
        self,
        active_products: Dict[int, Dict],
        popularity_map: Dict[int, float],
        selected_ids: List[int],
        limit: int,
        user_id: Optional[int],
        runtime: Dict[str, object],
    ) -> List[int]:
        if len(selected_ids) >= limit:
            return selected_ids[:limit]

        selected_set = set(selected_ids)
        pool_1_candidates = sorted(
            (
                medicine_id
                for medicine_id in active_products.keys()
                if medicine_id not in selected_set and popularity_map.get(medicine_id, 0.0) > 0
                and not bool(active_products[medicine_id].get("requiresPrescription"))
            ),
            key=lambda medicine_id: (-popularity_map[medicine_id], medicine_id),
        )[: self.popular_pool_size]

        excluded_for_pool_2 = selected_set.union(pool_1_candidates)
        pool_2_candidates = sorted(
            (
                medicine_id 
                for medicine_id in active_products.keys() 
                if medicine_id not in excluded_for_pool_2
                and not bool(active_products[medicine_id].get("requiresPrescription"))
            ),
            key=lambda medicine_id: (
                -(
                    self._parse_datetime(active_products[medicine_id].get("createdAt"))
                    or datetime.min.replace(tzinfo=timezone.utc)
                ).timestamp(),
                medicine_id,
            ),
        )[: self.newest_pool_size]

        fallback_ids = pool_1_candidates + pool_2_candidates
        filtered_fallback_ids, _ = self._apply_inventory_filter(
            fallback_ids,
            active_products,
            user_id,
            runtime=runtime,
        )

        for medicine_id in filtered_fallback_ids:
            if medicine_id in selected_set:
                continue
            selected_ids.append(medicine_id)
            selected_set.add(medicine_id)
            if len(selected_ids) >= limit:
                break

        return selected_ids[:limit]

    def _build_order_scores(self, order_signals: List[Dict]) -> Dict[int, float]:
        raw_scores: Dict[int, float] = defaultdict(float)
        now_utc = datetime.now(timezone.utc)

        for signal in order_signals:
            medicine_id = self._safe_int(signal.get("medicineId"))
            quantity = self._safe_int(signal.get("quantity"), default=0)
            created_at = self._parse_datetime(signal.get("createdAt"))

            if medicine_id is None or quantity <= 0 or created_at is None:
                continue

            age_days = max(0.0, (now_utc - created_at).total_seconds() / 86400.0)
            if age_days > self.signal_window_days:
                continue

            recency_decay = max(0.0, 1.0 - (age_days / float(self.signal_window_days)))
            raw_scores[medicine_id] += quantity * recency_decay

        return raw_scores

    def _build_cart_scores(self, cart_signals: List[Dict]) -> Dict[int, float]:
        raw_scores: Dict[int, float] = defaultdict(float)
        for signal in cart_signals:
            medicine_id = self._safe_int(signal.get("medicineId"))
            quantity = self._safe_int(signal.get("quantity"), default=0)
            if medicine_id is None or quantity <= 0:
                continue
            raw_scores[medicine_id] += float(quantity)
        return raw_scores

    def _normalize_component(self, raw_scores: Dict[int, float], candidate_ids: List[int]) -> Dict[int, float]:
        if not candidate_ids:
            return {}
        max_value = max(raw_scores.get(medicine_id, 0.0) for medicine_id in candidate_ids)
        if max_value <= 0:
            return {medicine_id: 0.0 for medicine_id in candidate_ids}
        return {
            medicine_id: raw_scores.get(medicine_id, 0.0) / max_value
            for medicine_id in candidate_ids
        }

    def _apply_inventory_filter(
        self,
        candidate_ids: List[int],
        products_by_id: Dict[int, Dict],
        user_id: Optional[int],
        runtime: Dict[str, object],
    ) -> Tuple[List[int], Dict[int, int]]:
        if not candidate_ids:
            return [], {}

        stock_map, degraded = self._resolve_stock_map(candidate_ids, user_id, runtime=runtime)
        if degraded:
            logger.warning(
                "inventory_filter_degraded candidateCount=%d cacheSize=%d",
                len(candidate_ids),
                len(self._stock_snapshot_cache),
            )
            self._mark_degraded(runtime, "inventory_filter_degraded")

        filtered_ids: List[int] = []
        in_stock_map: Dict[int, int] = {}
        for medicine_id in candidate_ids:
            product = products_by_id.get(medicine_id)
            if product is None or not bool(product.get("status")):
                continue

            stock_value = stock_map.get(medicine_id)
            if stock_value is None:
                filtered_ids.append(medicine_id)
                in_stock_map[medicine_id] = 0
                continue

            if stock_value > 0:
                filtered_ids.append(medicine_id)
                in_stock_map[medicine_id] = 1

        return filtered_ids, in_stock_map

    def _resolve_stock_map(
        self,
        medicine_ids: List[int],
        user_id: Optional[int],
        runtime: Dict[str, object],
    ) -> Tuple[Dict[int, Optional[int]], bool]:
        try:
            return self._fetch_inventory_stocks(medicine_ids, user_id), False
        except Exception as exception:
            logger.warning("Inventory lookup failed. reason=%s", exception.__class__.__name__)
            self._mark_degraded(runtime, "inventory_service_unavailable")

        now_utc = datetime.now(timezone.utc)
        resolved: Dict[int, Optional[int]] = {}
        degraded = False
        for medicine_id in medicine_ids:
            cached = self._stock_snapshot_cache.get(medicine_id)
            if cached is None:
                resolved[medicine_id] = None
                degraded = True
                continue

            stock_value, cached_at = cached
            if now_utc - cached_at > self.stock_snapshot_ttl:
                resolved[medicine_id] = None
                degraded = True
                continue

            resolved[medicine_id] = stock_value

        return resolved, degraded

    def _fetch_inventory_stocks(self, medicine_ids: List[int], user_id: Optional[int]) -> Dict[int, int]:
        headers = {"X-User-Id": str(user_id) if user_id is not None else "0"}
        payload = [int(medicine_id) for medicine_id in medicine_ids]
        url = f"{self.inventory_service_url}/api/inventory/products/stocks"

        with httpx.Client(timeout=self.http_timeout) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            raw_map = response.json() or {}

        now_utc = datetime.now(timezone.utc)
        stock_map: Dict[int, int] = {}
        for raw_key, raw_value in raw_map.items():
            medicine_id = self._safe_int(raw_key)
            stock_value = self._safe_int(raw_value)
            if medicine_id is None or stock_value is None:
                continue
            stock_map[medicine_id] = stock_value
            self._stock_snapshot_cache[medicine_id] = (stock_value, now_utc)

        return stock_map

    async def _fetch_user_signals(self, user_id: int, runtime: Dict[str, object]) -> Dict[str, List[Dict]]:
        url = f"{self.order_service_url}/api/orders/internal/recommendations/signals"
        params = {"userId": user_id, "days": self.signal_window_days}

        try:
            async with httpx.AsyncClient(timeout=self.http_timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                if not isinstance(data, dict):
                    return {"orderSignals": [], "cartSignals": []}
                return {
                    "orderSignals": data.get("orderSignals", []) or [],
                    "cartSignals": data.get("cartSignals", []) or [],
                }
        except Exception as exception:
            self._mark_degraded(runtime, "order_signals_unavailable")
            logger.warning("Failed to fetch recommendation signals for user %s: %s", user_id, exception.__class__.__name__)
            return {"orderSignals": [], "cartSignals": []}

    async def _fetch_popularity_map(self, runtime: Dict[str, object]) -> Dict[int, float]:
        url = f"{self.order_service_url}/api/orders/internal/recommendations/popular"
        params = {"days": self.signal_window_days, "limit": self.popular_pool_size}

        try:
            async with httpx.AsyncClient(timeout=self.http_timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
        except Exception as exception:
            self._mark_degraded(runtime, "popularity_unavailable")
            logger.warning("Failed to fetch popularity signals: %s", exception.__class__.__name__)
            return {}

        if not isinstance(data, list):
            return {}

        popularity_map: Dict[int, float] = {}
        for item in data:
            if not isinstance(item, dict):
                continue
            medicine_id = self._safe_int(item.get("medicineId"))
            popularity = self._safe_int(item.get("popularity"), default=0)
            if medicine_id is None or popularity <= 0:
                continue
            popularity_map[medicine_id] = float(popularity)
        return popularity_map

    async def _fetch_all_products(self, runtime: Dict[str, object]) -> List[Dict]:
        url = f"{self.product_service_url}/api/products/all"

        try:
            async with httpx.AsyncClient(timeout=self.http_timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
        except Exception as exception:
            self._mark_degraded(runtime, "products_unavailable")
            logger.error("Failed to fetch products: %s", exception.__class__.__name__)
            return []

        if isinstance(data, list):
            return data
        if isinstance(data, dict) and isinstance(data.get("content"), list):
            return data["content"]
        return []

    def _parse_datetime(self, raw_value: object) -> Optional[datetime]:
        if raw_value is None:
            return None

        if isinstance(raw_value, datetime):
            parsed = raw_value
        elif isinstance(raw_value, str):
            try:
                parsed = datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
            except ValueError:
                return None
        else:
            return None

        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)

    def _safe_int(self, raw_value: object, default: Optional[int] = None) -> Optional[int]:
        if raw_value is None:
            return default
        try:
            return int(raw_value)
        except (TypeError, ValueError):
            return default

    def _extract_brand(self, product: Dict) -> str:
        raw_brand = product.get("brand")
        if raw_brand is None:
            return ""
        normalized = str(raw_brand).strip().lower()
        return normalized


recommendation_service = RecommendationService()
