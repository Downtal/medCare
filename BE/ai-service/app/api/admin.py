from fastapi import APIRouter, HTTPException
from app.services.sync_service import sync_service

router = APIRouter()

@router.post("/sync-products")
async def trigger_sync():
    """
    Manually trigger synchronization of products from product-service to local database.
    """
    result = await sync_service.sync_products()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error"))
    
    return result
