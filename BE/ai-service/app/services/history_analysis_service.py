import logging
import httpx
from typing import List, Dict, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.config.settings import settings

logger = logging.getLogger(__name__)

class HistoryAnalysisService:
    def __init__(self):
        self.user_service_url = "http://localhost:8081"
        self.order_service_url = "http://localhost:8082"
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.3
        )

    async def analyze_user_health_history(self, user_id: int) -> Dict:
        """
        Analyze medical history (Orders + Health Metrics) and provide habit warnings.
        """
        try:
            # 1. Fetch Data
            user_profile = await self._get_user_data(f"{self.user_service_url}/api/users/profiles/{user_id}")
            health_metrics = await self._get_user_data(f"{self.user_service_url}/api/users/profiles/me/metrics", user_id)
            orders = await self._get_user_data(f"{self.order_service_url}/api/orders/my-orders", user_id)

            if not orders and not health_metrics:
                return {
                    "summary": "Chưa có đủ dữ liệu y tế để phân tích chuyên sâu.",
                    "habit_alerts": [],
                    "health_status": "UNKNOWN"
                }

            # 2. Mock Analysis (Disabled Gemini to save quota)
            fullName = user_profile.get('fullName', 'Người dùng')
            return {
                "summary": f"Xin chào {fullName}, hệ thống ghi nhận bạn đã có lịch sử mua sắm và theo dõi sức khỏe tại MedCare. Để đảm bảo an toàn, hãy luôn tuân thủ liều lượng chỉ định của bác sĩ. Lưu ý: Tính năng phân tích chuyên sâu bằng AI đang tạm nghỉ để bảo trì quota.",
                "habit_alerts": ["Hãy duy trì thói quen kiểm tra sức khỏe định kỳ."],
                "health_status": "STABLE"
            }

        except Exception as e:
            logger.error(f"History analysis failed: {e}")
            return {"error": str(e)}

    async def _get_user_data(self, url: str, user_id: Optional[int] = None) -> List:
        try:
            headers = {"X-User-Id": str(user_id)} if user_id else {}
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=5.0)
                if response.status_code == 200:
                    return response.json()
            return []
        except Exception as e:
            logger.warning(f"Failed to fetch data from {url}: {e}")
            return []

    def _build_analysis_prompt(self, profile: Dict, metrics: List, orders: List) -> str:
        fullName = profile.get('fullName', 'Người dùng')
        gender = profile.get('gender', 'N/A')
        health_note = profile.get('healthNote', {})
        
        # Format metrics
        metrics_str = "\n".join([f"- {m['recordedAt']}: {m['type']} = {m['value']} {m.get('unit','')}" for m in metrics[:10]])
        
        # Format orders
        orders_str = "\n".join([f"- {o['createdAt']}: {', '.join([i['medicineName'] for i in o['items']])}" for o in orders[:10]])

        return f"""
Hãy phân tích dữ liệu sau cho bệnh nhân {fullName} ({gender}):

THÔNG TIN SỨC KHỎE:
- Dị ứng: {health_note.get('allergies', 'Không')}
- Bệnh mãn tính: {health_note.get('chronicConditions', 'Không')}
- Trạng thái đặc biệt: {health_note.get('specialStatus', 'Không')}

CHỈ SỐ SỨC KHỎE GẦN ĐÂY:
{metrics_str if metrics_str else "Không có dữ liệu"}

LỊCH SỬ MUA THUỐC (10 đơn gần nhất):
{orders_str if orders_str else "Không có dữ liệu"}

YÊU CẦU:
1. Tóm tắt tình trạng sức khỏe hiện tại (Summary).
2. Phát hiện các thói quen sử dụng thuốc đáng chú ý (Habit Alerts). Ví dụ: Lạm dụng thuốc giảm đau, mua kháng sinh nhiều lần không rõ lý do, hoặc mua thuốc tương tác với bệnh mãn tính.
3. Đánh giá mức độ rủi ro sức khỏe (Health Status: STABLE, CAUTION, ALERT).

PHẢN HỒI DƯỚI ĐỊNH DẠNG TRẢ VỀ JSON:
{{
  "summary": "Tóm tắt bệnh sử ngắn gọn, chuyên nghiệp. Luôn kết thúc bằng câu: 'Lưu ý: Phân tích này dựa trên dữ liệu mua hàng và chỉ số cá nhân, không thay thế cho chẩn đoán y khoa.'",
  "habit_alerts": ["Cảnh báo 1", "Cảnh báo 2"],
  "health_status": "STABLE | CAUTION | ALERT"
}}
"""

    def _parse_ai_response(self, content: str) -> Dict:
        import json
        import re
        try:
            # Find JSON block
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                return json.loads(match.group())
            return {"summary": content, "habit_alerts": [], "health_status": "UNKNOWN"}
        except:
            return {"summary": content, "habit_alerts": [], "health_status": "UNKNOWN"}

history_analysis_service = HistoryAnalysisService()
