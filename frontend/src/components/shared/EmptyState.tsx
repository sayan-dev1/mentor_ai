import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  suggestions?: string[];
  onSelectSuggestion?: (suggestion: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  suggestions,
  onSelectSuggestion,
}) => {
  return (
    <Card className="flex flex-col items-center justify-center text-center p-8 sm:p-12 my-6 border-dashed border-slate-700/60 bg-slate-900/30">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10 animate-pulse-glow">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">{description}</p>
      
      {actionText && onAction && (
        <Button variant="gradient" onClick={onAction} className="mb-6">
          {actionText}
        </Button>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="w-full max-w-lg pt-4 border-t border-white/5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Suggested Prompts to Try:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion?.(item)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 transition-all text-left"
              >
                💡 {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
