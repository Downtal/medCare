from typing import Optional
from time import perf_counter

from fastapi import APIRouter, Header, HTTPException, Query, Request

from app.config.settings import settings
from app.core.recommendation_observability import record_recommendation_request
from app.services.recommendation_service import recommendation_service

router = APIRouter(tags=["Recommendations"])


def _normalize_user_id(x_user_id: Optional[str]) -> Optional[int]:
    if x_user_id is None:
        return None

    raw_value = x_user_id.strip()
    if not raw_value or raw_value.lower() == "null":
        return None

    try:
        parsed_user_id = int(raw_value)
    except ValueError:
        return None

    if parsed_user_id <= 0:
        return None
    return parsed_user_id


def _normalize_required_product_id(product_id: Optional[str]) -> int:
    if product_id is None:
        raise HTTPException(status_code=400, detail="productId is required")

    raw_value = product_id.strip()
    if not raw_value:
        raise HTTPException(status_code=400, detail="productId is required")

    try:
        parsed_product_id = int(raw_value)
    except ValueError as exception:
        raise HTTPException(status_code=400, detail="productId must be a positive integer") from exception

    if parsed_product_id <= 0:
        raise HTTPException(status_code=400, detail="productId must be a positive integer")

    return parsed_product_id


@router.get("/api/recommendations/home")
async def get_home_recommendations(
    request: Request,
    x_user_id: Optional[str] = Header(None),
    limit: int = settings.RECOMMENDATION_DEFAULT_LIMIT,
):
    started_at = perf_counter()
    status_code = 200
    error_type: Optional[str] = None
    payload = None
    try:
        user_id = _normalize_user_id(x_user_id)
        payload = await recommendation_service.get_home_recommendation(user_id, limit)
        return payload
    except HTTPException as exception:
        status_code = exception.status_code
        error_type = exception.__class__.__name__
        raise
    except Exception as exception:
        status_code = 500
        error_type = exception.__class__.__name__
        raise
    finally:
        record_recommendation_request(
            endpoint="home",
            route_variant="canonical",
            status_code=status_code,
            latency_seconds=perf_counter() - started_at,
            request=request,
            metadata=payload.get("metadata") if isinstance(payload, dict) else None,
            error_type=error_type,
        )


@router.get("/api/ai/recommendations")
async def get_recommendations_alias(
    request: Request,
    x_user_id: Optional[str] = Header(None),
    limit: int = settings.RECOMMENDATION_DEFAULT_LIMIT,
):
    started_at = perf_counter()
    status_code = 200
    error_type: Optional[str] = None
    payload = None
    try:
        user_id = _normalize_user_id(x_user_id)
        payload = await recommendation_service.get_home_recommendation(user_id, limit)
        return payload.get("items", [])
    except HTTPException as exception:
        status_code = exception.status_code
        error_type = exception.__class__.__name__
        raise
    except Exception as exception:
        status_code = 500
        error_type = exception.__class__.__name__
        raise
    finally:
        record_recommendation_request(
            endpoint="home",
            route_variant="alias",
            status_code=status_code,
            latency_seconds=perf_counter() - started_at,
            request=request,
            metadata=payload.get("metadata") if isinstance(payload, dict) else None,
            error_type=error_type,
        )


@router.get("/api/recommendations/related")
async def get_related_recommendations(
    request: Request,
    product_id: Optional[str] = Query(None, alias="productId"),
    limit: int = settings.RECOMMENDATION_DEFAULT_LIMIT,
):
    started_at = perf_counter()
    status_code = 200
    error_type: Optional[str] = None
    payload = None
    try:
        normalized_product_id = _normalize_required_product_id(product_id)
        payload = await recommendation_service.get_related_recommendation(normalized_product_id, limit)
        return payload
    except HTTPException as exception:
        status_code = exception.status_code
        error_type = exception.__class__.__name__
        raise
    except ValueError as exception:
        status_code = 400
        error_type = exception.__class__.__name__
        raise HTTPException(status_code=400, detail=str(exception)) from exception
    except Exception as exception:
        status_code = 500
        error_type = exception.__class__.__name__
        raise
    finally:
        record_recommendation_request(
            endpoint="related",
            route_variant="canonical",
            status_code=status_code,
            latency_seconds=perf_counter() - started_at,
            request=request,
            metadata=payload.get("metadata") if isinstance(payload, dict) else None,
            error_type=error_type,
        )


@router.get("/api/ai/recommendations/related")
async def get_related_recommendations_alias(
    request: Request,
    product_id: Optional[str] = Query(None, alias="productId"),
    limit: int = settings.RECOMMENDATION_DEFAULT_LIMIT,
):
    started_at = perf_counter()
    status_code = 200
    error_type: Optional[str] = None
    payload = None
    try:
        normalized_product_id = _normalize_required_product_id(product_id)
        payload = await recommendation_service.get_related_recommendation(normalized_product_id, limit)
        return payload.get("items", [])
    except HTTPException as exception:
        status_code = exception.status_code
        error_type = exception.__class__.__name__
        raise
    except ValueError as exception:
        status_code = 400
        error_type = exception.__class__.__name__
        raise HTTPException(status_code=400, detail=str(exception)) from exception
    except Exception as exception:
        status_code = 500
        error_type = exception.__class__.__name__
        raise
    finally:
        record_recommendation_request(
            endpoint="related",
            route_variant="alias",
            status_code=status_code,
            latency_seconds=perf_counter() - started_at,
            request=request,
            metadata=payload.get("metadata") if isinstance(payload, dict) else None,
            error_type=error_type,
        )
