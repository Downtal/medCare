from sqlalchemy import Column, BigInteger, String, Text, TIMESTAMP, func
from app.models.chat_log import Base

class ProductSymptom(Base):
    __tablename__ = 'product_symptoms'

    id = Column(BigInteger, primary_key=True) # Product ID from product-service
    name = Column(String(255), nullable=False)
    symptoms = Column(Text, nullable=True) # Comma-separated symptoms
    content = Column(Text, nullable=False) # Full context for LLM
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
