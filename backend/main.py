from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.study import router as study_router
from routers.research import router as research_router
from routers.interview import router as interview_router
from routers.codebase import router as codebase_router
from session_store import SessionStore

app = FastAPI(title="MentorAI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.session_store = SessionStore()

app.include_router(study_router)
app.include_router(research_router)
app.include_router(interview_router)
app.include_router(codebase_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "mentorai-backend"}
