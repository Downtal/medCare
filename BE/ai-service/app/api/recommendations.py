from fastapi import APIRouter, Header
from typing import Optional, List, Dict
from app.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/ai/recommendations", tags=["Recommendations"])

@router.get("")
async def get_recommendations(x_user_id: Optional[str] = Header(None), limit: int = 8):
    user_id = int(x_user_id) if x_user_id and x_user_id != "null" else None
    return await recommendation_service.get_personalized_recommendations(user_id, limit)
