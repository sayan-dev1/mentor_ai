import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';
import { generateInterviewQuestions, evaluateInterviewAnswer, uploadResume, analyzeResume } from '../api/interviewApi';
import type { InterviewQAItem, UploadResumeResponse, ResumeAnalysisResponse } from '../types';
import {
  Briefcase,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Award,
  Send,
  Zap,
  Sparkles,
  Trash2,
  FileCheck,
  Target,
  Lightbulb,
  Wrench,
  FastForward,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export const InterviewPage: React.FC = () => {
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [uploadedResumeMeta, setUploadedResumeMeta] = useState<UploadResumeResponse | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [questionsList, setQuestionsList] = useState<InterviewQAItem[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [userAnswerInput, setUserAnswerInput] = useState('');
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailEndRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const sampleTemplates = [
    {
      title: 'Senior Frontend Engineer',
      resume: `5+ years experience building React, TypeScript, and Vite web applications. Deep expertise in TailwindCSS, web performance optimization, state management, and SSE streaming.`,
      jd: `Looking for a Senior Frontend Engineer to build high-performance AI web applications. Must demonstrate mastery of React 19, TypeScript, responsive UX design, and real-time streaming architectures.`,
    },
    {
      title: 'AI Systems Architect',
      resume: `Lead AI Engineer with experience designing Python FastAPI backends, local vector databases (FAISS), RAG pipelines, and multi-provider LLM integrations (Gemini, Claude, OpenAI).`,
      jd: `Seeking an AI Systems Architect to build scalable backend RAG engines, session memory stores, and provider-agnostic abstractions for enterprise clients.`,
    },
  ];

  // Auto-scroll to bottom of feedback pane
  useEffect(() => {
    detailEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [questionsList, activeQuestionId, evaluatingQuestionId]);

  const handleResumeFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Resume file size exceeds the 10 MB maximum limit.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
      toast.error('Unsupported file format. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    setIsUploadingResume(true);
    setResumeAnalysis(null);
    try {
      const res = await uploadResume(file);
      setUploadedResumeMeta(res);
      setResume(res.extracted_text);
      toast.success(`Resume "${file.name}" uploaded and parsed successfully!`);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to upload and parse resume.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleResumeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleResumeFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveResumeFile = () => {
    setUploadedResumeMeta(null);
    setResume('');
    setResumeAnalysis(null);
    toast.info('Uploaded resume removed.');
  };

  const handleApplyTemplate = (tpl: typeof sampleTemplates[0]) => {
    setUploadedResumeMeta(null);
    setResumeAnalysis(null);
    setResume(tpl.resume);
    setJobDescription(tpl.jd);
    toast.success(`Loaded "${tpl.title}" template!`);
  };

  const handleAnalyzeResume = async () => {
    if (!resume.trim()) {
      toast.error('Please upload or paste a resume before running AI insights analysis.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeResume(resume, jobDescription);
      setResumeAnalysis(result);
      toast.success('AI Resume & Role Match Analysis Generated!');
      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      toast.error('Failed to generate resume AI analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      toast.error('Please enter both your Resume and Job Description.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const res = await generateInterviewQuestions(resume, jobDescription);
      const items: InterviewQAItem[] = res.questions.slice(0, 5).map((q, idx) => ({
        id: `q_${idx + 1}_${Date.now()}`,
        question: q,
      }));
      setQuestionsList(items);
      if (items.length > 0) {
        setActiveQuestionId(items[0].id);
        setUserAnswerInput('');
      }
      toast.success('Generated 5 role-specific interview questions!');
    } catch (err) {
      setError((err as Error).message);
      toast.error('Failed to generate interview questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMoreQuestions = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      toast.error('Please enter both your Resume and Job Description.');
      return;
    }

    setIsGeneratingMore(true);
    try {
      const res = await generateInterviewQuestions(resume, jobDescription);
      const startIdx = questionsList.length;
      const newItems: InterviewQAItem[] = res.questions.slice(0, 5).map((q, idx) => ({
        id: `q_${startIdx + idx + 1}_${Date.now()}`,
        question: q,
      }));

      setQuestionsList((prev) => [...prev, ...newItems]);
      if (newItems.length > 0) {
        setActiveQuestionId(newItems[0].id);
        setUserAnswerInput('');
      }
      toast.success('Generated 5 additional interview questions!');
    } catch (err) {
      toast.error('Failed to generate additional questions.');
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleSkipQuestion = (questionItem: InterviewQAItem) => {
    setQuestionsList((prev) =>
      prev.map((item) => (item.id === questionItem.id ? { ...item, isSkipped: true } : item))
    );
    toast.info('Question skipped.');

    // Auto-advance to the next unskipped and unanswered question if available
    const nextUnanswered = questionsList.find(
      (q) => q.id !== questionItem.id && !q.feedback && !q.isSkipped
    );
    if (nextUnanswered) {
      setActiveQuestionId(nextUnanswered.id);
      setUserAnswerInput(nextUnanswered.userAnswer || '');
    }
  };

  const handleSubmitAnswer = async (questionItem: InterviewQAItem) => {
    if (!userAnswerInput.trim()) {
      toast.error('Please write an answer before submitting.');
      return;
    }

    setEvaluatingQuestionId(questionItem.id);
    try {
      const feedback = await evaluateInterviewAnswer(questionItem.question, userAnswerInput);
      setQuestionsList((prev) =>
        prev.map((item) =>
          item.id === questionItem.id
            ? { ...item, userAnswer: userAnswerInput, feedback, isSkipped: false }
            : item
        )
      );
      toast.success('Answer evaluated by Groq Llama 3.3 70B!');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEvaluatingQuestionId(null);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const activeQuestion = questionsList.find((q) => q.id === activeQuestionId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-slate-900/60 border-emerald-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Interview Agent</h2>
            <Badge variant="emerald">Groq Llama 3.3 STAR Assessment</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Upload your resume (PDF/DOCX) or paste profile text, analyze role match insights, practice 5 questions at a time, and skip or answer with AI feedback.
          </p>
        </div>
      </Card>

      {/* Input Cards: Resume & JD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resume Input & Upload Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" /> Candidate Resume / Profile
            </label>
            <span className="text-[10px] text-slate-400 font-mono">{resume.length} chars</span>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleResumeDrop}
            onClick={() => fileInputRef.current?.click()}
            className="p-4 border-dashed border-2 border-slate-700/80 hover:border-emerald-500/50 bg-slate-950/40 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleResumeFileUpload(e.target.files[0])}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />

            {isUploadingResume ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium animate-pulse py-2">
                <Sparkles className="w-4 h-4 animate-spin text-emerald-400" /> Parsing resume & extracting text...
              </div>
            ) : uploadedResumeMeta ? (
              <div className="flex items-center justify-between w-full text-xs">
                <div className="flex items-center gap-2 font-medium text-slate-200">
                  <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{uploadedResumeMeta.filename}</span>
                  <Badge variant="emerald" size="sm">
                    {uploadedResumeMeta.pages_count} {uploadedResumeMeta.pages_count === 1 ? 'Page' : 'Pages'} • {formatBytes(uploadedResumeMeta.size_bytes)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-[11px] text-slate-300 hover:text-white underline font-medium"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveResumeFile();
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-200">
                    Upload Resume (PDF, DOCX) or drag & drop
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Supported: PDF • DOCX • Max 10 MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
            <span className="relative px-2 bg-slate-900 text-[10px] uppercase font-mono text-slate-400">
              OR Manual / Extracted Resume Text
            </span>
          </div>

          {/* Editable Textarea */}
          <Textarea
            placeholder="Parsed resume text will appear here automatically. You can edit, add, or customize details anytime before generating questions..."
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            rows={5}
          />
        </Card>

        {/* Job Description Card */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-emerald-400" /> Target Job Description
            </label>
            <span className="text-[10px] text-slate-400 font-mono">{jobDescription.length} chars</span>
          </div>
          <Textarea
            placeholder="Paste target role requirements, key competencies, and job responsibilities..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={9}
          />
        </Card>
      </div>

      {/* Action Toolbar & Preset Templates */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Load Template:</span>
          {sampleTemplates.map((tpl, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyTemplate(tpl)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500/40 text-slate-300 transition-all"
            >
              💼 {tpl.title}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleAnalyzeResume}
            isLoading={isAnalyzing}
            leftIcon={<Sparkles className="w-4 h-4 text-indigo-400" />}
          >
            Analyze Resume AI Insights
          </Button>

          <Button
            variant="gradient"
            onClick={handleGenerateQuestions}
            isLoading={isGenerating || isUploadingResume}
            rightIcon={<Zap className="w-4 h-4" />}
          >
            Generate 5 Role Questions
          </Button>
        </div>
      </Card>

      {/* AI Resume Insights Panel (If Generated) */}
      {resumeAnalysis && (
        <div ref={analysisRef} className="animate-fadeIn">
          <Card className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border-indigo-500/30 space-y-6">
            {/* Insights Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    Resume & Role Fit AI Insights
                  </h3>
                  <p className="text-xs text-slate-400">AI Recruiter Evaluation & Skill Gap Breakdown</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 shadow-lg">
                  <span className="text-xs text-slate-300 font-semibold uppercase">Role Match:</span>
                  <span className="text-2xl font-black text-indigo-400">{resumeAnalysis.match_score}%</span>
                </div>
                <button
                  onClick={() => setResumeAnalysis(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Close Insights"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid of 4 Insight Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key Strengths */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 💪 Key Strengths Identified
                </h4>
                <ul className="space-y-1.5 pt-1">
                  {resumeAnalysis.key_strengths.map((str, idx) => (
                    <li key={idx} className="text-xs text-slate-200 flex items-start gap-2 leading-relaxed">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing Skills */}
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2">
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" /> ⚠️ Missing Skills & Requirements
                </h4>
                <ul className="space-y-1.5 pt-1">
                  {resumeAnalysis.missing_skills.map((skill, idx) => (
                    <li key={idx} className="text-xs text-slate-200 flex items-start gap-2 leading-relaxed">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested Improvements */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-indigo-400" /> 📌 Suggested Resume Optimizations
                </h4>
                <ul className="space-y-1.5 pt-1">
                  {resumeAnalysis.suggested_improvements.map((imp, idx) => (
                    <li key={idx} className="text-xs text-slate-200 flex items-start gap-2 leading-relaxed">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Technologies */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-3">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-cyan-400" /> 🛠 Recommended Technologies to Learn
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {resumeAnalysis.recommended_tech.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-mono font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Questions & Feedback Workspace */}
      <Card className="p-6 min-h-[380px] space-y-6">
        {error ? (
          <ErrorState message={error} onRetry={handleGenerateQuestions} />
        ) : questionsList.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Upload Resume & Enter Job Description to Start"
            description="Upload your PDF/DOCX resume above or click a template, run AI resume analysis, and generate 5 role-specific interview questions at a time."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Question List Sidebar */}
            <div className="lg:col-span-1 space-y-4 border-r border-white/10 pr-0 lg:pr-6 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Generated Questions</span>
                  <Badge variant="emerald">{questionsList.length} Items</Badge>
                </h4>

                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {questionsList.map((item, idx) => {
                    const isActive = item.id === activeQuestionId;
                    const hasAnswered = !!item.feedback;
                    const isSkipped = !!item.isSkipped;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveQuestionId(item.id);
                          setUserAnswerInput(item.userAnswer || '');
                        }}
                        className={`w-full p-3 rounded-xl border text-left text-xs transition-all space-y-1.5 ${
                          isActive
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-white font-medium shadow-md'
                            : isSkipped
                            ? 'bg-slate-950/20 border-slate-800 text-slate-500 hover:bg-slate-900'
                            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-emerald-400 font-bold">Q{idx + 1}</span>
                          {hasAnswered ? (
                            <Badge variant="emerald" size="sm">
                              Score: {item.feedback?.score}/10
                            </Badge>
                          ) : isSkipped ? (
                            <Badge variant="slate" size="sm">
                              Skipped
                            </Badge>
                          ) : null}
                        </div>
                        <p className="line-clamp-2 leading-relaxed">{item.question}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate 5 More Questions Button */}
              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateMoreQuestions}
                  isLoading={isGeneratingMore}
                  leftIcon={<Plus className="w-4 h-4 text-emerald-400" />}
                  className="w-full justify-center text-xs"
                >
                  Generate 5 More Questions
                </Button>
              </div>
            </div>

            {/* Right Question Detail & Practice Conversation Pane */}
            <div className="lg:col-span-2 space-y-6 max-h-[600px] overflow-y-auto pr-2">
              {activeQuestion ? (
                <div className="space-y-6">
                  {/* Selected Question Header */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
                        Target Interview Question
                      </span>
                      {activeQuestion.isSkipped && (
                        <Badge variant="slate" size="sm">
                          Skipped Question
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white leading-relaxed">
                      {activeQuestion.question}
                    </h3>
                  </div>

                  {/* Candidate Answer Input & Action Buttons */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Your Practice Response</span>
                      <span className="text-slate-400 font-normal">Use the STAR framework</span>
                    </label>
                    <Textarea
                      placeholder="Type your structured interview response here..."
                      value={userAnswerInput}
                      onChange={(e) => setUserAnswerInput(e.target.value)}
                      rows={5}
                    />

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSkipQuestion(activeQuestion)}
                        leftIcon={<FastForward className="w-4 h-4 text-slate-400" />}
                      >
                        Skip Question
                      </Button>

                      <Button
                        variant="gradient"
                        onClick={() => handleSubmitAnswer(activeQuestion)}
                        isLoading={evaluatingQuestionId === activeQuestion.id}
                        rightIcon={<Send className="w-4 h-4" />}
                      >
                        Submit Answer for AI Evaluation
                      </Button>
                    </div>
                  </div>

                  {/* Skipped Guidance Box */}
                  {activeQuestion.isSkipped && !activeQuestion.feedback && (
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                        <FastForward className="w-4 h-4" /> Question Skipped — Recommended STAR Strategy
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        When answering this question in a real interview, use the STAR method:
                        <strong>Situation</strong> (set the context), <strong>Task</strong> (explain your core objective), 
                        <strong>Action</strong> (detail your specific technical contributions), and 
                        <strong>Result</strong> (highlight quantifiable metrics or outcome).
                      </p>
                    </div>
                  )}

                  {/* AI Feedback Breakdown Card */}
                  {activeQuestion.feedback && (
                    <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-6 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
                        <div className="flex items-center gap-2">
                          <Award className="w-6 h-6 text-emerald-400" />
                          <div>
                            <h4 className="text-base font-bold text-white">AI Candidate Assessment</h4>
                            <p className="text-xs text-slate-400">STAR Framework Evaluation</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-2xl font-black text-emerald-400">{activeQuestion.feedback.score}</span>
                            <span className="text-xs text-slate-400">/10</span>
                          </div>
                        </div>
                      </div>

                      {/* Feedback Text */}
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-300 uppercase">Qualitative Feedback</span>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-white/5">
                          {activeQuestion.feedback.feedback}
                        </p>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                          <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Strengths Identified
                          </span>
                          <ul className="space-y-1">
                            {activeQuestion.feedback.strengths?.map((s, idx) => (
                              <li key={idx} className="text-[11px] text-slate-300">• {s}</li>
                            )) || <li className="text-[11px] text-slate-400">Good structure and clear narrative</li>}
                          </ul>
                        </div>

                        <div className="space-y-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/20">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Improvement Opportunities
                          </span>
                          <ul className="space-y-1">
                            {activeQuestion.feedback.suggestions.map((sug, idx) => (
                              <li key={idx} className="text-[11px] text-slate-300">• {sug}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={detailEndRef} />
                </div>
              ) : (
                <p className="text-xs text-slate-400">Select a question from the left sidebar.</p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
