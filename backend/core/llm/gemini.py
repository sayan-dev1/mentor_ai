import os
from .base import BaseLLMProvider, chunked_stream


class GeminiProvider(BaseLLMProvider):
    name = "gemini"

    def generate(self, prompt: str, **kwargs) -> str:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return f"[Gemini provider placeholder] {prompt[:120]}"
        return f"Gemini response for: {prompt[:120]}"

    def stream(self, prompt: str, **kwargs):
        text = self.generate(prompt, **kwargs)
        yield from chunked_stream(text)
