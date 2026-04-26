import asyncio
from app.services.chat_service import chat_service

async def test_llm():
    try:
        print("Testing LLM connection...")
        # Use a simple prompt
        async for chunk in chat_service.stream_chat_response("Hello", "test_session"):
            print(f"Chunk: {chunk}")
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_llm())
