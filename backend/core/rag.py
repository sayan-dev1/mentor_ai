from __future__ import annotations

import os
from typing import List, Dict, Any
import numpy as np

from .embeddings import LocalEmbeddings


class SessionRAGStore:
    def __init__(self):
        self.embeddings = LocalEmbeddings()
        self.chunks: List[str] = []
        self.vectors: np.ndarray | None = None
        self.metadata: List[Dict[str, Any]] = []

    def add_texts(self, texts: List[str], metadata: List[Dict[str, Any]] | None = None):
        self.chunks.extend(texts)
        if metadata:
            self.metadata.extend(metadata)
        vectors = self.embeddings.embed(texts)
        if self.vectors is None:
            self.vectors = vectors
        else:
            self.vectors = np.vstack([self.vectors, vectors])

    def similarity_search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not self.chunks:
            return []
        query_vec = self.embeddings.embed([query])[0]
        if self.vectors is None:
            return []
        sims = np.dot(self.vectors, query_vec)
        top_indices = np.argsort(sims)[::-1][:top_k]
        results = []
        for index in top_indices:
            results.append({"chunk": self.chunks[index], "metadata": self.metadata[index] if index < len(self.metadata) else {}})
        return results
