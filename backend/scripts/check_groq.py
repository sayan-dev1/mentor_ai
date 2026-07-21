from dotenv import load_dotenv
import os

load_dotenv(override=True)
print('GROQ_API_KEY present:', bool(os.getenv('GROQ_API_KEY')))
key = os.getenv('GROQ_API_KEY')
print('GROQ_API_KEY startswith gsk?:', bool(key and key.startswith('gsk_')))
print('OPENROUTER_API_KEY present:', bool(os.getenv('OPENROUTER_API_KEY')))

try:
    from openai import OpenAI
    print('openai.OpenAI import: OK')
except Exception as e:
    print('openai.OpenAI import failed:', type(e).__name__, str(e))

try:
    from core.llm.factory import LLMFactory
    client = LLMFactory.get_groq_client()
    print('LLMFactory.get_groq_client() ->', 'Client Present' if client is not None else 'None')
except Exception as e:
    print('Error calling LLMFactory.get_groq_client():', type(e).__name__, e)
