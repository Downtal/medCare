from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.chat_log import get_db, ChatbotLog
from app.models.product_symptom import ProductSymptom
from app.services.sync_service import sync_service
from pydantic import BaseModel

router = APIRouter()

class SymptomUpdateRequest(BaseModel):
    symptoms: str

def admin_only(x_user_role: Optional[str] = Header(None)):
    if x_user_role not in ["ADMIN", "PHARMACIST"]:
        raise HTTPException(status_code=403, detail="Only Admins or Pharmacists can access this resource")
    return x_user_role

@router.post("/admin/sync-products", dependencies=[Depends(admin_only)])
async def trigger_sync():
    """
    Manually trigger synchronization of products from product-service to local database.
    """
    result = await sync_service.sync_products()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    
    return result

@router.get("/admin/products", dependencies=[Depends(admin_only)])
async def get_indexed_products(db: Session = Depends(get_db)):
    """
    Get all products currently indexed in the AI service.
    """
    products = db.query(ProductSymptom).order_by(ProductSymptom.updated_at.desc()).all()
    return products

@router.get("/admin/logs", dependencies=[Depends(admin_only)])
async def get_chat_logs(db: Session = Depends(get_db)):
    """
    Get recent chat logs for review.
    """
    logs = db.query(ChatbotLog).order_by(ChatbotLog.created_at.desc()).limit(100).all()
    return logs

@router.put("/admin/products/{product_id}", dependencies=[Depends(admin_only)])
async def update_product_mapping(product_id: int, request: SymptomUpdateRequest, db: Session = Depends(get_db)):
    """
    Update the symptom mapping for a specific product.
    """
    product = db.query(ProductSymptom).filter(ProductSymptom.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in index")
    
    product.symptoms = request.symptoms
    db.commit()
    return {"success": True}
