import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ChatBubble } from '../components/shared/ChatBubble';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';
import { askCodebaseQuestionStream } from '../api/codebaseApi';
import type { CodeReference, ChatMessage } from '../types';
import {
  Code,
  Folder,
  FolderOpen,
  Sparkles,
  Send,
  StopCircle,
  Trash2,
  UploadCloud,
  Plus,
  Lock,
  FileArchive,
  GitBranch,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export const CodebasePage: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReference, setSelectedReference] = useState<CodeReference | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generalSuggestions = [
    'Generate a FastAPI CRUD route with Pydantic validation.',
    'Explain Python decorators and yield generators.',
    'Write a React 19 custom hook for SSE streaming.',
    'How do B-Tree indexes work in PostgreSQL?',
  ];

  // Auto-scroll to bottom of conversation thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleLockedFeatureClick = () => {
    toast.info('🔒 Repository indexing & ZIP upload is under active development and coming soon! General AI Code Assistant is 100% active below.', {
      duration: 5000,
    });
  };

  const handleAskCodebase = async (overrideQ?: string) => {
    const q = overrideQ || question;
    if (!q.trim()) {
      toast.error('Please enter a programming question.');
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `assistant_${Date.now()}`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: q,
      timestamp: timeStr,
    };

    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: timeStr,
      isStreaming: true,
      references: [],
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setQuestion('');
    setError(null);
    setIsStreaming(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await askCodebaseQuestionStream(
        q,
        (res) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: res.answer,
                    references: res.references || msg.references,
                    isStreaming: true,
                  }
                : msg
            )
          );
        },
        false, // General Mode
        controller.signal
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
        toast.error('Failed to get answer from codebase agent.');
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
      );
      toast.info('Code analysis streaming stopped.');
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success('Codebase chat history cleared.');
  };

  return (
    <div className="space-y-6 animate-fadeIn flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Header Bar */}
      <Card className="p-6 bg-gradient-to-r from-amber-950/60 via-slate-900/80 to-slate-900/60 border-amber-500/20 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Code className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">Codebase Agent</h2>
              <Badge variant="amber">OpenRouter DeepSeek V4 Flash</Badge>
            </div>
            <p className="text-xs text-slate-400">
              General software engineering AI assistant. Generate APIs, debug code, explain algorithms, and design software architectures.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="gradient"
              size="sm"
              onClick={() => handleClearChat()}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Chat
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Left Sidebar: Locked Repository Panel (Coming Soon) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Upload ZIP / Connect Git Card - Locked Overlay */}
          <Card className="p-4 space-y-3 relative overflow-hidden group">
            {/* Lock Ribbon Overlay */}
            <div
              onClick={handleLockedFeatureClick}
              className="absolute inset-0 z-10 bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all hover:bg-slate-950/65"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2 shadow-lg animate-pulse">
                <Lock className="w-4 h-4" />
              </div>
              <Badge variant="amber" size="sm" className="font-semibold uppercase tracking-wider">
                Under Development
              </Badge>
              <p className="text-[11px] text-slate-300 font-medium mt-1 leading-tight">
                Repository Indexing & ZIP Upload Coming Soon
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
              <UploadCloud className="w-4 h-4 text-amber-400" /> Attach Codebase
            </span>

            {/* ZIP Upload Box */}
            <div className="p-3 border-dashed border-2 border-slate-700/80 bg-slate-950/40 rounded-xl text-center opacity-40">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <FileArchive className="w-4 h-4 text-amber-400" />
                <span>Upload Repository ZIP</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">Max 25 MB (.zip)</span>
            </div>

            {/* Git Repo Input */}
            <div className="space-y-1.5 pt-2 border-t border-white/5 opacity-40">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-cyan-400" /> Connect GitHub Repo:
              </span>
              <div className="flex gap-2">
                <Input placeholder="https://github.com/org/repo" className="text-xs py-1 font-mono" disabled />
                <Button variant="secondary" size="sm" disabled>Index</Button>
              </div>
            </div>
          </Card>

          {/* Indexed Repositories Panel - Locked Preview */}
          <Card className="p-4 space-y-3 relative overflow-hidden">
            {/* Lock Ribbon Overlay */}
            <div
              onClick={handleLockedFeatureClick}
              className="absolute inset-0 z-10 bg-slate-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all hover:bg-slate-950/65"
            >
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Custom Repo Persistence</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5">Feature in active build</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/5 opacity-30">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-400" /> Indexed Repositories
              </span>
              <Badge variant="slate" size="sm">0</Badge>
            </div>

            <div className="space-y-2 opacity-30">
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs text-slate-400 flex items-center justify-between">
                <span className="truncate">Sample Codebase</span>
                <span className="text-[10px] font-mono">0 files</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Pane: Active Context Banner & Multi-turn General Chat Window */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
          {/* Active Context Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-2 text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Current Context: <strong className="text-amber-400 font-semibold">General Programming Assistant (DeepSeek V4 Flash)</strong></span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-mono bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <Lock className="w-3 h-3" /> Repo Indexing Under Development
            </div>
          </div>

          {/* Chat Messages Window */}
          <Card className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[500px] min-h-[350px] space-y-4 bg-slate-950/40">
            {messages.length === 0 ? (
              <EmptyState
                icon={Code}
                title="General Software Engineering Assistant"
                description="Ask any programming question, generate APIs, debug algorithms, or explore architecture design patterns using DeepSeek V4 Flash."
                suggestions={generalSuggestions}
                onSelectSuggestion={(s) => handleAskCodebase(s)}
              />
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    onSelectReference={(ref) => setSelectedReference(ref)}
                  />
                ))}
                {error && <ErrorState message={error} onRetry={() => handleAskCodebase()} />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </Card>

          {/* Bottom Code Question Input Bar */}
          <Card className="p-4 space-y-3 sticky bottom-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 z-20">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Ask any programming question (e.g. Generate FastAPI CRUD, explain Python decorators, React hooks)..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isStreaming && handleAskCodebase()}
                />
              </div>
              {isStreaming ? (
                <Button variant="danger" onClick={handleStopStreaming} leftIcon={<StopCircle className="w-4 h-4" />}>
                  Stop
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  onClick={() => handleAskCodebase()}
                  isLoading={isStreaming}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Send
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Code Reference Modal */}
      <Modal
        isOpen={!!selectedReference}
        onClose={() => setSelectedReference(null)}
        title={`Code Reference: ${selectedReference?.file || selectedReference?.source}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">File: <strong className="text-slate-200 font-mono">{selectedReference?.file}</strong></span>
            {selectedReference?.lineRange && <Badge variant="amber">{selectedReference.lineRange}</Badge>}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-cyan-300 leading-relaxed overflow-x-auto">
            <code>{selectedReference?.snippet || 'Code snippet content preview'}</code>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setSelectedReference(null)}>
              Close Code Preview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
