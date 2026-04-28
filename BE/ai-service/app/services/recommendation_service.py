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

            # 1. Base suggestions (Rule-based)
            suggestions = await self._get_rule_based_suggestions(user_profile)
            
            # 2. History-based suggestions
            history_suggestions = await self._get_history_based_suggestions(order_history)
            
            # Combine and unique
            all_medicine_ids = list(dict.fromkeys(suggestions + history_suggestions))
            
            # 3. Wildcard Rule: Add 20% trending/new products
            trending_ids = await self._get_trending_products(limit=3)
            all_medicine_ids.extend([tid for tid in trending_ids if tid not in all_medicine_ids])
            
            # 4. Fetch full product details
            products = await self._fetch_products_by_ids(all_medicine_ids[:limit])
            
            # 5. Safety Filter: Check against allergies
            health_note = user_profile.get('healthNote')
            if user_id and health_note and isinstance(health_note, dict):
                allergies = health_note.get('allergies')
                if allergies:
                    products = [p for p in products if not self._is_allergic(p, allergies.lower())]

            return products
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

    async def _get_rule_based_suggestions(self, profile: Dict) -> List[int]:
        """
        Simple rule-based mapping for Cold Start.
        """
        gender = (profile.get('gender') or "").upper()
        # Calculate age if DOB exists
        age = 25 # Default
        dob = profile.get('dateOfBirth')
        if dob:
            try:
                from datetime import datetime
                birth_year = datetime.strptime(dob, "%Y-%m-%d").year
                age = datetime.now().year - birth_year
            except: pass

        # Mapping (Placeholder IDs - in real app, these would be category/product IDs)
        # Note: In our current SQL, we don't have many products, so we'll return a mix
        if gender == "MALE":
            if age < 30: return [1, 5, 10] # Gym, Vitamin, Energy
            return [2, 6, 11] # Heart, Joints
        elif gender == "FEMALE":
            if age < 30: return [3, 7, 12] # Beauty, Skincare
            return [4, 8, 13] # Bone health, Menopause
        
        return [1, 2, 3] # Default

    async def _get_history_based_suggestions(self, history: List[Dict]) -> List[int]:
        if not history: return []
        ids = []
        for order in history[:5]:
            for item in order.get('items', []):
                ids.append(item.get('medicineId'))
        return ids

    async def _get_trending_products(self, limit: int = 5) -> List[int]:
        # Placeholder: Return some IDs
        return [1, 2, 3, 4, 5]

    async def _fetch_products_by_ids(self, ids: List[int]) -> List[Dict]:
        if not ids: return []
        try:
            async with httpx.AsyncClient() as client:
                # Correcting path from /api/medicines to /api/products
                response = await client.get(f"{self.product_service_url}/api/products", timeout=5.0)
                if response.status_code == 200:
                    all_prods = response.json()
                    # If it's a PageResponse, it might be in 'content'
                    if isinstance(all_prods, dict) and 'content' in all_prods:
                        all_prods = all_prods['content']
                    
                    if not isinstance(all_prods, list):
                        return []
                        
                    return [p for p in all_prods if p and isinstance(p, dict) and p.get('id') in ids]
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
