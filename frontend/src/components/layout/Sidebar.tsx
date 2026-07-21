import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import {
  BookOpen,
  FileText,
  Briefcase,
  Code,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
  Bot
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { backendHealth } = useSession();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Layers, color: 'text-indigo-400' },
    { name: 'Study Agent', path: '/study', icon: BookOpen, color: 'text-cyan-400', badge: 'Interactive' },
    { name: 'Research Agent', path: '/research', icon: FileText, color: 'text-purple-400', badge: 'RAG' },
    { name: 'Interview Agent', path: '/interview', icon: Briefcase, color: 'text-emerald-400', badge: 'Mock AI' },
    { name: 'Codebase Agent', path: '/codebase', icon: Code, color: 'text-amber-400', badge: 'Repo Search' },
    { name: 'Settings', path: '/settings', icon: Settings, color: 'text-slate-400' },
  ];

  const isOnline = backendHealth?.status === 'ok';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between transition-all duration-300 border-r border-white/10 bg-slate-950/90 backdrop-blur-2xl',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Header & Branding */}
        <div>
          <div
            className={clsx(
              'flex items-center h-16 border-b border-white/10 relative transition-all',
              isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
            )}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                onClick={isCollapsed ? onToggleCollapse : undefined}
                className={clsx(
                  'w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0 transition-transform',
                  isCollapsed && 'cursor-pointer hover:scale-105'
                )}
                title={isCollapsed ? 'Click to expand sidebar' : undefined}
              >
                <Bot className="w-6 h-6 animate-pulse text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                    Mentor<span className="gradient-text">AI</span>
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">v1.0 Pro</span>
                </div>
              )}
            </div>

            {/* Collapse Toggle Button */}
            <button
              onClick={onToggleCollapse}
              className={clsx(
                'hidden lg:flex items-center justify-center transition-all',
                isCollapsed
                  ? 'absolute -right-3 top-5 w-6 h-6 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-full shadow-lg hover:bg-indigo-600 hover:border-indigo-500'
                  : 'p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800'
              )}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 text-white border border-indigo-500/40 shadow-lg shadow-indigo-500/10 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    )
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className={clsx('w-5 h-5 shrink-0 transition-transform group-hover:scale-110', item.color)} />

                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                      <span className="text-sm truncate">{item.name}</span>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full shadow-lg shadow-indigo-500" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Status Box */}
        <div className="p-3 border-t border-white/10">
          <div
            className={clsx(
              'p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center gap-3',
              isCollapsed && 'justify-center p-2'
            )}
          >
            <div className="relative shrink-0">
              <Activity className={clsx('w-4 h-4', isOnline ? 'text-emerald-400' : 'text-amber-400')} />
              <span
                className={clsx(
                  'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-ping',
                  isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                )}
              />
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-medium text-slate-200 truncate">
                  Backend: {isOnline ? 'Connected' : 'Offline / Mock'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  FastAPI SSE Engine
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
