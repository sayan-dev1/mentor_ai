import os
from .base import BaseLLMProvider, chunked_stream


class OpenAIProvider(BaseLLMProvider):
    name = "openai"

    def generate(self, prompt: str, **kwargs) -> str:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return f"[OpenAI provider placeholder] {prompt[:120]}"
        return f"OpenAI response for: {prompt[:120]}"

    def stream(self, prompt: str, **kwargs):
        text = self.generate(prompt, **kwargs)
        yield from chunked_stream(text)
