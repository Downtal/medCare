import json
import asyncio
import logging
import httpx
from typing import List, Dict
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from app.config.settings import settings
from app.models.chat_log import SessionLocal, ChatbotLog
from app.models.product_symptom import ProductSymptom
from sqlalchemy import or_

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
Bạn là "Dược sĩ số MedCare" - Trợ lý sức khỏe ảo tận tâm, thấu hiểu và chính xác. 

PHONG CÁCH GIAO TIẾP:
- Ngôn ngữ: Ấm áp, quan tâm, chuyên nghiệp (VD: "MedCare rất hiểu sự lo lắng của bạn...", "Dựa trên hồ sơ của ông/bà...").
- Xưng hô: Linh hoạt theo độ tuổi/giới tính trong hồ sơ người dùng (Ông/Bà cho người lớn tuổi, Anh/Chị/Bạn cho người trẻ).

NHIỆM VỤ:
1. Tư vấn sức khỏe và thuốc dựa trên triệu chứng và HỒ SƠ NGƯỜI DÙNG (Giới tính, Tuổi, Dị ứng, Bệnh lý).
2. KIỂM TRA AN TOÀN: Tuyệt đối không gợi ý thuốc chứa thành phần người dùng bị dị ứng.
3. CẢNH BÁO CẤP CỨU: Phải ưu tiên cảnh báo ngay nếu phát hiện triệu chứng nguy kịch (đau ngực, khó thở...).
4. GIỚI HẠN TƯ VẤN: 
   - Tuyệt đối KHÔNG đưa ra chẩn đoán bệnh thay bác sĩ (VD: Đừng nói "Bạn đã bị viêm phổi", hãy nói "Các triệu chứng này có thể liên quan đến vấn đề hô hấp...").
   - Nhắc nhở về đơn thuốc đối với các loại thuốc kê đơn.

QUY TẮC PHẢN HỒI (BẮT BUỘC):
- Mỗi câu trả lời tư vấn thuốc/sức khỏe PHẢI kết thúc bằng câu: "Lưu ý: Thông tin trên chỉ mang tính chất tham khảo. Bạn vui lòng tham khảo ý kiến bác sĩ hoặc dược sĩ chuyên môn trước khi sử dụng."
- Trích xuất đúng ID sản phẩm từ NGỮ CẢNH cung cấp.

