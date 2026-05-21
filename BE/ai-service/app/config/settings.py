import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Calculate absolute path to the BE/.env file
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding='utf-8', extra='ignore')

    PROJECT_NAME: str = "MedCare AI Service"
    EUREKA_SERVER: str = "http://localhost:8761/eureka"
    APP_PORT: int = 8095
    APP_NAME: str = "ai-service"
    
    # Gemini Config
    GEMINI_API_KEY: str
    GEMINI_API_KEY_2: str = "" # Fallback key
    
    # Database Config
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/medcare_chatbot_db?charset=utf8mb4"

    # Recommendation foundation (non-AI)
    ORDER_SERVICE_URL: str = "http://localhost:8082"
    PRODUCT_SERVICE_URL: str = "http://localhost:8083"
    INVENTORY_SERVICE_URL: str = "http://localhost:8084"
    RECOMMENDATION_DEFAULT_LIMIT: int = 8
    RECOMMENDATION_SIGNAL_WINDOW_DAYS: int = 60
    RECOMMENDATION_FALLBACK_POPULAR_POOL_SIZE: int = 200
    RECOMMENDATION_FALLBACK_NEWEST_POOL_SIZE: int = 200
    RECOMMENDATION_STOCK_SNAPSHOT_TTL_SECONDS: int = 300
    RECOMMENDATION_RESPONSE_CACHE_TTL_SECONDS: int = 90
    RECOMMENDATION_HTTP_TIMEOUT_SECONDS: float = 5.0
    RECOMMENDATION_WEIGHT_ORDER: float = 0.35
    RECOMMENDATION_WEIGHT_CART: float = 0.35
    RECOMMENDATION_WEIGHT_CATEGORY: float = 0.20
    RECOMMENDATION_WEIGHT_POPULARITY: float = 0.10
    RECOMMENDATION_RELATED_WEIGHT_CATEGORY: float = 0.50
    RECOMMENDATION_RELATED_WEIGHT_BRAND: float = 0.30
    RECOMMENDATION_RELATED_WEIGHT_POPULARITY: float = 0.20

settings = Settings()
