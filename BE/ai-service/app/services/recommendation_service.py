import logging
import httpx
import random
from typing import List, Dict
from app.services.chat_service import chat_service

logger = logging.getLogger(__name__)

class RecommendationService:
    def __init__(self):
        self.user_service_url = "http://localhost:8081"
        self.order_service_url = "http://localhost:8082"
        self.product_service_url = "http://localhost:8083"

    async def get_personalized_recommendations(self, user_id: int = None, limit: int = 8) -> List[Dict]:
        """
        Hybrid recommendation:
        - If logged in: Use profile (age, gender) + History.
        - If guest: Use general trending.
        """
        try:
            user_profile = {}
            order_history = []
            
            if user_id:
                try:
                    import asyncio
                    profile_task = self._get_user_profile(user_id)
                    history_task = self._get_user_order_history(user_id)
                    results = await asyncio.gather(profile_task, history_task)
                    user_profile = results[0] if results[0] is not None else {}
                    order_history = results[1] if results[1] is not None else []
                except Exception as e:
                    logger.warning(f"Failed to gather user info: {e}")

            # Fetch ALL active products once to avoid multiple calls
            all_products = await self._fetch_all_products()
            if not all_products:
                return []

            # 1. Base suggestions (Keywords based on profile)
            keywords = self._get_profile_keywords(user_profile)
            rule_based_prods = self._filter_by_keywords(all_products, keywords)
            
            # 2. History-based suggestions
            history_ids = self._get_history_ids(order_history)
            history_prods = [p for p in all_products if p.get('id') in history_ids]
            
            # Combine results
            combined = []
            seen_ids = set()

            # Add history first (highly relevant)
            for p in history_prods:
                if p.get('id') not in seen_ids:
                    combined.append(p)
                    seen_ids.add(p.get('id'))
            
            # Add rule-based (profile match)
            for p in rule_based_prods:
                if p.get('id') not in seen_ids:
                    combined.append(p)
                    seen_ids.add(p.get('id'))

            # 3. Fill with random active products if not enough
            remaining = limit - len(combined)
            if remaining > 0:
                others = [p for p in all_products if p.get('id') not in seen_ids]
                random.shuffle(others)
                combined.extend(others[:remaining])

            # 4. Safety Filter: Check against allergies
            health_note = user_profile.get('healthNote')
            if user_id and health_note and isinstance(health_note, str):
                allergies = health_note.lower()
                combined = [p for p in combined if not self._is_allergic(p, allergies)]

            return combined[:limit]
        except Exception as e:
            logger.error(f"Recommendation failed: {e}")
            return []

    async def _get_user_profile(self, user_id: int) -> Dict:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.user_service_url}/api/users/profiles/{user_id}", timeout=2.0)
                if response.status_code == 200:
                    return response.json()
            return {}
        except:
            return {}

    async def _get_user_order_history(self, user_id: int) -> List[Dict]:
        try:
            async with httpx.AsyncClient() as client:
                headers = {"X-User-Id": str(user_id)}
                response = await client.get(f"{self.order_service_url}/api/orders/my-orders", headers=headers, timeout=2.0)
                if response.status_code == 200:
                    return response.json()
            return []
        except:
            return []

    def _get_profile_keywords(self, profile: Dict) -> List[str]:
        """
        Map profile to descriptive keywords.
        """
        gender = (profile.get('gender') or "").upper()
        # Calculate age
        age = 25
        dob = profile.get('dateOfBirth')
        if dob:
            try:
                from datetime import datetime
                birth_year = datetime.strptime(dob, "%Y-%m-%d").year
                age = datetime.now().year - birth_year
            except: pass

        keywords = []
        if gender == "MALE":
            keywords.extend(["nam", "phái mạnh", "sinh lý nam", "cơ bắp", "thể thao"])
            if age > 45:
                keywords.extend(["tim mạch", "huyết áp", "tiểu đường", "xương khớp"])
            else:
                keywords.extend(["vitamin", "tăng cường", "năng lượng"])
        elif gender == "FEMALE":
            keywords.extend(["nữ", "phái đẹp", "làm đẹp", "chăm sóc da", "nội tiết"])
            if age > 45:
                keywords.extend(["xương khớp", "loãng xương", "tiền mãn kinh", "chống lão hóa"])
            else:
                keywords.extend(["skincare", "collagen", "vitamin e", "giảm cân"])
        else:
            # Default for undefined profile
            keywords.extend(["vitamin", "đề kháng", "sức khỏe", "phổ biến"])

        return keywords

    def _filter_by_keywords(self, products: List[Dict], keywords: List[str]) -> List[Dict]:
        matched = []
        for p in products:
            content = f"{p.get('name', '')} {p.get('categoryName', '')} {p.get('description', '')}".lower()
            score = 0
            for kw in keywords:
                if kw.lower() in content:
                    score += 1
            if score > 0:
                p['_score'] = score
                matched.append(p)
        
        # Sort by score descending
        matched.sort(key=lambda x: x.get('_score', 0), reverse=True)
        return matched

    def _get_history_ids(self, history: List[Dict]) -> List[int]:
        ids = []
        for order in history[:5]:
            for item in order.get('items', []):
                mid = item.get('medicineId')
                if mid: ids.append(mid)
        return list(set(ids))

    async def _fetch_all_products(self) -> List[Dict]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.product_service_url}/api/products", timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, dict) and 'content' in data:
                        return data['content']
                    return data if isinstance(data, list) else []
            return []
        except Exception as e:
            logger.error(f"Failed to fetch products: {e}")
            return []

    def _is_allergic(self, product: Dict, allergies: str) -> bool:
        # Simple keyword check in description/ingredients
        content = (product.get('name', '') + " " + product.get('description', '')).lower()
        allergy_list = [a.strip() for a in allergies.split(',')]
        for a in allergy_list:
            if a and a in content:
                return True
        return False

recommendation_service = RecommendationService()
