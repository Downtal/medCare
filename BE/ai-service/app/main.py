import logging
from fastapi import FastAPI
from app.config.settings import settings
from app.models.chat_log import Base, engine
from py_eureka_client import eureka_client
from app.core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi import Request

app = FastAPI(title=settings.PROJECT_NAME)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Eureka Registration
@app.on_event("startup")
async def startup_event():
    # Create tables
    logger.info("Creating database tables...")
    from app.models.product_symptom import ProductSymptom
    Base.metadata.create_all(bind=engine)
    logger.info("Registering to Eureka...")
    await eureka_client.init_async(
        eureka_server=settings.EUREKA_SERVER,
        app_name=settings.APP_NAME,
        instance_port=settings.APP_PORT,
        instance_host="localhost"
    )
    logger.info("Eureka registration complete.")

@app.on_event("shutdown")
async def shutdown_event():
    await eureka_client.stop_async()

# Health Check
@app.get("/health")
async def health_check():
    return {"status": "UP", "service": settings.APP_NAME}

# Routes (Imported and included at the end to prevent circular dependency)
from app.api import chat, admin
app.include_router(chat.router, prefix="/api/ai", tags=["AI"])
app.include_router(admin.router, prefix="/api/ai", tags=["Admin"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.APP_PORT)
