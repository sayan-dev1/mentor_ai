import os
from .base import BaseLLMProvider, chunked_stream


class GroqProvider(BaseLLMProvider):
    name = "groq"

    def generate(self, prompt: str, **kwargs) -> str:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return f"[Groq provider placeholder] {prompt[:120]}"
        return f"Groq response for: {prompt[:120]}"

    def stream(self, prompt: str, **kwargs):
        text = self.generate(prompt, **kwargs)
        yield from chunked_stream(text)
