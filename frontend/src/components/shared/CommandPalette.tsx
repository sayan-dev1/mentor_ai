import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Search, BookOpen, FileText, Briefcase, Code, Settings, Sparkles } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  const items = [
    { id: 'study', title: 'Study Agent', description: 'Explain topics & generate quizzes', icon: BookOpen, path: '/study' },
    { id: 'research', title: 'Research Agent', description: 'RAG question answering on documents', icon: FileText, path: '/research' },
    { id: 'interview', title: 'Interview Agent', description: 'Generate questions & answer feedback', icon: Briefcase, path: '/interview' },
    { id: 'codebase', title: 'Codebase Agent', description: 'Semantic code search & file analysis', icon: Code, path: '/codebase' },
    { id: 'settings', title: 'Settings', description: 'API status & session preferences', icon: Settings, path: '/settings' },
  ];

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Type a command or search agents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No matching agents found.</p>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent text-left transition-all group"
                >
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-500/20">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200 group-hover:text-indigo-200">
                        {item.title}
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Jump →</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
