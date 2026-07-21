import { readSSEStream, getSessionId } from './client';
import type { ExplanationDepth, StudyExplanationResponse, QuizQuestion } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function explainConceptStream(
  concept: string,
  depth: ExplanationDepth = 'medium',
  onChunk: (response: StudyExplanationResponse) => void,
  signal?: AbortSignal
): Promise<void> {
  const url = `${API_BASE}/study/explain?concept=${encodeURIComponent(concept)}&depth=${encodeURIComponent(depth)}`;
  
  try {
    await readSSEStream<StudyExplanationResponse>(
      url,
      {
        method: 'POST',
      },
      onChunk,
      signal
    );
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    console.warn('Study API backend unavailable, using simulated stream:', err);
    await simulateStudyStream(concept, depth, onChunk, signal);
  }
}

export async function fetchQuizQuestions(concept: string): Promise<QuizQuestion[]> {
  const sessionId = getSessionId();
  const formData = new FormData();
  formData.append('concept', concept);

  try {
    const res = await fetch(`${API_BASE}/study/quiz`, {
      method: 'POST',
      headers: {
        'x-session-id': sessionId,
      },
      body: formData,
    });

    if (!res.ok) throw new Error(`Quiz API error (${res.status})`);
    const data = await res.json();
    return data.questions || [];
  } catch (err) {
    console.warn('Study Quiz API offline, returning fallback quiz set:', err);
    return [];
  }
}

export async function fetchStudySuggestions(
  concept: string,
  score: number,
  total: number,
  wrongTopics: string
): Promise<string> {
  const sessionId = getSessionId();
  const formData = new FormData();
  formData.append('concept', concept);
  formData.append('score', score.toString());
  formData.append('total', total.toString());
  formData.append('wrong_topics', wrongTopics);

  try {
    const res = await fetch(`${API_BASE}/study/suggestions`, {
      method: 'POST',
      headers: {
        'x-session-id': sessionId,
      },
      body: formData,
    });

    if (!res.ok) throw new Error(`Suggestions API error (${res.status})`);
    const data = await res.json();
    return data.suggestions || '';
  } catch (err) {
    console.warn('Study Suggestions API offline, returning local recommendations:', err);
    return `### 📌 Primary Focus Areas for ${concept}\n\n1. **Core Mechanics & State Flow**: Review fundamental principles and state transition invariants.\n2. **Performance Bottlenecks**: Focus on event buffering and latency optimization under high concurrency.\n3. **Production Defensive Patterns**: Revisit circuit breakers, timeouts, and idempotent handlers.\n\n### 🚀 Recommended Next Steps\n- Practice implementing a small prototype of ${concept}.\n- Retake the 10-question quiz to reach 100% mastery!`;
  }
}

async function simulateStudyStream(
  concept: string,
  depth: ExplanationDepth,
  onChunk: (response: StudyExplanationResponse) => void,
  signal?: AbortSignal
): Promise<void> {
  const mockExpl = generateMockExplanation(concept, depth);
  const chunks = mockExpl.split(/(?<=\. |\n)/);
  
  let currentText = '';
  for (const chunk of chunks) {
    if (signal?.aborted) break;
    currentText += chunk;
    onChunk({
      concept,
      depth,
      message: currentText,
    });
    await new Promise((r) => setTimeout(r, 60));
  }
}

function generateMockExplanation(concept: string, depth: ExplanationDepth): string {
  const depthPrefix = depth === 'simple' 
    ? '### 💡 Simple Overview (ELIF5)\n\n'
    : depth === 'deep'
    ? '### 🔬 In-Depth Engineering Deep Dive\n\n'
    : '### 📘 Comprehensive Explanation\n\n';

  return `${depthPrefix}**${concept}** is a fundamental concept in modern tech and problem solving.

#### 1. Core Mechanics
At its core, ${concept} allows systems to decouple execution from intent. By breaking down complex workflows into predictable data structures and state transitions, developers can achieve high reliability and horizontal scalability.

#### 2. Key Architectural Pillars
- **Abstraction Layer**: Shields consumer applications from lower-level execution details.
- **State Determinism**: Ensures input parameters produce reproducible outputs across distinct nodes.
- **Asynchronous Execution**: Eliminates blocking bottlenecks during heavy computation loops.

\`\`\`typescript
// Conceptual Implementation of ${concept}
interface ${concept.replace(/\s+/g, '')}Config {
  enabled: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export function execute${concept.replace(/\s+/g, '')}(params: Record<string, unknown>): Promise<void> {
  console.log('Processing ${concept}...', params);
  return Promise.resolve();
}
\`\`\`

#### 3. Real-World Applications & Best Practices
- **Scalability**: Keeps distributed systems resilient against high concurrency loads.
- **Performance**: Minimizes memory footprints with optimized algorithmic complexity.
- **Maintainability**: Makes unit testing straightforward through clear interface separation.
`;
}
