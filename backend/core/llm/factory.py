import os
from typing import Optional, Tuple, Any
from dotenv import load_dotenv

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


class LLMFactory:
    _groq_client: Optional[Any] = None
    _groq_key: Optional[str] = None
    
    _openrouter_client: Optional[Any] = None
    _openrouter_key: Optional[str] = None

    @classmethod
    def get_groq_client(cls) -> Optional[Any]:
        if OpenAI is None:
            return None
        load_dotenv(override=True)
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not api_key or "your_groq_api_key_here" in api_key:
            return None
        if cls._groq_client is None or cls._groq_key != api_key:
            cls._groq_key = api_key
            cls._groq_client = OpenAI(
                base_url="https://api.groq.com/openai/v1",
                api_key=api_key
            )
        return cls._groq_client

    @classmethod
    def get_openrouter_client(cls) -> Optional[Any]:
        if OpenAI is None:
            return None
        load_dotenv(override=True)
        api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        if not api_key or "your_openrouter_api_key_here" in api_key:
            return None
        if cls._openrouter_client is None or cls._openrouter_key != api_key:
            cls._openrouter_key = api_key
            cls._openrouter_client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key,
                default_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "MentorAI"
                }
            )
        return cls._openrouter_client

    @classmethod
    def get_agent_llm(cls, agent_type: str = "study") -> Tuple[Optional[Any], str, str]:
        """
        Routes requests across Groq and OpenRouter based on agent requirements.
        - Study Agent      -> Groq (Llama 3.3 70B Versatile)
        - Interview Agent  -> Groq (Llama 3.3 70B Versatile)
        - Research Agent   -> OpenRouter (Nvidia Nemotron 3 Super 120B) with Groq (openai/gpt-oss-120b) fallback
        - Codebase Agent   -> OpenRouter (DeepSeek V4 Flash)
        """
        agent = (agent_type or "study").lower()

        if agent in ["study", "interview"]:
            return cls.get_groq_client(), "llama-3.3-70b-versatile", "Groq"

        elif agent == "research":
            # Primary: OpenRouter Nvidia Nemotron 3 Super 120B
            client = cls.get_openrouter_client()
            if client is not None:
                return client, "nvidia/nemotron-3-super-120b-a12b:free", "OpenRouter"
            # If OpenRouter key not set, fallback to Groq openai/gpt-oss-120b immediately
            return cls.get_groq_client(), "openai/gpt-oss-120b", "Groq"

        elif agent in ["codebase", "code"]:
            return cls.get_openrouter_client(), "deepseek/deepseek-v4-flash", "OpenRouter"

        # Fallback
        return cls.get_groq_client(), "llama-3.1-8b-instant", "Groq"

    @classmethod
    def get_fallback_llm(cls, agent_type: str = "research") -> Tuple[Optional[Any], str, str]:
        """
        Provides automatic fallback LLM models when primary models hit rate limits or errors.
        - Research Agent -> Groq (openai/gpt-oss-120b)
        """
        agent = (agent_type or "research").lower()
        if agent == "research":
            return cls.get_groq_client(), "openai/gpt-oss-120b", "Groq (Auto-Fallback)"
        return cls.get_groq_client(), "llama-3.3-70b-versatile", "Groq (Auto-Fallback)"
