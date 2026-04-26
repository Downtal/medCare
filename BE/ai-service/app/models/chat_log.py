from sqlalchemy import Column, BigInteger, String, Text, JSON, TIMESTAMP, func, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings

Base = declarative_base()

class ChatbotLog(Base):
    __tablename__ = 'chatbot_logs'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=True)
    session_id = Column(String(100), nullable=False)
    user_message = Column(Text, nullable=False)
    bot_response = Column(Text, nullable=False)
    detected_symptoms = Column(JSON, nullable=True)
    suggested_medicines = Column(JSON, nullable=True)
    rating = Column(Boolean, nullable=True) # True for 👍, False for 👎
    feedback_reason = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
