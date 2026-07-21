from __future__ import annotations

import uuid
from typing import Dict, Any

from core.rag import SessionRAGStore


class SessionStore:
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "rag": SessionRAGStore(),
            "documents": [],
            "metadata": {},
        }
        return session_id

    def create_session_with_id(self, session_id: str) -> str:
        if not session_id:
            return self.create_session()
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "rag": SessionRAGStore(),
                "documents": [],
                "metadata": {},
            }
        return session_id

    def get_session(self, session_id: str) -> Dict[str, Any] | None:
        return self.sessions.get(session_id)
