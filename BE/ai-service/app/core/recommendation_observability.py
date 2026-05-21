import json
import logging
from typing import Any, Dict, Optional

from fastapi import Request
from prometheus_client import Counter, Histogram

logger = logging.getLogger("app.observability.recommendations")

_REQUEST_LATENCY_SECONDS = Histogram(
    "recommendation_request_latency_seconds",
    "Recommendation endpoint latency in seconds",
    ["endpoint", "route_variant"],
)
_REQUEST_TOTAL = Counter(
    "recommendation_request_total",
    "Total recommendation endpoint requests",
    ["endpoint", "route_variant", "status_code"],
)
_REQUEST_ERRORS_TOTAL = Counter(
    "recommendation_request_errors_total",
    "Total recommendation endpoint errors (status_code >= 400)",
    ["endpoint", "route_variant", "status_code"],
)
_FALLBACK_TOTAL = Counter(
    "recommendation_fallback_total",
    "Total recommendation responses served with fallback source",
    ["endpoint", "route_variant"],
)
_DEGRADED_TOTAL = Counter(
    "recommendation_degraded_total",
    "Total recommendation responses marked degraded",
    ["endpoint", "route_variant"],
)


def record_recommendation_request(
    *,
    endpoint: str,
    route_variant: str,
    status_code: int,
    latency_seconds: float,
    request: Request,
    metadata: Optional[Dict[str, Any]] = None,
    error_type: Optional[str] = None,
) -> None:
    endpoint_label = endpoint.lower()
    route_variant_label = route_variant.lower()
    status_label = str(status_code)

    _REQUEST_LATENCY_SECONDS.labels(endpoint_label, route_variant_label).observe(latency_seconds)
    _REQUEST_TOTAL.labels(endpoint_label, route_variant_label, status_label).inc()

    if status_code >= 400:
        _REQUEST_ERRORS_TOTAL.labels(endpoint_label, route_variant_label, status_label).inc()

    degraded = bool((metadata or {}).get("degraded"))
    if degraded:
        _DEGRADED_TOTAL.labels(endpoint_label, route_variant_label).inc()

    source = str((metadata or {}).get("source") or "")
    if "fallback" in source:
        _FALLBACK_TOTAL.labels(endpoint_label, route_variant_label).inc()

    structured_log = {
        "event": "recommendation_request",
        "endpoint": endpoint_label,
        "routeVariant": route_variant_label,
        "method": request.method,
        "path": request.url.path,
        "statusCode": status_code,
        "latencyMs": round(latency_seconds * 1000, 2),
        "degraded": degraded,
        "degradedReasons": (metadata or {}).get("degradedReasons", []),
        "source": source,
        "cacheHit": bool((metadata or {}).get("cacheHit")),
        "identityType": (metadata or {}).get("identityType"),
        "seedProductId": (metadata or {}).get("seedProductId"),
        "remoteIp": request.client.host if request.client else None,
        "errorType": error_type,
    }
    logger.info(json.dumps(structured_log, ensure_ascii=True))
