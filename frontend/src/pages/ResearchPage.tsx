import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ChatBubble } from '../components/shared/ChatBubble';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';
import { uploadDocument, askResearchQuestionStream } from '../api/researchApi';
import type { UploadDocumentResponse, Citation, ChatMessage } from '../types';
import {
  FileText,
  UploadCloud,
  File,
  CheckCircle2,
  Sparkles,
  Send,
  BookOpen,
  StopCircle,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export const ResearchPage: React.FC = () => {
  const [uploadedDoc, setUploadedDoc] = useState<UploadDocumentResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const suggestions = [
    'What are the primary findings discussed in this document?',
    'Summarize the core methodology and architectural trade-offs.',
    'List all key requirements and performance metrics mentioned.',
    'What potential edge cases or security concerns are highlighted?',
  ];

  // Auto-scroll to bottom of conversation thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10 MB maximum limit.');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadDocument(file);
      setUploadedDoc(result);
      toast.success(`Document "${file.name}" uploaded and indexed into FAISS session memory!`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAskQuestion = async (overrideQ?: string) => {
    const q = overrideQ || question;
    if (!q.trim()) {
      toast.error('Please enter a research question.');
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
      citations: [],
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
      await askResearchQuestionStream(
        q,
        (res) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: res.answer,
                    citations: res.citations || msg.citations,
                    isStreaming: true,
                  }
                : msg
            )
          );
        },
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
        toast.error('Failed to get answer from research agent.');
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
      toast.info('Research streaming stopped.');
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success('Research chat history cleared.');
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 animate-fadeIn flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Top Header */}
      <Card className="p-6 bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-slate-900/60 border-cyan-500/20 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">Research Agent</h2>
              <Badge variant="cyan">Nemotron 3 / Groq GPT-OSS 120B Fallback</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Multi-turn document RAG chat. Upload PDF/DOCX files and ask questions with inline source citations.
            </p>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            >
              Clear History
            </Button>
          )}
        </div>
      </Card>

      {/* Document Upload Area & Metadata Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        {/* Dropzone Card */}
        <div className="lg:col-span-2">
          <Card
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="p-5 border-dashed border-2 border-slate-700/80 hover:border-cyan-500/50 bg-slate-950/40 text-center flex flex-col items-center justify-center transition-all cursor-pointer group min-h-[140px]"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-semibold text-slate-200">
              {isUploading ? 'Parsing & Indexing Document...' : 'Drag & drop document or click to browse'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              PDF, DOCX, TXT files up to 10 MB
            </p>
          </Card>
        </div>

        {/* Uploaded File Info Card */}
        <div className="lg:col-span-1">
          <Card className="p-5 h-full flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Document Status</span>
                <Badge variant={uploadedDoc ? 'emerald' : 'slate'}>
                  {uploadedDoc ? 'Indexed' : 'No Document'}
                </Badge>
              </div>

              {uploadedDoc ? (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-medium text-slate-200 truncate">
                    <File className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">{uploadedDoc.filename}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono pl-6">
                    {formatBytes(uploadedDoc.sizeBytes)} • Ready for Q&A
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Upload a document to index embeddings.
                </p>
              )}
            </div>

            {uploadedDoc && (
              <div className="pt-2 border-t border-white/5 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Change File
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Main Conversation Workspace */}
      <div className="flex-1 flex flex-col justify-between space-y-4">
        {/* Chat History Box */}
        <Card className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[500px] min-h-[350px] space-y-4 bg-slate-950/40">
          {messages.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Ask anything about your documents"
              description="Drag and drop your file above, then type questions below to converse with your document RAG index."
              suggestions={suggestions}
              onSelectSuggestion={(s) => handleAskQuestion(s)}
            />
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  onSelectCitation={(cite) => setSelectedCitation(cite)}
                />
              ))}
              {error && <ErrorState message={error} onRetry={() => handleAskQuestion()} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </Card>

        {/* Bottom Question Input Bar */}
        <Card className="p-4 space-y-3 sticky bottom-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 z-20">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Ask a question about your uploaded document (Press Enter to send)..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isStreaming && handleAskQuestion()}
              />
            </div>
            {isStreaming ? (
              <Button variant="danger" onClick={handleStopStreaming} leftIcon={<StopCircle className="w-4 h-4" />}>
                Stop
              </Button>
            ) : (
              <Button
                variant="gradient"
                onClick={() => handleAskQuestion()}
                isLoading={isStreaming}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Ask
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Citation Detail Modal */}
      <Modal
        isOpen={!!selectedCitation}
        onClose={() => setSelectedCitation(null)}
        title={`Citation Details: ${selectedCitation?.source}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Source: <strong className="text-slate-200">{selectedCitation?.source}</strong></span>
            {selectedCitation?.page && <Badge variant="cyan">Page {selectedCitation.page}</Badge>}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-300 font-mono leading-relaxed">
            {selectedCitation?.snippet || 'Full context chunk retrieved from vector store.'}
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setSelectedCitation(null)}>
              Close Citation Preview
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
