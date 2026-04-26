import json
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
Bạn là "Dược sĩ số MedCare" - một chuyên gia y tế ảo Thận trọng, Đồng cảm và Chính xác.

NHIỆM VỤ:
1. Tư vấn sức khỏe và thuốc dựa trên triệu chứng người dùng mô tả.
2. Sử dụng THÔNG TIN NGỮ CẢNH (Context) được cung cấp từ cơ sở dữ liệu thuốc của MedCare để đưa ra gợi ý chính xác.
3. KIỂM TRA DỊ ỨNG: Nếu trong thông tin người dùng có ghi chú về dị ứng hoặc bệnh lý nền, bạn TUYỆT ĐỐI không gợi ý các loại thuốc có thành phần gây dị ứng đó.
4. Nếu triệu chứng có dấu hiệu CẤP CỨU (đau ngực dữ dội, khó thở, co giật, mất ý thức...), bạn PHẢI trả lời ngay lập tức: "Đây có vẻ là dấu hiệu cấp cứu, bạn hãy gọi 115 hoặc đến bệnh viện gần nhất ngay lập tức!"

QUY TẮC TƯ VẤN THUỐC:
- CHỈ gợi ý mua các loại thuốc không kê đơn (OTC) hoặc thực phẩm chức năng phù hợp.
- Với thuốc KÊ ĐƠN (Prescription), bạn chỉ được cung cấp thông tin và PHẢI nhắc nhở: "Sản phẩm này cần có chỉ định và đơn thuốc từ bác sĩ chuyên khoa."
- Nếu không có dữ liệu Context phù hợp (hoặc hệ thống đang cập nhật), bạn CÓ THỂ gợi ý các hoạt chất/thuốc thông dụng dựa trên kiến thức y khoa, nhưng phải nhắc nhở người dùng tham khảo thêm ý kiến chuyên gia.
- BẮT BUỘC TRÍCH XUẤT ID: Trong NGỮ CẢNH luôn có trường "ID: ...". Bạn PHẢI lấy đúng số ID này cho `list_product_ids`. Tuyệt đối không dùng `id: 0` nếu sản phẩm đó có xuất hiện trong NGỮ CẢNH.
- Nếu thuốc gợi ý KHÔNG có trong NGỮ CẢNH, hãy để `id` là `0` và KHÔNG thêm vào `list_product_ids`.

QUY TẮC ỨNG XỬ:
- Thân thiện, lễ phép (Dùng xưng hô: Anh/Chị/Bạn).
- TỪ CHỐI trả lời các câu hỏi ngoài phạm vi y tế (chính trị, tôn giáo, giải trí, v.v.).

ĐỊNH DẠNG PHẢN HỒI (QUAN TRỌNG):
Bạn phải luôn trả lời theo cấu trúc:
[Nội dung câu trả lời tự nhiên] ||| {"detected_symptoms": [...], "suggested_medicines": [{"id": ID_SO, "name": "TEN"}], "list_product_ids": [ID1, ID2]}

Lưu ý: Dấu phân cách "|||" là bắt buộc để hệ thống tách biệt phần văn bản và phần dữ liệu.
"""

class ChatService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-flash-latest",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.3,
            convert_system_message_to_human=True
        )
        self.user_service_url = "http://localhost:8081" # Direct to user-service

    async def _get_user_info(self, user_id: int) -> str:
        if not user_id: return ""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.user_service_url}/api/users/profiles/{user_id}", timeout=5.0)
                if response.status_code == 200:
                    user = response.json()
                    # Extract relevant health info
                    info = f"Người dùng: {user.get('fullName', 'Khách')}\n"
                    if user.get('medicalHistory'):
                        info += f"Tiền sử bệnh lý: {user.get('medicalHistory')}\n"
                    if user.get('allergies'):
                        info += f"Dị ứng: {user.get('allergies')}\n"
                    return info
            return ""
        except Exception as e:
            logger.warning(f"Failed to fetch user info: {e}")
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
            # 0. User Info (Allergies, Medical History)
            user_info = await self._get_user_info(user_id)
            
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
            final_user_input = f"THÔNG TIN NGƯỜI DÙNG:\n{user_info}\n\nNGỮ CẢNH DỮ LIỆU THUỐC MEDCARE:\n{context_text}\n\nCÂU HỎI NGƯỜI DÙNG: {user_message}"
            messages.append(HumanMessage(content=final_user_input))

            # 3. Call LLM
            response = await self.llm.ainvoke(messages)
            
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
                    metadata = {"detected_symptoms": [], "suggested_medicines": [], "list_product_ids": []}
                
                result = {
                    "answer": answer,
                    "detected_symptoms": metadata.get("detected_symptoms", []),
                    "suggested_medicines": metadata.get("suggested_medicines", []),
                    "list_product_ids": metadata.get("list_product_ids", [])
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

            relevant_products = await self._search_relevant_products(user_message)
            if not relevant_products:
                context_text = "[LƯU Ý: Dữ liệu thuốc MedCare đang trống hoặc đang cập nhật. Vui lòng tư vấn dựa trên kiến thức y khoa chung của bạn và nhắc nhở người dùng hỏi ý kiến bác sĩ.]"
            else:
                context_text = "\n\n".join([p.content for p in relevant_products])
            
            messages = [SystemMessage(content=SYSTEM_PROMPT)]
            history = self._get_history(session_id)
            messages.extend(history)
            
            final_user_input = f"THÔNG TIN NGƯỜI DÙNG:\n{user_info}\n\nNGỮ CẢNH DỮ LIỆU THUỐC MEDCARE:\n{context_text}\n\nCÂU HỎI NGƯỜI DÙNG: {user_message}"
            messages.append(HumanMessage(content=final_user_input))

            full_content = ""
            stop_yielding = False
            async for chunk in self.llm.astream(messages):
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
                        # Yield only the part before "|||" from the current chunk
                        start_idx = combined_temp.find("|||")
                        to_yield = combined_temp[len(full_content):start_idx]
                        if to_yield:
                            yield to_yield
                    else:
                        yield content
                
                full_content += content

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
                    ProductSymptom.symptoms.ilike(f"%{query}%")
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
            
            # Fetch all matching candidates
            candidates = db.query(ProductSymptom).filter(or_(*search_filters)).all()
            
            # Score candidates by relevance
            def calculate_relevance(p: ProductSymptom):
                score = 0
                name_lower = p.name.lower()
                symptoms_lower = (p.symptoms or "").lower()
                for k in search_keywords:
                    k_lower = k.lower()
                    if k_lower in name_lower:
                        score += 10 # High weight for name match
                    if k_lower in symptoms_lower:
                        score += 2  # Medium weight for symptom match
                return score

            candidates.sort(key=calculate_relevance, reverse=True)
            return candidates[:limit]
        except Exception as e:
            logger.error(f"Database search failed: {e}")
            return []
        finally:
            db.close()

chat_service = ChatService()
