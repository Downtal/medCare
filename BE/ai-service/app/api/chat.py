from fastapi import APIRouter, Header, Request
from pydantic import BaseModel
from typing import List, Optional, Optional as TypingOptional
from app.services.chat_service import chat_service
from sse_starlette.sse import EventSourceResponse
from app.core.limiter import limiter

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    answer: str
    session_id: str
    detected_symptoms: List[str] = []
    suggested_medicines: List[dict] = []
    list_product_ids: List[int] = []
    log_id: Optional[int] = None

class FeedbackRequest(BaseModel):
    log_id: int
    rating: bool
    reason: Optional[str] = None

@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    success = chat_service.submit_feedback(request.log_id, request.rating, request.reason)
    if not success:
        return {"status": "error", "message": "Failed to submit feedback"}
    return {"status": "success"}

def get_dynamic_limit():
    # We'll use a fixed limit for now to ensure stability, 
    # or implement it without requiring arguments if slowapi calls it empty.
    return "50/minute"

@router.post("/chat", response_model=ChatResponse)
@limiter.limit(get_dynamic_limit)
async def chat_with_ai(
    request: Request,
    chat_request: ChatRequest,
    x_user_id: TypingOptional[str] = Header(None)
):
    user_id = int(x_user_id) if x_user_id and x_user_id.isdigit() else None
    
    result = await chat_service.get_chat_response(
        user_message=chat_request.message,
        session_id=chat_request.session_id or "default",
        user_id=user_id
    )
    
    return ChatResponse(
        answer=result.get("answer", ""),
        session_id=chat_request.session_id or "default",
        detected_symptoms=result.get("detected_symptoms", []),
        suggested_medicines=result.get("suggested_medicines", []),
        list_product_ids=result.get("list_product_ids", []),
        log_id=result.get("log_id")
    )

@router.post("/stream")
async def stream_ai(
    request: Request,
    chat_request: ChatRequest,
    x_user_id: TypingOptional[str] = Header(None)
):
    user_id = int(x_user_id) if x_user_id and x_user_id.isdigit() else None

    async def event_generator():
        async for chunk in chat_service.stream_chat_response(
            user_message=chat_request.message,
            session_id=chat_request.session_id or "default",
            user_id=user_id
        ):
            yield {"data": chunk}

    return EventSourceResponse(event_generator())
