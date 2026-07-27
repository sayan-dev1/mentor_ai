import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useSession } from '../../contexts/SessionContext';
import {
  Search,
  Sun,
  Moon,
  Monitor,
  Menu,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from '../ui/ToastNotification';

const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface TopBarProps {
  onOpenMobileMenu: () => void;
  onOpenCommandPalette: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileMenu,
  onOpenCommandPalette,
}) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { sessionId, backendHealth, resetSession, refreshHealth, isHealthChecking } = useSession();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/study':
        return { title: 'Study Agent', subtitle: 'Concept Explanations & Adaptive Quizzes' };
      case '/research':
        return { title: 'Research Agent', subtitle: 'Document RAG Engine & Citation Finder' };
      case '/interview':
        return { title: 'Interview Agent', subtitle: 'Resume & Job Analysis with Mock Questions' };
      case '/codebase':
        return { title: 'Codebase Agent', subtitle: 'Repo Semantic Search & Line References' };
      case '/settings':
        return { title: 'Settings & Preferences', subtitle: 'System Status & API Configuration' };
      default:
        return { title: 'Overview Dashboard', subtitle: 'AI Learning & Productivity Suite' };
    }
  };

  const { title, subtitle } = getPageTitle(location.pathname);
  const isOnline = backendHealth?.status === 'ok';

  const handleResetSession = () => {
    resetSession();
    toast.success('Session memory reset! A fresh session token has been generated.');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
      {/* Left Title & Mobile Menu Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            {title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 transition-all shadow-sm group"
        >
          <Search className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline font-medium">Search agents...</span>
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Ctrl+K
          </kbd>
        </button>

        {/* GitHub Repository Link Button */}
        <a
          href="https://github.com/sayan-dev1/mentor_ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition-all shadow-sm group"
          title="View GitHub Repository"
        >
          <GithubIcon className="w-3.5 h-3.5 text-slate-300 group-hover:scale-110 group-hover:text-indigo-400 transition-all shrink-0" />
          <span className="hidden sm:inline font-medium">GitHub</span>
        </a>

        {/* Connection Status Badge */}
        <button
          onClick={refreshHealth}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs transition-colors hover:border-slate-600"
          title="Click to check backend status"
        >
          {isHealthChecking ? (
            <Zap className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          ) : isOnline ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="text-[11px] text-slate-300 font-medium">
            {isOnline ? 'API Ready' : 'Local Fallback'}
          </span>
        </button>

        {/* Reset Session */}
        <button
          onClick={handleResetSession}
          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors"
          title="Reset Session Memory"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Theme Switcher Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              theme === 'dark' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Dark Theme"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              theme === 'light' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Light Theme"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              theme === 'system' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="System Theme"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
