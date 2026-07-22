from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_study_explain_streaming():
    response = client.post("/api/study/explain?concept=python&depth=medium")
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    assert "python" in response.text


def test_research_upload_and_ask():
    file_content = b"sample text content for testing RAG indexing and retrieval"
    response = client.post(
        "/api/research/upload",
        files={"file": ("sample.txt", file_content, "text/plain")},
        headers={"x-session-id": "test-session"},
    )
    assert response.status_code == 200
    assert response.json()["filename"] == "sample.txt"

    ask_response = client.post(
        "/api/research/ask",
        data={"question": "What is the document about?"},
        headers={"x-session-id": "test-session"},
    )
    assert ask_response.status_code == 200
    assert "text/event-stream" in ask_response.headers["content-type"]


def test_interview_questions():
    response = client.post(
        "/api/interview/questions",
        data={"resume": "Python developer", "job_description": "Backend engineer"},
    )
    assert response.status_code == 200
    assert "questions" in response.json()
