import google.generativeai as genai
from app.config.settings import settings

def list_models():
    genai.configure(api_key=settings.GEMINI_API_KEY)
    print("Listing available models for your API Key...")
    try:
        for m in genai.list_models():
            if 'embedContent' in m.supported_generation_methods:
                print(f"Model: {m.name} (Supports Embedding)")
            else:
                print(f"Model: {m.name}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_models()
