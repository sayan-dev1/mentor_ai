import io
import json
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, StreamingResponse
import pypdf
import docx

from core.llm.service import LLMService
from core.prompt_builder import PromptBuilder
from session_store import SessionStore

router = APIRouter(prefix="/api/research", tags=["research"])
llm = LLMService(agent_type="research")


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    text = text.strip()
    if not text:
        return []

    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) + 2 <= chunk_size:
            current_chunk += ("\n\n" if current_chunk else "") + para
        else:
            if current_chunk:
                chunks.append(current_chunk)
            if len(para) > chunk_size:
                for i in range(0, len(para), chunk_size - overlap):
                    chunks.append(para[i : i + chunk_size])
                current_chunk = ""
            else:
                current_chunk = para

    if current_chunk:
        chunks.append(current_chunk)

    return chunks if chunks else [text[:chunk_size]]


def extract_text_chunks_from_file(filename: str, contents: bytes) -> tuple[List[str], List[Dict[str, Any]]]:
    chunks: List[str] = []
    metadata_list: List[Dict[str, Any]] = []
    ext = filename.lower().split(".")[-1] if "." in filename else ""

    if ext == "pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(contents))
            for page_num, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                page_chunks = chunk_text(text, chunk_size=800, overlap=150)
                for chunk in page_chunks:
                    chunks.append(chunk)
                    metadata_list.append({
                        "source": filename,
                        "page": page_num,
                        "snippet": chunk[:150].replace("\n", " ") + "..."
                    })
        except Exception as e:
            print(f"Error parsing PDF '{filename}': {e}")

    elif ext in ["docx", "doc"]:
        try:
            doc = docx.Document(io.BytesIO(contents))
            full_text = "\n\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            doc_chunks = chunk_text(full_text, chunk_size=800, overlap=150)
            for idx, chunk in enumerate(doc_chunks, start=1):
                chunks.append(chunk)
                metadata_list.append({
                    "source": filename,
                    "page": idx,
                    "snippet": chunk[:150].replace("\n", " ") + "..."
                })
        except Exception as e:
            print(f"Error parsing DOCX '{filename}': {e}")

    else:
        # Plain text, markdown, csv, json, code, etc.
        try:
            text = contents.decode("utf-8", errors="ignore")
            txt_chunks = chunk_text(text, chunk_size=800, overlap=150)
            for idx, chunk in enumerate(txt_chunks, start=1):
                chunks.append(chunk)
                metadata_list.append({
                    "source": filename,
                    "page": idx,
                    "snippet": chunk[:150].replace("\n", " ") + "..."
                })
        except Exception as e:
            print(f"Error reading text file '{filename}': {e}")

    return chunks, metadata_list


@router.post("/upload")
async def upload_document(request: Request, file: UploadFile = File(...)):
    session_store: SessionStore = request.app.state.session_store
    session_id = request.headers.get("x-session-id", "default")
    session = session_store.get_session(session_id)
    if session is None:
        if session_id == "default" or not session_id:
            session_id = session_store.create_session()
        else:
            session_id = session_store.create_session_with_id(session_id)
        session = session_store.get_session(session_id)

    contents = await file.read()
    chunks, metadata_list = extract_text_chunks_from_file(file.filename, contents)

    if chunks and session is not None:
        rag_store = session["rag"]
        rag_store.add_texts(chunks, metadata_list)
        if file.filename not in session["documents"]:
            session["documents"].append(file.filename)

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "status": "indexed",
        "chunks_indexed": len(chunks),
        "session_id": session_id,
        "sizeBytes": len(contents),
    }


@router.post("/ask")
async def ask_question(request: Request, question: str = Form(...)):
    session_store: SessionStore = request.app.state.session_store
    session_id = request.headers.get("x-session-id", "default")
    session = session_store.get_session(session_id)

    if session is None:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Session not found. Please upload a document first or use the correct x-session-id.",
            },
        )

    rag_store = session["rag"]
    # Query vector similarity search from indexed document chunks
    context_chunks = rag_store.similarity_search(question, top_k=5)
    if not context_chunks:
        return JSONResponse(
            status_code=400,
            content={
                "error": "No indexed document context available for this session. Upload a document first.",
            },
        )
    prompt = PromptBuilder.build_research_prompt(question, context_chunks)

    def event_stream():
        accumulated_text = ""
        # Deduplicate citations for frontend
        seen_sources = set()
        citations = []
        for item in context_chunks:
            meta = item.get("metadata", {})
            key = (meta.get("source"), meta.get("page"))
            if key not in seen_sources:
                seen_sources.add(key)
                citations.append(meta)

        for chunk in llm.stream(prompt):
            accumulated_text += chunk
            payload = {"answer": accumulated_text, "citations": citations}
            yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
