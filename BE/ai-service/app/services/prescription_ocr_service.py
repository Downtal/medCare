import json
import asyncio
import logging
import httpx
import base64
from io import BytesIO
from typing import List, Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.config.settings import settings
from app.models.chat_log import SessionLocal
from app.models.product_symptom import ProductSymptom
from sqlalchemy import or_

logger = logging.getLogger(__name__)

PRESCRIPTION_OCR_PROMPT = """
Bạn là một chuyên gia dược sĩ và bác sĩ có khả năng đọc các đơn thuốc viết tay phức tạp nhất tại Việt Nam.
Hãy phân tích hình ảnh đơn thuốc này và trích xuất thông tin một cách chính xác nhất dưới định dạng JSON.

QUY TẮC TRÍCH XUẤT:
1. hospital_name: Tên bệnh viện hoặc phòng khám.
2. clinic_name: Tên khoa hoặc phòng mạch riêng (nếu có).
3. doctor_name: Tên bác sĩ kê đơn.
4. expiry_date: Ngày đơn thuốc hết hạn (Nếu không ghi, hãy lấy ngày kê đơn + 30 ngày). Định dạng YYYY-MM-DD.
5. medicines: Danh sách các loại thuốc, mỗi mục gồm:
   - name: Tên thuốc (trích xuất nguyên văn).
   - dosage: Liều dùng (VD: 1 viên x 2 lần/ngày).
   - quantity: Số lượng (VD: 10).
   - unit: Đơn vị (VD: Viên, Gói, Chai).
6. medical_diagnosis: Chẩn đoán bệnh của bác sĩ (nếu có).

LƯU Ý: 
- Nếu chữ viết quá mờ, hãy cố gắng suy luận dựa trên ngữ cảnh các loại thuốc đi kèm.
- Nếu không tìm thấy thông tin cụ thể nào, hãy để giá trị là null.
- Chỉ trả về duy nhất khối JSON, không kèm văn bản giải thích.
"""

