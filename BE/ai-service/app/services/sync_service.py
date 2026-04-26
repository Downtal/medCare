import logging
import httpx
import asyncio
from typing import List, Dict, Any
from app.config.settings import settings
from app.models.chat_log import SessionLocal
from app.models.product_symptom import ProductSymptom

logger = logging.getLogger(__name__)

class SyncService:
    def __init__(self):
        # We can use the gateway or discover the service via Eureka.
        self.product_service_url = "http://localhost:8083" # Direct to product-service
        self.batch_size = 10

    async def _fetch_with_retry(self, url: str, retries: int = 3):
        for i in range(retries):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, timeout=30.0)
                    response.raise_for_status()
                    return response.json()
            except Exception as e:
                wait_time = 2 ** i
                logger.warning(f"Fetch failed (attempt {i+1}/{retries}): {e}. Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
        raise Exception(f"Failed to fetch after {retries} retries")

    async def sync_products(self):
        try:
            logger.info(f"Fetching products from: {self.product_service_url}/api/products/all")
            products = await self._fetch_with_retry(f"{self.product_service_url}/api/products/all")
            
            logger.info(f"Raw products received: {type(products)} - Length: {len(products) if isinstance(products, list) else 'Not a list'}")
            
            if not isinstance(products, list):
                logger.error(f"Expected a list of products, but got: {type(products)}")
                return {"success": False, "error": "Invalid response format from product-service"}

            logger.info(f"Retrieved {len(products)} products. Processing in batches of {self.batch_size}...")
            
            total_synced = 0
            db = SessionLocal()
            try:
                for i in range(0, len(products), self.batch_size):
                    batch = products[i : i + self.batch_size]
                    
                    for p in batch:
                        # Prepare content for AI context
                        content = f"ID: {p.get('id')}\n"
                        content += f"Tên thuốc: {p.get('name')}\n"
                        content += f"Thành phần: {p.get('activeIngredients', '')}\n"
                        content += f"Công dụng: {p.get('indications', '')}\n"
                        
                        # Symptoms list to string
                        symptoms_list = p.get('symptoms', [])
                        symptoms_str = ", ".join(symptoms_list) if symptoms_list else ""
                        if symptoms_str:
                            content += f"Triệu chứng phù hợp: {symptoms_str}\n"

                        content += f"Cách dùng: {p.get('usageInstruction', '')}\n"
                        content += f"Chống chỉ định: {p.get('contraindications', '')}\n"
                        content += f"Mô tả: {p.get('description', '')}"

                        # Upsert logic
                        existing = db.query(ProductSymptom).filter(ProductSymptom.id == p.get('id')).first()
                        if existing:
                            existing.name = p.get('name')
                            existing.symptoms = symptoms_str
                            existing.content = content
                        else:
                            new_ps = ProductSymptom(
                                id=p.get('id'),
                                name=p.get('name'),
                                symptoms=symptoms_str,
                                content=content
                            )
                            db.add(new_ps)
                        
                        total_synced += 1
                    
                    db.commit()
                    logger.info(f"Batch {i//self.batch_size + 1} synced.")
                    await asyncio.sleep(0.5) # Reduced sleep for DB sync
            finally:
                db.close()

            return {"success": True, "count": total_synced}

        except Exception as e:
            logger.error(f"Sync failed: {e}")
            return {"success": False, "error": str(e)}



sync_service = SyncService()
