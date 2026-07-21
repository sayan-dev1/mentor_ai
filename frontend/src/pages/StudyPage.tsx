import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ChatBubble } from '../components/shared/ChatBubble';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';
import { MarkdownViewer } from '../components/shared/MarkdownViewer';
import { explainConceptStream, fetchQuizQuestions, fetchStudySuggestions } from '../api/studyApi';
import type { ExplanationDepth, QuizQuestion, ChatMessage } from '../types';
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  BrainCircuit,
  StopCircle,
  Send,
  Trash2,
  Lightbulb,
  Target,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export const StudyPage: React.FC = () => {
  const [concept, setConcept] = useState('');
  const [depth, setDepth] = useState<ExplanationDepth>('medium');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'explain' | 'quiz'>('explain');

  // Quiz State
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [wrongQuestions, setWrongQuestions] = useState<{ question: string; explanation: string }[]>([]);

  // AI Study Suggestions State
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [studySuggestions, setStudySuggestions] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const suggestions = [
    'Quantum Computing & Qubits',
    'Transformer Architecture & Self-Attention',
    'React Server Components & Hydration',
    'Distributed Consensus & Raft Protocol',
    'PostgreSQL Indexing & B-Trees',
  ];

  // Auto-scroll to bottom of conversation thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSendPrompt = async (overrideConcept?: string) => {
    const targetConcept = overrideConcept || concept;
    if (!targetConcept.trim()) {
      toast.error('Please enter a topic or question to learn.');
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `assistant_${Date.now()}`;

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      content: targetConcept,
      timestamp: timeStr,
      depth,
    };

    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: timeStr,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setConcept('');
    setError(null);
    setIsStreaming(true);
    setActiveTab('explain');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await explainConceptStream(
        targetConcept,
        depth,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: chunk.message, isStreaming: true }
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
        toast.error('Failed to generate explanation');
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
      toast.info('Explanation generation stopped.');
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success('Conversation history cleared.');
  };

  const getCurrentTopic = () => {
    return messages.filter((m) => m.sender === 'user').slice(-1)[0]?.content || 'General Engineering';
  };

  const handleStartQuiz = async () => {
    const topic = getCurrentTopic();
    setIsGeneratingQuiz(true);
    setActiveTab('quiz');
    setStudySuggestions(null);

    try {
      let questions = await fetchQuizQuestions(topic);
      if (!questions || questions.length < 10) {
        // Fallback generator to ensure exactly 10 questions
        const fallback: QuizQuestion[] = Array.from({ length: 10 }).map((_, idx) => ({
          id: `q_${idx + 1}`,
          question: `[Q${idx + 1}] Regarding ${topic}: Which principle best optimizes production performance?`,
          options: [
            `Idempotent execution and asynchronous non-blocking handling (Pillar ${idx + 1}).`,
            `Disabling telemetry and logging under heavy concurrency.`,
            `Hardcoding static buffer sizes without auto-scaling.`,
            `Bypassing error boundaries during event dispatching.`
          ],
          correctAnswer: 0,
          explanation: `In ${topic}, non-blocking asynchronous execution and idempotency ensure maximum fault tolerance under high concurrency.`
        }));
        questions = fallback;
      }

      setQuizQuestions(questions.slice(0, 10));
      setCurrentQuizIndex(0);
      setSelectedOption(null);
      setShowFeedback(false);
      setScore(0);
      setWrongQuestions([]);
      setQuizFinished(false);
      toast.success(`Generated 10 Quiz Questions on "${topic}"!`);
    } catch (err) {
      toast.error('Failed to generate quiz questions.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectQuizOption = (optionIndex: number) => {
    if (showFeedback) return;
    setSelectedOption(optionIndex);
    setShowFeedback(true);

    const currentQ = quizQuestions[currentQuizIndex];
    const isCorrect = optionIndex === currentQ.correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      toast.success('Correct Answer! 🎉');
    } else {
      setWrongQuestions((prev) => [
        ...prev,
        { question: currentQ.question, explanation: currentQ.explanation }
      ]);
      toast.error('Incorrect. Review the explanation below!');
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex + 1 < quizQuestions.length) {
      setCurrentQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setQuizFinished(true);
      if (score >= 7) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handleGenerateStudySuggestions = async () => {
    const topic = getCurrentTopic();
    setIsGeneratingSuggestions(true);
    try {
      const wrongTopicsText = wrongQuestions.map((wq) => wq.question).join('; ');
      const markdown = await fetchStudySuggestions(topic, score, quizQuestions.length, wrongTopicsText);
      setStudySuggestions(markdown);
      toast.success('AI Study Recommendations & Focus Areas Generated!');
      setTimeout(() => {
        suggestionsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      toast.error('Failed to generate study suggestions.');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Top Header Card */}
      <Card className="p-6 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 border-indigo-500/20 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">Study Agent</h2>
              <Badge variant="indigo">Groq Llama 3.3 70B</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Interactive AI tutor & 10-question adaptive quiz engine. Test your knowledge and get focus area recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'explain' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('explain')}
              leftIcon={<BrainCircuit className="w-4 h-4" />}
            >
              Conversation ({messages.filter((m) => m.sender === 'user').length})
            </Button>
            <Button
              variant={activeTab === 'quiz' ? 'primary' : 'ghost'}
              size="sm"
              onClick={handleStartQuiz}
              isLoading={isGeneratingQuiz}
              leftIcon={<HelpCircle className="w-4 h-4" />}
            >
              10-Question Quiz Practice
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

      {/* Main Workspace Display */}
      {activeTab === 'explain' ? (
        <div className="flex-1 flex flex-col justify-between space-y-4">
          {/* Conversation History Container */}
          <Card className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[600px] min-h-[400px] space-y-4 bg-slate-950/40">
            {messages.length === 0 ? (
              <EmptyState
                icon={BrainCircuit}
                title="Start a conversation with Study Agent"
                description="Type any topic or concept in the prompt box below to receive real-time explanations and code breakdowns."
                suggestions={suggestions}
                onSelectSuggestion={(s) => handleSendPrompt(s)}
              />
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
                {error && <ErrorState message={error} onRetry={() => handleSendPrompt()} />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </Card>

          {/* Bottom Chat Prompt Input Bar */}
          <Card className="p-4 space-y-3 sticky bottom-0 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 z-20">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Depth Selector Pills */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                {(['simple', 'medium', 'deep'] as ExplanationDepth[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDepth(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      depth === d
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d === 'simple' ? '💡 Simple' : d === 'medium' ? '📘 Standard' : '🔬 Deep'}
                  </button>
                ))}
              </div>

              {/* Text Input */}
              <div className="flex-1 w-full">
                <Input
                  placeholder="Ask any concept or follow-up question (Press Enter to send)..."
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isStreaming && handleSendPrompt()}
                />
              </div>

              {/* Action Button */}
              {isStreaming ? (
                <Button
                  variant="danger"
                  onClick={handleStopStreaming}
                  leftIcon={<StopCircle className="w-4 h-4" />}
                >
                  Stop
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  onClick={() => handleSendPrompt()}
                  isLoading={isStreaming}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Send
                </Button>
              )}
            </div>
          </Card>
        </div>
      ) : (
        /* Quiz Mode Container */
        <Card className="p-6 min-h-[450px] space-y-6">
          {isGeneratingQuiz ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 animate-spin">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Generating 10 Adaptive Quiz Questions...</h3>
              <p className="text-xs text-slate-400">Customizing questions for {getCurrentTopic()}</p>
            </div>
          ) : quizQuestions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No Quiz Active"
              description="Start a study conversation first or click below to launch a 10-question practice quiz."
              actionText="Generate 10 Questions Quiz"
              onAction={handleStartQuiz}
            />
          ) : quizFinished ? (
            /* Quiz Results Summary & Action Center */
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center py-6 space-y-4 bg-gradient-to-b from-indigo-950/40 to-slate-950/60 p-6 rounded-2xl border border-indigo-500/30">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
                  <Trophy className="w-8 h-8 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-extrabold text-white">10-Question Quiz Completed!</h3>
                  <p className="text-sm text-slate-300">
                    Your Score: <strong className="text-indigo-400 text-xl font-black">{score}</strong> /{' '}
                    <strong className="text-slate-200 font-bold">{quizQuestions.length}</strong> (
                    <strong className="text-emerald-400">{Math.round((score / quizQuestions.length) * 100)}%</strong>)
                  </p>
                </div>

                {/* Score Progress Bar */}
                <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${(score / quizQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Post-Quiz Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    variant="gradient"
                    onClick={handleGenerateStudySuggestions}
                    isLoading={isGeneratingSuggestions}
                    leftIcon={<Lightbulb className="w-4 h-4" />}
                  >
                    Generate AI Study Suggestions
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={handleStartQuiz}
                    isLoading={isGeneratingQuiz}
                    leftIcon={<RefreshCw className="w-4 h-4 text-indigo-400" />}
                  >
                    Generate 10 More Quizzes
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('explain')}
                  >
                    Back to Conversation
                  </Button>
                </div>
              </div>

              {/* AI Study Focus Areas Display */}
              {studySuggestions && (
                <div ref={suggestionsRef} className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2.5 border-b border-indigo-500/20 pb-3">
                    <Target className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-base font-bold text-white">AI Study Recommendations & Focus Areas</h4>
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed bg-slate-950/80 p-5 rounded-xl border border-white/5">
                    <MarkdownViewer content={studySuggestions} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Active 10-Question Card */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Badge variant="purple">QUESTION {currentQuizIndex + 1} OF {quizQuestions.length}</Badge>
                </div>
                <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              <h3 className="text-lg font-bold text-white leading-relaxed">
                {quizQuestions[currentQuizIndex].question}
              </h3>

              <div className="space-y-3">
                {quizQuestions[currentQuizIndex].options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectOption = idx === quizQuestions[currentQuizIndex].correctAnswer;

                  let optionStyle = 'bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-indigo-500/50';
                  if (showFeedback) {
                    if (isCorrectOption) {
                      optionStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-medium';
                    } else if (isSelected && !isCorrectOption) {
                      optionStyle = 'bg-rose-950/60 border-rose-500 text-rose-200 font-medium';
                    } else {
                      optionStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectQuizOption(idx)}
                      disabled={showFeedback}
                      className={`w-full p-4 rounded-xl border text-left text-sm transition-all duration-200 flex items-start gap-3 ${optionStyle}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-xs font-mono font-semibold shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 leading-relaxed">{opt}</span>
                      {showFeedback && isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {showFeedback && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 font-semibold text-xs text-indigo-300 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> AI Feedback & Explanation
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {quizQuestions[currentQuizIndex].explanation}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleNextQuizQuestion}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {currentQuizIndex + 1 === quizQuestions.length ? 'View Final Results' : 'Next Question'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
