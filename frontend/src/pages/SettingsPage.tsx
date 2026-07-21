import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useSession } from '../contexts/SessionContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Settings,
  Activity,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Database,
  Layers,
  ShieldCheck,
  Zap,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { sessionId, backendHealth, resetSession, refreshHealth, isHealthChecking } = useSession();
  const { theme, setTheme } = useTheme();

  const isOnline = backendHealth?.status === 'ok';

  const handleResetSession = () => {
    resetSession();
    toast.success('Session reset! All temporary memory stores cleared.');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/60 border-slate-700/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">System Settings & Status</h2>
            <Badge variant="indigo">v1.0 Architecture</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Manage your session memory, review active backend connection states, and configure application themes.
          </p>
        </div>
      </Card>

      {/* Backend & Session Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend Connection Status */}
        <Card className="p-6 space-y-4">
          <CardHeader>
            <CardTitle>
              <Activity className="w-5 h-5 text-indigo-400" /> Backend API Connection
            </CardTitle>
            <CardDescription>FastAPI Uvicorn SSE Server Status</CardDescription>
          </CardHeader>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/5">
              <span className="text-xs text-slate-400">Endpoint Health</span>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Badge variant="emerald" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                    HEALTHY (200 OK)
                  </Badge>
                ) : (
                  <Badge variant="amber" icon={<AlertCircle className="w-3.5 h-3.5" />}>
                    OFFLINE / MOCK MODE
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/5 text-xs">
              <span className="text-slate-400">Target Backend Base</span>
              <span className="font-mono text-indigo-300">http://127.0.0.1:8000/api</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/5 text-xs">
              <span className="text-slate-400">Service Name</span>
              <span className="font-mono text-slate-200">{backendHealth?.service || 'mentorai-backend'}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshHealth}
              isLoading={isHealthChecking}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
            >
              Recheck API Health
            </Button>
          </div>
        </Card>

        {/* Session Memory Manager */}
        <Card className="p-6 space-y-4">
          <CardHeader>
            <CardTitle>
              <Database className="w-5 h-5 text-purple-400" /> Session & Memory Store
            </CardTitle>
            <CardDescription>In-Memory Session UUID Management</CardDescription>
          </CardHeader>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/5 text-xs">
              <span className="text-slate-400">Active Session Token</span>
              <span className="font-mono text-purple-300 truncate max-w-[200px]">{sessionId}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/5 text-xs">
              <span className="text-slate-400">FAISS Indexing</span>
              <Badge variant="purple">Per-Session In-Memory</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/5 text-xs">
              <span className="text-slate-400">Storage Security</span>
              <span className="text-slate-300">Zero Persistent DB Required</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="danger"
              size="sm"
              onClick={handleResetSession}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Session ID
            </Button>
          </div>
        </Card>
      </div>

      {/* LLM & Theme Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LLM Provider Configuration */}
        <Card className="p-6 space-y-4">
          <CardHeader>
            <CardTitle>
              <Cpu className="w-5 h-5 text-cyan-400" /> LLM Provider Engine
            </CardTitle>
            <CardDescription>Provider-Agnostic Abstraction Layer</CardDescription>
          </CardHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/5">
              <span className="text-slate-400">Default LLM Provider</span>
              <Badge variant="cyan">Google Gemini 2.5 Flash</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/5">
              <span className="text-slate-400">Supported Fallbacks</span>
              <span className="text-slate-300 font-mono">OpenRouter, Groq, Claude, OpenAI</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/5">
              <span className="text-slate-400">Streaming Protocol</span>
              <span className="text-slate-300 font-mono">Server-Sent Events (SSE)</span>
            </div>
          </div>
        </Card>

        {/* Visual Appearance & Theme */}
        <Card className="p-6 space-y-4">
          <CardHeader>
            <CardTitle>
              <Sun className="w-5 h-5 text-amber-400" /> Visual Theme Preference
            </CardTitle>
            <CardDescription>Dark Mode First with Dynamic Glassmorphism</CardDescription>
          </CardHeader>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                theme === 'dark'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span className="text-xs">Dark Mode</span>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                theme === 'light'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-400" />
              <span className="text-xs">Light Mode</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                theme === 'system'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-5 h-5 text-cyan-400" />
              <span className="text-xs">System Theme</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
