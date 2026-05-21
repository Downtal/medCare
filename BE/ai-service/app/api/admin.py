from fastapi import APIRouter, HTTPException, Depends, Header, Request
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.chat_log import get_db, ChatbotLog
from app.models.product_symptom import ProductSymptom
from app.services.sync_service import sync_service
from pydantic import BaseModel

router = APIRouter()

class SymptomUpdateRequest(BaseModel):
    symptoms: str

def _decode_jwt_payload(token: str) -> dict:
    """Decode JWT payload without signature verification using only built-in modules."""
    import base64, json
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return {}
        payload_b64 = parts[1]
        # Add padding
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += '=' * padding
        decoded_bytes = base64.urlsafe_b64decode(payload_b64)
        return json.loads(decoded_bytes)
    except Exception as e:
        print(f"DEBUG: JWT manual decode error: {e}")
        return {}

def admin_only(
    x_user_role: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None)
):
    # First try the X-User-Role header (set by Gateway)
    role = x_user_role
    
    # If not present, decode from JWT token directly (no external lib needed)
    if not role and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        payload = _decode_jwt_payload(token)
        role = payload.get("role") or payload.get("roles") or payload.get("authorities")
        if isinstance(role, list):
            role = role[0] if role else None
        print(f"DEBUG: admin_only decoded role from JWT payload: {role}, claims: {list(payload.keys())}")
    
    print(f"DEBUG: admin_only final role check: {role}")
    if role not in ["ADMIN", "PHARMACIST"]:
        raise HTTPException(status_code=403, detail=f"Access denied. Role '{role}' is not authorized.")
    return role

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


@router.delete("/admin/products/{product_id}", dependencies=[Depends(admin_only)])
async def delete_product_mapping(product_id: int, db: Session = Depends(get_db)):
    """
    Delete the symptom mapping for a specific product.
    """
    product = db.query(ProductSymptom).filter(ProductSymptom.id == product_id).first()
    if not product:
        # If it's already gone, that's fine too
        return {"success": True, "message": "Product not found, nothing to delete"}
    
    db.delete(product)
    db.commit()
    return {"success": True}

@router.post("/admin/products/{product_id}/sync", dependencies=[Depends(admin_only)])
async def sync_single_product(product_id: int):
    """
    Sync a single product from product-service to AI database.
    """
    result = await sync_service.sync_single_product(product_id)
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result
