import json
import re
from fastapi import APIRouter, Query, Form
from fastapi.responses import StreamingResponse

from core.llm.service import LLMService
from core.prompt_builder import PromptBuilder

router = APIRouter(prefix="/api/study", tags=["study"])
llm = LLMService(agent_type="study")


@router.post("/explain")
def explain_concept(
    concept: str = Query(...),
    depth: str = Query(default="medium"),
):
    prompt = PromptBuilder.build_study_prompt(concept, depth)

    def event_stream():
        accumulated_text = ""
        for chunk in llm.stream(prompt):
            accumulated_text += chunk
            payload = {
                "concept": concept,
                "depth": depth,
                "message": accumulated_text,
            }
            yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/quiz")
def generate_quiz(concept: str = Form(...)):
    prompt = PromptBuilder.build_study_quiz_prompt(concept)
    raw_response = llm.generate(prompt)
    cleaned_json = re.sub(r"```json\s*|\s*```", "", raw_response).strip()

    try:
        data = json.loads(cleaned_json)
        questions = data.get("questions", [])
        if len(questions) >= 5:
            return {"questions": questions[:10]}
    except Exception as e:
        print(f"Failed to parse LLM quiz JSON: {e}")

    # Fallback 10-question set
    return {
        "questions": [
            {
                "id": "q1",
                "question": f"What is the primary core objective of {concept}?",
                "options": [
                    f"To decouple system components and enable scalable, deterministic execution.",
                    "To eliminate the need for databases and memory allocation entirely.",
                    "To execute infinite synchronous loops in a single background process.",
                    "To bypass low-level network protocol validations."
                ],
                "correctAnswer": 0,
                "explanation": f"{concept} primarily focuses on abstraction and decoupling to allow clean scalability and state management."
            },
            {
                "id": "q2",
                "question": f"Which architectural pillar is most critical when designing systems with {concept}?",
                "options": [
                    "Manual hardcoding of environment parameters.",
                    "Asynchronous execution and idempotent state transitions.",
                    "Ignoring error boundaries in favor of raw throughput.",
                    "Direct client-side access to database connection strings."
                ],
                "correctAnswer": 1,
                "explanation": "Idempotency and asynchronous handling ensure system fault tolerance under high concurrency."
            },
            {
                "id": "q3",
                "question": f"How does {concept} optimize performance during heavy workload bursts?",
                "options": [
                    "By increasing disk I/O operations per second.",
                    "By buffering events and preventing blocking bottlenecks in memory.",
                    "By forcing client browsers to re-render all UI nodes.",
                    "By disabling network encryption."
                ],
                "correctAnswer": 1,
                "explanation": "Event buffering and non-blocking execution maintain low latency under heavy load."
            },
            {
                "id": "q4",
                "question": f"In production environments, what is a recommended defensive practice for {concept}?",
                "options": [
                    "Setting strict timeouts, circuit breakers, and bounded queues.",
                    "Disabling logs and telemetry tracking.",
                    "Allowing unbounded memory growth without heap limits.",
                    "Hardcoding third-party API credentials."
                ],
                "correctAnswer": 0,
                "explanation": "Defensive patterns like circuit breakers and timeouts prevent cascading failures."
            },
            {
                "id": "q5",
                "question": f"What type of data structure or state model best pairs with {concept}?",
                "options": [
                    "Immutable event streams or deterministic state objects.",
                    "Global mutable singleton variables without locks.",
                    "Unstructured un-indexed text arrays.",
                    "Temporary session cookies without expiration."
                ],
                "correctAnswer": 0,
                "explanation": "Immutable state models ensure deterministic outputs and predictable debugging."
            },
            {
                "id": "q6",
                "question": f"When scaling {concept} horizontally, how should state synchronization be handled?",
                "options": [
                    "Using distributed locks or centralized pub/sub session stores.",
                    "Relying on local in-memory variables across disconnected nodes.",
                    "Restarting server instances whenever a state change occurs.",
                    "Storing state in client local-storage without server verification."
                ],
                "correctAnswer": 0,
                "explanation": "Centralized stores allow stateless nodes to scale independently."
            },
            {
                "id": "q7",
                "question": f"What metric is most suitable to monitor the operational health of {concept}?",
                "options": [
                    "p99 latency, error rate percentage, and queue depth.",
                    "Number of installed npm packages.",
                    "Font rendering speed in client browsers.",
                    "The number of lines of source code."
                ],
                "correctAnswer": 0,
                "explanation": "p99 latency and error rates give direct insight into execution performance."
            },
            {
                "id": "q8",
                "question": f"Which security consideration is paramount when implementing {concept}?",
                "options": [
                    "Input sanitization, authentication token validation, and rate limiting.",
                    "Hiding CSS stylesheets behind authentication headers.",
                    "Using unencrypted HTTP for internal microservice calls.",
                    "Storing passwords in plain text for fast lookup."
                ],
                "correctAnswer": 0,
                "explanation": "Sanitizing inputs and validating tokens prevent injection and unauthorized access."
            },
            {
                "id": "q9",
                "question": f"How does {concept} handle failure recovery when a node crashes?",
                "options": [
                    "By replaying uncommitted events or retrying from dead-letter queues.",
                    "By deleting all historical database records.",
                    "By requiring manual developer intervention for every error.",
                    "By ignoring the failure and proceeding without data verification."
                ],
                "correctAnswer": 0,
                "explanation": "Event replay and dead-letter queues ensure data durability."
            },
            {
                "id": "q10",
                "question": f"What is the ultimate benefit achieved after successfully mastering {concept}?",
                "options": [
                    "High system resilience, predictable maintainability, and clean technical architecture.",
                    "Complete elimination of software testing requirements.",
                    "Zero network latency across international distances.",
                    "Automatic generation of user interface designs."
                ],
                "correctAnswer": 0,
                "explanation": "Mastery enables building reliable, maintainable, and high-performance software systems."
            }
        ]
    }


@router.post("/suggestions")
def generate_study_suggestions(
    concept: str = Form(...),
    score: int = Form(...),
    total: int = Form(default=10),
    wrong_topics: str = Form(default="")
):
    prompt = PromptBuilder.build_study_suggestions_prompt(concept, score, total, wrong_topics)
    suggestions_markdown = llm.generate(prompt)
    return {"suggestions": suggestions_markdown}
