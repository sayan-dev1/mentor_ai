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
import { toast } from 'sonner';

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
