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
    
    # Database Config
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/medcare_chatbot_db?charset=utf8mb4"

settings = Settings()
