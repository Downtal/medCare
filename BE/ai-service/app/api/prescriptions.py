from fastapi import APIRouter, HTTPException, Body
from app.services.prescription_ocr_service import prescription_ocr_service
from pydantic import BaseModel
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class AnalyzeRequest(BaseModel):
    image_url: str

class TextAnalyzeRequest(BaseModel):
    text: str

@router.post("/prescriptions/analyze")
async def analyze_prescription(request: AnalyzeRequest):
    try:
        result = await prescription_ocr_service.analyze_prescription(request.image_url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prescriptions/ping")
async def ping():
    return {"status": "ok", "message": "Prescription service is reachable"}

@router.get("/prescriptions/db-check")
async def db_check():
    from app.models.chat_log import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    try:
        result = db.execute(text("SHOW TABLES LIKE 'product_symptoms'"))
        exists = result.fetchone() is not None
        count = 0
        if exists:
            count_res = db.execute(text("SELECT COUNT(*) FROM product_symptoms"))
            count = count_res.fetchone()[0]
        return {"table_exists": exists, "row_count": count}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@router.post("/prescriptions/extract-medicines")
async def extract_medicines(request: TextAnalyzeRequest):
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Text is empty")
        
        logger.info(f"Received extraction request: {request.text[:50]}...")
        result = await prescription_ocr_service.extract_medicines_from_text(request.text)
        return result
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Extraction error details:\n{error_details}")
        # Return the exception message directly in the response
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")