ĐỊNH DẠNG PHẢN HỒI:
[Nội dung câu trả lời tự nhiên] ||| {"detected_symptoms": [...], "suggested_medicines": [{"id": ID_SO, "name": "TEN"}], "list_product_ids": [ID1, ID2], "quick_actions": ["Action 1", "Action 2"]}
"""

class ChatService:
    def __init__(self):
        # Prioritize Key 2 to bypass exhausted quota on Key 1
        api_key = settings.GEMINI_API_KEY_2 if settings.GEMINI_API_KEY_2 else settings.GEMINI_API_KEY
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-lite",
            google_api_key=api_key,
            temperature=0.3,
            convert_system_message_to_human=True
        )
        self.user_service_url = "http://localhost:8081" # Direct to user-service
        self.order_service_url = "http://localhost:8082" # Direct to order-service

    async def _get_user_info(self, user_id: int) -> str:
        if not user_id: return ""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.user_service_url}/api/users/profiles/{user_id}", timeout=5.0)
                if response.status_code == 200:
                    user = response.json()
                    # Extract relevant health info
                    fullName = user.get('fullName', 'Khách')
                    gender = user.get('gender', 'N/A')
                    dob = user.get('dateOfBirth', 'N/A')
                    
                    info = f"Người dùng: {fullName} | Giới tính: {gender} | Ngày sinh: {dob}\n"
                    
                    health_note = user.get('healthNote')
                    if health_note:
                        if health_note.get('allergies'):
                            info += f"DỊ ỨNG: {health_note.get('allergies')}\n"
                        if health_note.get('chronicConditions'):
                            info += f"Bệnh mãn tính: {health_note.get('chronicConditions')}\n"
                        if health_note.get('specialStatus'):
                            info += f"Trạng thái đặc biệt (Thai kỳ/Cho con bú): {health_note.get('specialStatus')}\n"
                    
                    # Legacy support if still using medicalHistory field
                    if user.get('medicalHistory'):
                        info += f"Tiền sử bệnh lý: {user.get('medicalHistory')}\n"
                        
                    return info
            return ""
        except Exception as e:
            logger.warning(f"Failed to fetch user info: {e}")
            return ""

    async def _get_order_history(self, user_id: int) -> str:
        if not user_id: return ""
        try:
            async with httpx.AsyncClient() as client:
                # Order service headers needs to pass X-User-Id
                headers = {"X-User-Id": str(user_id)}
                response = await client.get(f"{self.order_service_url}/api/orders/my-orders", headers=headers, timeout=5.0)
                if response.status_code == 200:
                    orders = response.json()
                    if not orders: return "Chưa có lịch sử mua hàng."
                    
                    history = "LỊCH SỬ MUA HÀNG GẦN ĐÂY:\n"
                    # Get last 3 orders for context
                    for order in orders[:3]:
                        items = ", ".join([item.get('medicineName', 'Sản phẩm') for item in order.get('items', [])])
                        history += f"- Đơn hàng {order.get('orderCode')} ({order.get('status')}): {items}\n"
                    return history
            return ""
        except Exception as e:
            logger.warning(f"Failed to fetch order history: {e}")
            return ""
    def _get_history(self, session_id: str, limit: int = 5) -> List:
        db = SessionLocal()
        try:
            logs = db.query(ChatbotLog).filter(ChatbotLog.session_id == session_id)\
                     .order_by(ChatbotLog.created_at.desc()).limit(limit).all()
            
            messages = []
            # Reverse to get chronological order
            for log in reversed(logs):
                messages.append(HumanMessage(content=log.user_message))
                messages.append(AIMessage(content=log.bot_response))
            return messages
        finally:
            db.close()

    async def get_chat_response(self, user_message: str, session_id: str, user_id: int = None):
        try:
            # 0. User Info & History
            user_info = await self._get_user_info(user_id)
            order_history = await self._get_order_history(user_id)
            
            # 1. Retrieval: Search for relevant products in local DB
            relevant_products = await self._search_relevant_products(user_message)
            if not relevant_products:
                context_text = "[LƯU Ý: Dữ liệu thuốc MedCare đang trống hoặc đang cập nhật. Vui lòng tư vấn dựa trên kiến thức y khoa chung của bạn và nhắc nhở người dùng hỏi ý kiến bác sĩ.]"
            else:
                context_text = "\n\n".join([p.content for p in relevant_products])
            
            # 2. Prepare Messages
            messages = [SystemMessage(content=SYSTEM_PROMPT)]
            
            # Add History
            history = self._get_history(session_id)
            messages.extend(history)
            
            # Add Context and User Message
            final_user_input = f"THÔNG TIN NGƯỜI DÙNG:\n{user_info}\n{order_history}\n\nNGỮ CẢNH DỮ LIỆU THUỐC MEDCARE:\n{context_text}\n\nCÂU HỎI NGƯỜI DÙNG: {user_message}"
            messages.append(HumanMessage(content=final_user_input))

            # 3. Call LLM
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
            
            # 4. Parse Response with Delimiter
            try:
                full_content = response.content
                if isinstance(full_content, dict):
                    full_content = full_content.get("text", "")
                elif isinstance(full_content, list):
                    full_content = "".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in full_content])
                full_content = str(full_content).strip()

                if "|||" in full_content:
                    parts = full_content.split("|||")
                    answer = parts[0].strip()
                    json_part = parts[1].strip()
                    metadata = json.loads(json_part)
                else:
                    answer = full_content
                    metadata = {"detected_symptoms": [], "suggested_medicines": [], "list_product_ids": [], "quick_actions": []}
                
                result = {
                    "answer": answer,
                    "detected_symptoms": metadata.get("detected_symptoms", []),
                    "suggested_medicines": metadata.get("suggested_medicines", []),
                    "list_product_ids": metadata.get("list_product_ids", []),
                    "quick_actions": metadata.get("quick_actions", [])
                }
            except Exception as e:
                logger.error(f"Failed to parse AI response: {e}. Raw content: {response.content}")
                result = {
                    "answer": str(response.content),
                    "detected_symptoms": [],
                    "suggested_medicines": [],
                    "list_product_ids": []
                }

            # 5. Save to Database
            log_id = self._save_log(user_id, session_id, user_message, result)
            result["log_id"] = log_id

            return result

        except Exception as e:
            logger.error(f"Error in ChatService: {e}")
            return {
                "answer": "Xin lỗi, tôi đang gặp một chút vấn đề kỹ thuật. Bạn vui lòng thử lại sau giây lát nhé.",
                "detected_symptoms": [],
                "suggested_medicines": [],
                "list_product_ids": []
            }

    async def stream_chat_response(self, user_message: str, session_id: str, user_id: int = None):
        """
        Streaming version of chat response.
        Yields chunks of text. Final chunk will be the JSON metadata.
        """
        try:
            # 0. User Info
            user_info = await self._get_user_info(user_id)
            order_history = await self._get_order_history(user_id)

            relevant_products = await self._search_relevant_products(user_message)
            if not relevant_products:
                context_text = "[LƯU Ý: Dữ liệu thuốc MedCare đang trống hoặc đang cập nhật. Vui lòng tư vấn dựa trên kiến thức y khoa chung của bạn và nhắc nhở người dùng hỏi ý kiến bác sĩ.]"
            else:
                context_text = "\n\n".join([p.content for p in relevant_products])
            
            messages = [SystemMessage(content=SYSTEM_PROMPT)]
            history = self._get_history(session_id)
            messages.extend(history)
            
            final_user_input = f"THÔNG TIN NGƯỜI DÙNG:\n{user_info}\n{order_history}\n\nNGỮ CẢNH DỮ LIỆU THUỐC MEDCARE:\n{context_text}\n\nCÂU HỎI NGƯỜI DÙNG: {user_message}"
            messages.append(HumanMessage(content=final_user_input))

            full_content = ""
            stop_yielding = False
            # 3. Call LLM
            stream_success = False
            try:
                # Try to get the stream
                async for chunk in self.llm.astream(messages):
                    stream_success = True # We got at least one chunk
                    content = chunk.content
                    if isinstance(content, dict):
                        content = content.get("text", "")
                    elif isinstance(content, list):
                        content = "".join([c.get("text", "") if isinstance(c, dict) else str(c) for c in content])
                    
                    content = str(content)
                    
                    if not stop_yielding:
                        combined_temp = full_content + content
                        if "|||" in combined_temp:
                            stop_yielding = True
                            start_idx = combined_temp.find("|||")
                            to_yield = combined_temp[len(full_content):start_idx]
                            if to_yield:
                                yield to_yield
                        else:
                            yield content
                    
                    full_content += content
                
            except Exception as e:
                if not stream_success:
                    logger.error(f"Streaming error: {e}")
                    raise e
                else:
                    # If we already started yielding, we can't easily fallback mid-stream
                    logger.error(f"Error during streaming: {e}")
                    raise e
            
            if not stream_success:
                raise Exception("Mô hình AI đang bận hoặc hết hạn mức.")

            # Post-processing after stream ends
            try:
                if "|||" in full_content:
                    parts = full_content.split("|||")
                    answer = parts[0].strip()
                    json_part = parts[1].strip()
                    result = json.loads(json_part)
                    result["answer"] = answer
                else:
                    result = {"answer": full_content, "detected_symptoms": [], "suggested_medicines": [], "list_product_ids": []}
            except:
                result = {"answer": full_content, "detected_symptoms": [], "suggested_medicines": [], "list_product_ids": []}
            
            # Send final metadata chunk with delimiter for frontend hook
            metadata_payload = {
                "detected_symptoms": result.get("detected_symptoms", []),
                "list_product_ids": result.get("list_product_ids", []),
                "quick_actions": result.get("quick_actions", []),
                "log_id": 0 # Will be updated below
            }
            
            # Save to DB
            log_id = self._save_log(user_id, session_id, user_message, result)
            metadata_payload["log_id"] = log_id
            
            yield f"|||{json.dumps(metadata_payload)}"

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield "Xin lỗi, tôi đang gặp vấn đề kỹ thuật."

    def submit_feedback(self, log_id: int, rating: bool, reason: str = None):
        db = SessionLocal()
        try:
            log = db.query(ChatbotLog).filter(ChatbotLog.id == log_id).first()
            if log:
                log.rating = rating
                log.feedback_reason = reason
                db.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to submit feedback: {e}")
            return False
        finally:
            db.close()

    def _save_log(self, user_id, session_id, user_message, result):
        db = SessionLocal()
        try:
            log = ChatbotLog(
                user_id=user_id,
                session_id=session_id,
                user_message=user_message,
                bot_response=result.get("answer", ""),
                detected_symptoms=result.get("detected_symptoms", []),
                suggested_medicines=result.get("suggested_medicines", [])
            )
            db.add(log)
            db.commit()
            db.refresh(log)
            return log.id
        except Exception as e:
            logger.error(f"Failed to save chat log: {e}")
            return None
        finally:
            db.close()

    async def _search_relevant_products(self, query: str, limit: int = 5) -> List[ProductSymptom]:
        """
        Search for relevant products using phrase and keyword matching.
        """
        db = SessionLocal()
        try:
            # 1. Try exact phrase match first (case-insensitive)
            phrase_results = db.query(ProductSymptom).filter(
                or_(
                    ProductSymptom.name.ilike(f"%{query}%"),
                    ProductSymptom.symptoms.ilike(f"%{query}%"),
                    ProductSymptom.content.ilike(f"%{query}%")
                )
            ).limit(limit).all()
            
            if phrase_results:
                return phrase_results
            
            # 2. Fallback to keyword matching
            keywords = [k for k in query.split() if len(k) >= 2]
            # Simple stop words filter
            stop_words = {"cho", "của", "cần", "với", "bán", "không", "có", "shop"}
            filtered_keywords = [k for k in keywords if k.lower() not in stop_words]
            
            search_keywords = filtered_keywords if filtered_keywords else keywords
            if not search_keywords:
                return db.query(ProductSymptom).limit(limit).all()

            search_filters = []
            for k in search_keywords:
                search_filters.append(ProductSymptom.name.ilike(f"%{k}%"))
                search_filters.append(ProductSymptom.symptoms.ilike(f"%{k}%"))
                search_filters.append(ProductSymptom.content.ilike(f"%{k}%"))
            
            # Fetch all matching candidates
            candidates = db.query(ProductSymptom).filter(or_(*search_filters)).all()
            
            # Score candidates by relevance
            def calculate_relevance(p: ProductSymptom):
                score = 0
                name_lower = p.name.lower()
                symptoms_lower = (p.symptoms or "").lower()
                content_lower = p.content.lower()
                for k in search_keywords:
                    k_lower = k.lower()
                    if k_lower in name_lower:
                        score += 10 # High weight for name match
                    if k_lower in symptoms_lower:
                        score += 5  # Medium weight for symptom match
                    if k_lower in content_lower:
                        score += 1  # Low weight for content match
                return score

            candidates.sort(key=calculate_relevance, reverse=True)
            return candidates[:limit]
        except Exception as e:
            logger.error(f"Database search failed: {e}")
            return []
        finally:
            db.close()

chat_service = ChatService()
