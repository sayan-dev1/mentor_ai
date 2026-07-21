import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/shared/StatCard';
import { useSession } from '../contexts/SessionContext';
import {
  BookOpen,
  FileText,
  Briefcase,
  Code,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Bot
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId, backendHealth } = useSession();
  const isOnline = backendHealth?.status === 'ok';

  const agents = [
    {
      id: 'study',
      name: 'Study Agent',
      title: 'Accelerated Concept Learning',
      description: 'Break down complex topics into digestible explanations with customizable depth and interactive quizzes.',
      icon: BookOpen,
      color: 'from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/30',
      badge: 'Direct Prompting',
      path: '/study',
      features: ['Multi-depth explanations', 'Adaptive quiz generator', 'Code & equation syntax'],
    },
    {
      id: 'research',
      name: 'Research Agent',
      title: 'Document Intelligence & RAG',
      description: 'Upload PDFs, Word docs, or specs and get accurate context-aware answers with source citations.',
      icon: FileText,
      color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
      badge: 'RAG + FAISS',
      path: '/research',
      features: ['PDF & DOCX parsing', 'In-memory semantic search', 'Interactive citation jumping'],
    },
    {
      id: 'interview',
      name: 'Interview Agent',
      title: 'Mock Technical Interviewer',
      description: 'Analyze your resume against job descriptions, generate tailored questions, and receive detailed AI feedback.',
      icon: Briefcase,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      badge: 'STAR Method',
      path: '/interview',
      features: ['Resume & JD matching', 'Real-time answer scoring', 'Strengths & improvement suggestions'],
    },
    {
      id: 'codebase',
      name: 'Codebase Agent',
      title: 'Repository & Code Q&A',
      description: 'Understand foreign codebases, investigate bugs, and ask architecture questions with exact line references.',
      icon: Code,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
      badge: 'Code RAG',
      path: '/codebase',
      features: ['Directory tree viewer', 'Multi-language support', 'Line-level code references'],
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-white/10 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Productivity Suite
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Supercharge Learning & Development with <span className="gradient-text">MentorAI</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Four specialized AI agents operating on a provider-agnostic engine designed for concept mastery, document research, interview readiness, and code analysis.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              variant="gradient"
              size="lg"
              onClick={() => navigate('/study')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start Learning Now
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/settings')}
            >
              View System Specs
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Session"
          value={sessionId.slice(0, 14) + '...'}
          subtitle="In-memory temporary store"
          icon={Bot}
          variant="indigo"
        />
        <StatCard
          title="Backend API"
          value={isOnline ? 'Online' : 'Fallback Mode'}
          subtitle={isOnline ? 'FastAPI SSE Active' : 'Simulated Streaming'}
          icon={Activity}
          variant={isOnline ? 'emerald' : 'amber'}
        />
        <StatCard
          title="AI Agents"
          value="4 Ready"
          subtitle="Study, Research, Interview, Code"
          icon={Zap}
          variant="cyan"
        />
        <StatCard
          title="Security"
          value="Provider Agnostic"
          subtitle="Gemini 2.5 Flash active"
          icon={ShieldCheck}
          variant="purple"
        />
      </div>

      {/* Agents Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Select an AI Agent
          </h2>
          <span className="text-xs text-slate-400">Click any card to launch workspace</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <Card
                key={agent.id}
                hoverable
                onClick={() => navigate(agent.path)}
                className="cursor-pointer group flex flex-col justify-between p-6 relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br border ${agent.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="indigo" size="sm">{agent.badge}</Badge>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                      {agent.name}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-400" />
                    </h3>
                    <p className="text-xs font-semibold text-slate-300 mt-0.5">{agent.title}</p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{agent.description}</p>
                  </div>

                  <ul className="space-y-1.5 pt-2 border-t border-white/5">
                    {agent.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[11px] text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
