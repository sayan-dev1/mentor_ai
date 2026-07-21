from __future__ import annotations

from typing import List, Dict, Any


class PromptBuilder:
    @staticmethod
    def build_study_prompt(concept: str, depth: str) -> str:
        return (
            f"You are an expert AI Tutor. Explain the concept '{concept}' at {depth} depth in structured markdown.\n"
            f"Use clear headings, bullet points, key pillars, code snippets or formulas if appropriate."
        )

    @staticmethod
    def build_study_quiz_prompt(concept: str) -> str:
        return (
            f"You are an AI Education Specialist. Generate a 10-question multiple-choice quiz testing knowledge on '{concept}'.\n"
            f"Return strictly valid JSON format with a key 'questions' containing an array of 10 objects. Each object must have:\n"
            f"- id: string (e.g. 'q1')\n"
            f"- question: string\n"
            f"- options: array of 4 strings\n"
            f"- correctAnswer: integer index (0, 1, 2, or 3)\n"
            f"- explanation: string\n\n"
            f"Topic: {concept}\n"
            f"Return ONLY raw JSON without markdown code fences."
        )

    @staticmethod
    def build_study_suggestions_prompt(concept: str, score: int, total: int, wrong_topics: str) -> str:
        return (
            f"You are an AI Study Advisor. A student scored {score}/{total} on a quiz about '{concept}'.\n"
            f"Missed topics/questions: {wrong_topics or 'General concept review'}.\n"
            f"Provide structured study recommendations in markdown with headings:\n"
            f"1. 📌 Primary Focus Areas for Review\n"
            f"2. 💡 Recommended Learning Strategies & Resources\n"
            f"3. 🚀 Next Practical Steps to Reach 100% Mastery\n"
        )

    @staticmethod
    def build_research_prompt(question: str, context_chunks: List[Dict[str, Any]]) -> str:
        formatted_chunks = []
        for idx, item in enumerate(context_chunks, start=1):
            chunk_text = item.get("chunk", "").strip()
            meta = item.get("metadata", {})
            source = meta.get("source", "Document")
            page = meta.get("page", 1)
            formatted_chunks.append(f"--- Chunk {idx} [Source: {source}, Page/Section: {page}] ---\n{chunk_text}")

        context_str = "\n\n".join(formatted_chunks) if formatted_chunks else "No document context available."

        return (
            f"You are a Research Intelligence Assistant. Analyze the provided document context and answer the user's question thoroughly.\n"
            f"If the context contains relevant information, synthesize a detailed answer with headings and key takeaways.\n"
            f"Always cite the source document and page/section numbers if available.\n\n"
            f"User Question: {question}\n\n"
            f"Retrieved Document Context:\n{context_str}"
        )

    @staticmethod
    def build_interview_prompt(resume: str, job_description: str) -> str:
        return (
            f"You are a Senior Technical Hiring Manager. Analyze this candidate resume and target job description.\n"
            f"Generate 3 to 5 realistic, challenging technical interview questions tailored to their background and the role requirements.\n\n"
            f"Candidate Resume:\n{resume}\n\n"
            f"Job Description:\n{job_description}"
        )

    @staticmethod
    def build_resume_analysis_prompt(resume: str, job_description: str) -> str:
        return (
            f"You are an expert AI Career Coach & Senior Technical Recruiter. Analyze this candidate resume against the target job description.\n"
            f"Provide your analysis strictly in JSON format with the following keys:\n"
            f"1. match_score: An integer score from 0 to 100 representing the role match percentage.\n"
            f"2. key_strengths: Array of strings highlighting candidate's top relevant strengths.\n"
            f"3. missing_skills: Array of strings listing gaps or missing skills required by the job.\n"
            f"4. suggested_improvements: Array of strings giving actionable resume/interview optimization tips.\n"
            f"5. recommended_tech: Array of strings listing technologies or frameworks to learn.\n\n"
            f"Candidate Resume:\n{resume}\n\n"
            f"Job Description:\n{job_description or 'General Technical Engineering Role'}\n\n"
            f"Return ONLY valid raw JSON without code blocks or extra text."
        )

    @staticmethod
    def build_codebase_prompt(question: str, context_chunks: List[Dict[str, Any]]) -> str:
        context = "\n\n".join(chunk.get("chunk", "") for chunk in context_chunks)
        return (
            f"You are a Principal Software Engineer. Answer the codebase question using the provided code context.\n"
            f"Provide code snippets, architectural explanations, and file references where applicable.\n\n"
            f"Question: {question}\n\n"
            f"Code Context:\n{context}"
        )