class PrescriptionOCRService:
    def __init__(self):
        # Prioritize Key 2 to bypass exhausted quota on Key 1
        api_key = settings.GEMINI_API_KEY_2 if settings.GEMINI_API_KEY_2 else settings.GEMINI_API_KEY
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            google_api_key=api_key,
            temperature=0.3,
            convert_system_message_to_human=True
        )

    async def analyze_prescription(self, image_url: str) -> Dict[str, Any]:
        from PIL import Image
        try:
            # 1. Download image
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url)
                if response.status_code != 200:
                    raise Exception(f"Could not download image from {image_url}")
                image_data = response.content

            # 2. Convert to Base64 for Gemini
            image_b64 = base64.b64encode(image_data).decode("utf-8")
            
            # 3. Call Gemini Multimodal
            message = HumanMessage(
                content=[
                    {"type": "text", "text": PRESCRIPTION_OCR_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                    },
                ]
            )
            
            response = await self.llm.ainvoke([message])
            raw_content = response.content
            
            # Clean JSON response
            if "```json" in raw_content:
                raw_content = raw_content.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_content:
                raw_content = raw_content.split("```")[1].strip()
            
            ocr_result = json.loads(raw_content)
            
            # 4. Perform Medicine Mapping
            mapped_medicines = await self._map_medicines(ocr_result.get("medicines", []))
            ocr_result["mapped_medicines"] = mapped_medicines
            
            return ocr_result

        except Exception as e:
            logger.error(f"Error analyzing prescription: {e}")
            raise e

    async def _map_medicines(self, medicines: List[Dict]) -> List[Dict]:
        results = []
        for med in medicines:
            name = med.get("name")
            if not name: continue
            
            # Semantic search in local DB
            match = await self._find_best_match(name)
            
            results.append({
                "original_name": name,
                "dosage": med.get("dosage"),
                "quantity": med.get("quantity"),
                "unit": med.get("unit"),
                "matched_product": match if match else None
            })
        return results

    async def _find_best_match(self, query: str) -> Dict:
        """
        Simple semantic-like search using SQLAlchemy and keyword relevance.
        (In a production app, this would use a real Vector Store)
        """
        db = SessionLocal()
        try:
            # Try to find similar products
            keywords = [k for k in query.split() if len(k) >= 3]
            if not keywords: return None
            
            filters = []
            for k in keywords:
                filters.append(or_(
                    ProductSymptom.name.ilike(f"%{k}%"),
                    ProductSymptom.content.ilike(f"%{k}%")
                ))
            
            candidates = db.query(ProductSymptom).filter(or_(*filters)).all()
            
            if not candidates: return None
            
            # Basic scoring
            best_match = None
            max_score = 0
            query_lower = query.lower()
            
            for p in candidates:
                score = 0
                name_lower = p.name.lower()
                if query_lower in name_lower or name_lower in query_lower:
                    score += 20
                
                # Check keyword overlap in name and content
                for k in keywords:
                    if k.lower() in name_lower:
                        score += 5
                    if p.content and k.lower() in p.content.lower():
                        score += 3
                
                if score > max_score:
                    max_score = score
                    best_match = {
                        "id": p.id,
                        "name": p.name,
                        "relevance": score
                    }
            
            return best_match
        finally:
            db.close()

    async def extract_medicines_from_text(self, text: str) -> Dict[str, Any]:
        logger.info(f"Extracting medicines from text (len={len(text)})")
        try:
            system_prompt = """
            Bạn là một chuyên gia dược sĩ. Nhiệm vụ của bạn là trích xuất danh sách các loại thuốc từ đoạn văn bản OCR thô.
            
            QUY TẮC:
            1. Trả về định dạng JSON với một danh sách các đối tượng medicines.
            2. Mỗi đối tượng medicine gồm:
               - name: Tên thuốc chính xác nhất.
               - dosage: Liều dùng (nếu có).
               - quantity: Số lượng (nếu có).
               - unit: Đơn vị (viên, hộp, lọ...).
            3. Loại bỏ thông tin rác (tên bác sĩ, bệnh viện, ngày tháng).
            4. Chỉ trả về duy nhất khối JSON.
            """
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"VĂN BẢN THÔ:\n{text}")
            ]
            
            try:
                # Call LLM directly (using the initialized model)
                max_retries = 2
                response = None
                for attempt in range(max_retries):
                    try:
                        response = await self.llm.ainvoke(messages)
                        break
                    except Exception as e:
                        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                            if attempt < max_retries - 1:
                                logger.warning(f"AI Quota exceeded, retrying in 3s... (Attempt {attempt+1})")
                                await asyncio.sleep(3)
                                continue
                        raise e
                
                if not response:
                    raise Exception("Mô hình AI đang bận hoặc hết hạn mức.")
            except Exception as ai_err:
                logger.error(f"Gemini API call failed: {ai_err}")
                raise Exception(f"Lỗi khi gọi AI: {str(ai_err)}")

            raw_content = response.content
            
            # Handle case where content is a list (multi-part response)
            if isinstance(raw_content, list):
                raw_content = "".join([str(part.get("text", part)) if isinstance(part, dict) else str(part) for part in raw_content])
            
            # More robust JSON cleaning
            cleaned_content = str(raw_content).strip()
            if "```json" in cleaned_content:
                cleaned_content = cleaned_content.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned_content:
                cleaned_content = cleaned_content.split("```")[1].strip()
            
            # Remove any trailing commas or leading/trailing non-JSON characters
            if cleaned_content.startswith("[") or cleaned_content.startswith("{"):
                pass # Already looks like JSON
            else:
                # Try to find the first '{' and last '}'
                start = cleaned_content.find("{")
                end = cleaned_content.rfind("}")
                if start != -1 and end != -1:
                    cleaned_content = cleaned_content[start:end+1]

            try:
                data = json.loads(cleaned_content)
            except Exception as json_err:
                logger.error(f"Failed to parse AI JSON. Original: {raw_content}. Cleaned: {cleaned_content}")
                # Fallback: if it's just a list of lines, we can try to wrap it
                raise Exception(f"AI trả về định dạng không hợp lệ. Vui lòng thử lại.")
            medicines = data.get("medicines", [])
            
            try:
                # Map each extracted medicine to products in DB
                results = []
                for med in medicines:
                    name = med.get("name")
                    if not name: continue
                    
                    # Find top 3 candidates for each medicine to give users choices
                    candidates = await self._find_top_matches(name, limit=3)
                    logger.info(f"Found {len(candidates)} candidates for {name}")
                    
                    results.append({
                        "original_name": name,
                        "dosage": med.get("dosage"),
                        "quantity": med.get("quantity"),
                        "unit": med.get("unit"),
                        "suggested_products": candidates
                    })
                
                return {
                    "extracted_medicines": results,
                    "raw_text_length": len(text)
                }
            except Exception as db_err:
                logger.error(f"Database search failed: {db_err}")
                raise Exception(f"Lỗi truy vấn sản phẩm: {str(db_err)}")
        except Exception as e:
            logger.error(f"Error extracting medicines from text: {e}")
            raise e

    async def _find_top_matches(self, query: str, limit: int = 3) -> List[Dict]:
        db = SessionLocal()
        try:
            # Simple keyword overlap search
            keywords = [k for k in query.split() if len(k) >= 3]
            if not keywords: return []
            
            filters = []
            for k in keywords:
                filters.append(or_(
                    ProductSymptom.name.ilike(f"%{k}%"),
                    ProductSymptom.content.ilike(f"%{k}%")
                ))
            
            candidates = db.query(ProductSymptom).filter(or_(*filters)).all()
            
            if not candidates: return []
            
            # Scoring
            scored = []
            query_lower = query.lower()
            for p in candidates:
                score = 0
                name_lower = p.name.lower()
                if query_lower in name_lower or name_lower in query_lower:
                    score += 20
                
                for k in keywords:
                    if k.lower() in name_lower:
                        score += 5
                
                # Get basic product details (price, image) from external product-service would be ideal,
                # but we'll return IDs and basic info stored in ProductSymptom first.
                scored.append({
                    "id": p.id,
                    "name": p.name,
                    "score": score
                })
            
            scored.sort(key=lambda x: x["score"], reverse=True)
            return scored[:limit]
        finally:
            db.close()

prescription_ocr_service = PrescriptionOCRService()
