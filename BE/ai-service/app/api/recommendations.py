from fastapi import APIRouter, Header
from typing import Optional, List, Dict
from app.services.recommendation_service import recommendation_service
from app.services.history_analysis_service import history_analysis_service
from app.services.safety_check_service import safety_check_service

router = APIRouter(prefix="/api/ai/recommendations", tags=["Recommendations"])

@router.get("")
async def get_recommendations(x_user_id: Optional[str] = Header(None), limit: int = 8):
    user_id = int(x_user_id) if x_user_id and x_user_id != "null" else None
    return await recommendation_service.get_personalized_recommendations(user_id, limit)

@router.get("/history-analysis")
async def get_history_analysis(x_user_id: Optional[str] = Header(None)):
    user_id = int(x_user_id) if x_user_id and x_user_id != "null" else None
    if not user_id:
        return {"summary": "Vui lòng đăng nhập để xem phân tích bệnh sử.", "habit_alerts": [], "health_status": "GUEST"}
    return await history_analysis_service.analyze_user_health_history(user_id)

@router.post("/safety-check")
async def check_safety(cart_items: List[Dict], x_user_id: Optional[str] = Header(None)):
    user_id = int(x_user_id) if x_user_id and x_user_id != "null" else None
    return await safety_check_service.check_drug_safety(user_id, cart_items)
