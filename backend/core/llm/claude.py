import os
from .base import BaseLLMProvider, chunked_stream


class ClaudeProvider(BaseLLMProvider):
    name = "claude"

    def generate(self, prompt: str, **kwargs) -> str:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            return f"[Claude provider placeholder] {prompt[:120]}"
        return f"Claude response for: {prompt[:120]}"

    def stream(self, prompt: str, **kwargs):
        text = self.generate(prompt, **kwargs)
        yield from chunked_stream(text)
