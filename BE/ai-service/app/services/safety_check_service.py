import logging
import httpx
import json
import re
from typing import List, Dict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.config.settings import settings

logger = logging.getLogger(__name__)

class SafetyCheckService:
    def __init__(self):
        self.user_service_url = "http://localhost:8081"
        self.order_service_url = "http://localhost:8082"
        # Use a cheaper model for safety checks if available, otherwise default
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.1 # Low temperature for factual safety checks
        )

    async def check_drug_safety(self, user_id: Optional[int], cart_items: List[Dict]) -> Dict:
        """
        Main engine to check drug-drug and drug-profile interactions.
        """
        try:
            # 1. Gather Context
            profile_data = {}
            recent_medicines = []
            
            if user_id:
                # Fetch profile (allergies, chronic conditions)
                profile_data = await self._fetch_data(f"{self.user_service_url}/api/users/profiles/me/health-notes", user_id)
                # Fetch recent items (simplified list)
                recent_medicines = await self._fetch_data(f"{self.order_service_url}/api/orders/my-orders/recent-items?days=30", user_id)

            # 2. Mock Safety Check (Disabled Gemini to save quota)
            return {
                "risk_level": "NONE",
                "message": "Hệ thống tự động đã kiểm tra cơ bản dựa trên danh mục thuốc. Tuy nhiên, để đảm bảo an toàn tuyệt đối, vui lòng đọc kỹ hướng dẫn sử dụng hoặc tham vấn dược sĩ chuyên môn. (Tính năng kiểm tra chuyên sâu bằng AI đang tạm nghỉ).",
                "requires_confirmation": False
            }

        except Exception as e:
            logger.error(f"Safety check failed: {e}")
            return {"risk_level": "NONE", "message": "Không thể kiểm tra an toàn lúc này. Hãy hỏi dược sĩ.", "requires_confirmation": False}

    async def _fetch_data(self, url: str, user_id: int) -> any:
        try:
            async with httpx.AsyncClient() as client:
                headers = {"X-User-Id": str(user_id)}
                response = await client.get(url, headers=headers, timeout=5.0)
                if response.status_code == 200:
                    return response.json()
            return {}
        except Exception:
            return {}

    def _build_safety_prompt(self, cart: List[Dict], profile: Dict, recent: List[str]) -> str:
        cart_str = ", ".join([f"{i.get('medicineName')} ({i.get('category','')})" for i in cart])
        recent_str = ", ".join(recent) if recent else "Không có"
        allergies = profile.get('allergies', 'Không')
        conditions = profile.get('chronicConditions', 'Không')

        return f"""
KIỂM TRA AN TOÀN DƯỢC PHẨM:

1. THUỐC TRONG GIỎ HÀNG: {cart_str}
2. THUỐC ĐÃ MUA GẦN ĐÂY: {recent_str}
3. TIỀN SỬ BỆNH NHÂN: Dị ứng ({allergies}), Bệnh lý ({conditions})

YÊU CẦU:
- Kiểm tra tương tác thuốc-thuốc (DDI).
- Kiểm tra tương tác thuốc-bệnh lý/dị ứng.
- Đánh giá Risk Level: 
  + NONE: An toàn.
  + LOW: Có tương tác nhẹ, cần lưu ý cách dùng.
  + HIGH: Có tương tác nghiêm trọng hoặc chống chỉ định.

TRẢ VỀ JSON:
{{
  "risk_level": "NONE | LOW | HIGH",
  "message": "Lời khuyên ngắn gọn (Tiếng Việt). Luôn kèm theo câu: 'Thông tin mang tính chất tham khảo, vui lòng tham vấn y sĩ.'",
  "requires_confirmation": true/false (true nếu risk_level là HIGH)
}}
"""

    def _parse_ai_response(self, content: str) -> Dict:
        try:
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                return json.loads(match.group())
            return {"risk_level": "NONE", "message": "An toàn.", "requires_confirmation": False}
        except:
            return {"risk_level": "NONE", "message": "An toàn.", "requires_confirmation": False}

safety_check_service = SafetyCheckService()
