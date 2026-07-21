export type ThemeMode = 'dark' | 'light' | 'system';

export interface BackendHealth {
  status: string;
  service: string;
}

export interface SessionInfo {
  sessionId: string;
  createdAt: string;
  documentsCount: number;
}

// Conversation Chat Message Model
export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  depth?: ExplanationDepth;
  citations?: Citation[];
  references?: CodeReference[];
}

// Study Agent Types
export type ExplanationDepth = 'simple' | 'medium' | 'deep';

export interface StudyExplanationResponse {
  concept: string;
  depth: ExplanationDepth;
  message: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
}

// Research Agent Types
export interface UploadDocumentResponse {
  filename: string;
  content_type: string;
  status: string;
  session_id: string;
  sizeBytes?: number;
}

export interface Citation {
  source: string;
  page?: number;
  snippet?: string;
}

export interface ResearchAskResponse {
  answer: string;
  citations: Citation[];
}

// Interview Agent Types
export interface UploadResumeResponse {
  filename: string;
  size_bytes: number;
  pages_count: number;
  extracted_text: string;
  status: string;
}

export interface ResumeAnalysisResponse {
  match_score: number;
  key_strengths: string[];
  missing_skills: string[];
  suggested_improvements: string[];
  recommended_tech: string[];
}

export interface InterviewQuestionsResponse {
  questions: string[];
  resume_length: number;
  job_description_length: number;
}

export interface InterviewFeedbackResponse {
  score: number;
  feedback: string;
  suggestions: string[];
  strengths?: string[];
  weaknesses?: string[];
}

export interface InterviewQAItem {
  id: string;
  question: string;
  userAnswer?: string;
  feedback?: InterviewFeedbackResponse;
  isEvaluating?: boolean;
  isSkipped?: boolean;
}

// Codebase Agent Types
export interface CodeReference {
  source: string;
  file?: string;
  lineRange?: string;
  snippet?: string;
}

export interface CodebaseAskResponse {
  answer: string;
  references: CodeReference[];
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  size?: number;
}
