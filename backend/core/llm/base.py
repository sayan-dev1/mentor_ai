import time
from abc import ABC, abstractmethod


def chunked_stream(text: str, chunk_size: int = 64, delay: float = 0.03):
    for i in range(0, len(text), chunk_size):
        yield text[i : i + chunk_size]
        time.sleep(delay)


class BaseLLMProvider(ABC):
    name: str = "base"

    @abstractmethod
    def generate(self, prompt: str, **kwargs) -> str:
        raise NotImplementedError

    @abstractmethod
    def stream(self, prompt: str, **kwargs):
        raise NotImplementedError
