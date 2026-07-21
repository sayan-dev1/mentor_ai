import os
from .base import BaseLLMProvider, chunked_stream


class OpenRouterProvider(BaseLLMProvider):
    name = "openrouter"

    def generate(self, prompt: str, **kwargs) -> str:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            return f"[OpenRouter provider placeholder] {prompt[:120]}"
        return f"OpenRouter response for: {prompt[:120]}"

    def stream(self, prompt: str, **kwargs):
        text = self.generate(prompt, **kwargs)
        yield from chunked_stream(text)
