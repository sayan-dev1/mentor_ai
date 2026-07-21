from __future__ import annotations

from typing import List
import numpy as np


class LocalEmbeddings:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name

    def embed(self, texts: List[str]) -> np.ndarray:
        vectors = []
        for text in texts:
            tokens = text.lower().split()
            vec = np.zeros(8, dtype=float)
            for i, token in enumerate(tokens[:8]):
                vec[i] = sum(ord(ch) for ch in token) / 1000.0
            vectors.append(vec)
        return np.array(vectors, dtype=float)
