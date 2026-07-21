from pydantic import BaseModel, Field
from typing import List, Optional


class StudyRequest(BaseModel):
    concept: str = Field(..., min_length=1)
    depth: str = Field(default="medium")


class ResearchAskRequest(BaseModel):
    question: str = Field(..., min_length=1)


class InterviewQuestionsRequest(BaseModel):
    resume: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=1)


class InterviewFeedbackRequest(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)


class CodebaseAskRequest(BaseModel):
    question: str = Field(..., min_length=1)
