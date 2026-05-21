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
                        # Prepare content for AI context (Structured for LLM)
                        content = f"ID: {p.get('id')}\n"
                        content += f"Tên thuốc: {p.get('name')}\n"
                        content += f"Thương hiệu: {p.get('brand', 'N/A')}\n"
                        content += f"Nhà sản xuất: {p.get('manufacturer', 'N/A')}\n"
                        content += f"Nước sản xuất: {p.get('countryOfOrigin', 'N/A')}\n"
                        content += f"Dạng bào chế: {p.get('dosageForm', 'N/A')}\n"
                        content += f"Hạn sử dụng: {p.get('expiryDate', 'N/A')}\n"
                        content += f"Quy cách: {p.get('packingUnit', 'N/A')}\n"
                        content += f"Cần kê đơn: {'Có' if p.get('requiresPrescription') else 'Không'}\n"
                        
                        content += f"Thành phần: {p.get('activeIngredients', 'N/A')}\n"
                        content += f"Công dụng: {p.get('indications', 'N/A')}\n"
                        
                        # Symptoms list to string
                        symptoms_list = p.get('symptoms') or []
                        symptoms_str = ", ".join([s.strip() for s in symptoms_list if s and s.strip()]) if symptoms_list else ""
                        
                        if symptoms_str:
                            content += f"Triệu chứng phù hợp: {symptoms_str}\n"

                        content += f"Cách dùng: {p.get('usageInstruction', 'N/A')}\n"
                        content += f"Chống chỉ định: {p.get('contraindications', 'N/A')}\n"
                        content += f"Tác dụng phụ: {p.get('sideEffects', 'N/A')}\n"
                        content += f"Lưu ý/Thận trọng: {p.get('precautions', 'N/A')}\n"
                        content += f"Bảo quản: {p.get('storageConditions', 'N/A')}\n"
                        content += f"Mô tả: {p.get('description', 'N/A')}"

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

    async def sync_single_product(self, product_id: int):
        try:
            logger.info(f"Fetching product {product_id} from: {self.product_service_url}/api/products/{product_id}")
            p = await self._fetch_with_retry(f"{self.product_service_url}/api/products/{product_id}")
            
            if not p or not isinstance(p, dict):
                return {"success": False, "error": f"Product {product_id} not found or invalid format"}

            db = SessionLocal()
            try:
                # Prepare content (Structured for LLM)
                content = f"ID: {p.get('id')}\n"
                content += f"Tên thuốc: {p.get('name')}\n"
                content += f"Thương hiệu: {p.get('brand', 'N/A')}\n"
                content += f"Nhà sản xuất: {p.get('manufacturer', 'N/A')}\n"
                content += f"Nước sản xuất: {p.get('countryOfOrigin', 'N/A')}\n"
                content += f"Dạng bào chế: {p.get('dosageForm', 'N/A')}\n"
                content += f"Hạn sử dụng: {p.get('expiryDate', 'N/A')}\n"
                content += f"Quy cách: {p.get('packingUnit', 'N/A')}\n"
                content += f"Cần kê đơn: {'Có' if p.get('requiresPrescription') else 'Không'}\n"
                
                content += f"Thành phần: {p.get('activeIngredients', 'N/A')}\n"
                content += f"Công dụng: {p.get('indications', 'N/A')}\n"
                
                # Symptoms list to string
                symptoms_list = p.get('symptoms') or []
                symptoms_str = ", ".join([s.strip() for s in symptoms_list if s and s.strip()]) if symptoms_list else ""
                
                if symptoms_str:
                    content += f"Triệu chứng phù hợp: {symptoms_str}\n"

                content += f"Cách dùng: {p.get('usageInstruction', 'N/A')}\n"
                content += f"Chống chỉ định: {p.get('contraindications', 'N/A')}\n"
                content += f"Tác dụng phụ: {p.get('sideEffects', 'N/A')}\n"
                content += f"Lưu ý/Thận trọng: {p.get('precautions', 'N/A')}\n"
                content += f"Bảo quản: {p.get('storageConditions', 'N/A')}\n"
                content += f"Mô tả: {p.get('description', 'N/A')}"

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
                
                db.commit()
                return {"success": True}
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Single product sync failed: {e}")
            return {"success": False, "error": str(e)}



sync_service = SyncService()
