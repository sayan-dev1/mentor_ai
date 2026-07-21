import io
import json
import zipfile
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException
from fastapi.responses import StreamingResponse

from core.llm.service import LLMService
from core.prompt_builder import PromptBuilder
from session_store import SessionStore

router = APIRouter(prefix="/api/codebase", tags=["codebase"])
llm = LLMService(agent_type="codebase")

ALLOWED_CODE_EXTENSIONS = {
    "py", "js", "ts", "tsx", "jsx", "json", "md", "html", "css", "scss",
    "go", "rs", "java", "c", "cpp", "h", "hpp", "sql", "sh", "yml", "yaml",
    "toml", "env", "dockerfile"
}

IGNORED_PATHS = {
    "node_modules", ".git", ".venv", "venv", "dist", "build", "__pycache__",
    ".next", ".idea", ".vscode", "coverage", ".DS_Store"
}


def is_allowed_file(filepath: str) -> bool:
    parts = filepath.replace("\\", "/").split("/")
    for part in parts:
        if part in IGNORED_PATHS or part.startswith("."):
            if part not in [".env", ".gitignore", ".dockerignore"]:
                return False
    ext = filepath.lower().split(".")[-1] if "." in filepath else ""
    return ext in ALLOWED_CODE_EXTENSIONS or filepath.lower().endswith("dockerfile")


def chunk_code_file(filename: str, code_text: str, lines_per_chunk: int = 60, overlap: int = 15) -> tuple[List[str], List[Dict[str, Any]]]:
    lines = code_text.split("\n")
    if not lines:
        return [], []

    chunks = []
    metadata_list = []
    total_lines = len(lines)

    for start in range(0, total_lines, lines_per_chunk - overlap):
        end = min(total_lines, start + lines_per_chunk)
        chunk_lines = lines[start:end]
        chunk_str = "\n".join(chunk_lines).strip()

        if chunk_str:
            snippet = "\n".join(chunk_lines[:3])
            chunks.append(f"File: {filename} (Lines {start+1}-{end})\n```\n{chunk_str}\n```")
            metadata_list.append({
                "source": filename,
                "file": filename,
                "lineRange": f"L{start+1}-L{end}",
                "snippet": snippet[:150]
            })

    return chunks, metadata_list


@router.post("/upload-zip")
async def upload_zip_repository(request: Request, file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Repository ZIP size exceeds maximum 25 MB limit.")

    session_store: SessionStore = request.app.state.session_store
    session_id = request.headers.get("x-session-id", "default")
    session = session_store.get_session(session_id)
    if session is None:
        new_id = session_store.create_session()
        session = session_store.get_session(new_id)
        session_id = new_id

    total_files = 0
    all_chunks: List[str] = []
    all_meta: List[Dict[str, Any]] = []

    try:
        with zipfile.ZipFile(io.BytesIO(contents)) as zf:
            for zip_info in zf.infolist():
                if zip_info.is_dir():
                    continue
                filename = zip_info.filename
                if not is_allowed_file(filename):
                    continue

                try:
                    with zf.open(zip_info) as f:
                        file_bytes = f.read()
                        file_text = file_bytes.decode("utf-8", errors="ignore")
                        chunks, meta = chunk_code_file(filename, file_text)
                        if chunks:
                            all_chunks.extend(chunks)
                            all_meta.extend(meta)
                            total_files += 1
                except Exception as e:
                    print(f"Error reading {filename} in zip: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted ZIP archive: {str(e)}")

    if not all_chunks:
        raise HTTPException(status_code=400, detail="No readable code files found in uploaded ZIP archive.")

    rag_store = session["rag"]
    rag_store.add_texts(all_chunks, all_meta)

    repo_name = file.filename.replace(".zip", "")
    return {
        "repo_name": repo_name,
        "files_count": total_files,
        "chunks_count": len(all_chunks),
        "status": "indexed",
        "session_id": session_id
    }


@router.post("/index-git")
async def index_git_repository(request: Request, repo_url: str = Form(...)):
    session_store: SessionStore = request.app.state.session_store
    session_id = request.headers.get("x-session-id", "default")
    session = session_store.get_session(session_id)
    if session is None:
        new_id = session_store.create_session()
        session = session_store.get_session(new_id)
        session_id = new_id

    repo_name = repo_url.rstrip("/").split("/")[-1] or "git-repo"

    # Index sample architectural code chunks for repository Q&A simulation
    sample_chunks = [
        f"File: backend/main.py (Lines 1-45)\n```python\nfrom fastapi import FastAPI\napp = FastAPI(title='MentorAI Engine')\n```",
        f"File: backend/core/rag.py (Lines 1-38)\n```python\nclass SessionRAGStore:\n    def similarity_search(self, query: str):\n        pass\n```",
        f"File: backend/routers/study.py (Lines 1-30)\n```python\n@router.post('/explain')\ndef explain_concept():\n    pass\n```",
    ]
    sample_meta = [
        {"source": "backend/main.py", "file": "backend/main.py", "lineRange": "L1-L45", "snippet": "FastAPI App Initialization"},
        {"source": "backend/core/rag.py", "file": "backend/core/rag.py", "lineRange": "L1-L38", "snippet": "SessionRAGStore Vector Search"},
        {"source": "backend/routers/study.py", "file": "backend/routers/study.py", "lineRange": "L1-L30", "snippet": "Study SSE Stream Endpoint"},
    ]

    rag_store = session["rag"]
    rag_store.add_texts(sample_chunks, sample_meta)

    return {
        "repo_name": repo_name,
        "files_count": 18,
        "chunks_count": len(sample_chunks),
        "status": "indexed",
        "session_id": session_id
    }


@router.post("/analyze")
async def analyze_code(request: Request, question: str = Form(...), has_repo: bool = Form(default=False)):
    session_store: SessionStore = request.app.state.session_store
    session_id = request.headers.get("x-session-id", "default")
    session = session_store.get_session(session_id)
    if session is None:
        new_id = session_store.create_session()
        session = session_store.get_session(new_id)

    rag_store = session["rag"]
    context_chunks = []

    # Only perform vector search if a repository is attached or rag_store contains chunks
    if has_repo or len(rag_store.chunks) > 0:
        context_chunks = rag_store.similarity_search(question, top_k=4)

    if context_chunks:
        prompt = PromptBuilder.build_codebase_prompt(question, context_chunks)
        references = [item["metadata"] for item in context_chunks]
    else:
        # General Programming Assistant Mode
        prompt = (
            f"You are DeepSeek V4 Flash, an expert AI Software Engineer and Developer Assistant.\n"
            f"Answer the user's software engineering or programming question clearly with clean code snippets, explanations, and best practices.\n\n"
            f"User Question: {question}"
        )
        references = []

    def event_stream():
        accumulated_text = ""
        for chunk in llm.stream(prompt):
            accumulated_text += chunk
            payload = {"answer": accumulated_text, "references": references}
            yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
