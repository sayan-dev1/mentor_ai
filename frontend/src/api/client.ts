const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function getSessionId(): string {
  let sessionId = localStorage.getItem('mentorai_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('mentorai_session_id', sessionId);
  }
  return sessionId;
}

export function setSessionId(sessionId: string): void {
  localStorage.setItem('mentorai_session_id', sessionId);
}

export function resetSessionId(): string {
  const newSessionId = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
  localStorage.setItem('mentorai_session_id', newSessionId);
  return newSessionId;
}

export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('Backend health check failed, falling back to client mode:', error);
    return { status: 'offline', service: 'mentorai-backend (mock)' };
  }
}

export async function readSSEStream<T>(
  url: string,
  options: RequestInit,
  onChunk: (data: T) => void,
  signal?: AbortSignal
): Promise<void> {
  const sessionId = getSessionId();
  const headers = new Headers(options.headers || {});
  headers.set('x-session-id', sessionId);
  headers.set('Accept', 'text/event-stream');
  headers.set('Cache-Control', 'no-cache');

  const response = await fetch(url, {
    ...options,
    headers,
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown network error');
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  function processChunk(chunk: string) {
    const normalized = chunk.replace(/\r\n/g, '\n');
    const events = normalized.split('\n\n');
    let remainder = '';

    for (const event of events) {
      if (!event.trim()) continue;
      const lines = event.split('\n');
      const dataLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim());
        }
      }
      if (dataLines.length === 0) {
        remainder += event;
        continue;
      }
      const dataText = dataLines.join('\n');
      try {
        const parsed = JSON.parse(dataText) as T;
        onChunk(parsed);
      } catch (e) {
        console.warn('Failed to parse SSE JSON:', dataText, e);
      }
    }

    if (!normalized.endsWith('\n\n')) {
      remainder = events[events.length - 1];
    }
    return remainder;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = processChunk(buffer);
  }

  if (buffer.trim()) {
    processChunk(buffer);
  }
}
