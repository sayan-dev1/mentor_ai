import React, { useState } from 'react';
import { MarkdownViewer } from './MarkdownViewer';
import { Badge } from '../ui/Badge';
import type { ChatMessage, Citation, CodeReference } from '../../types';
import { Bot, User, Sparkles, BookOpen, Terminal, Copy, Check } from 'lucide-react';

interface ChatBubbleProps {
  message: ChatMessage;
  onSelectCitation?: (citation: Citation) => void;
  onSelectReference?: (reference: CodeReference) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onSelectCitation,
  onSelectReference,
}) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3 my-4 animate-fadeIn">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%] space-y-1">
          <div className="flex items-center gap-2 mb-1">
            {message.depth && (
              <Badge variant="indigo" size="sm">
                {message.depth.toUpperCase()} DEPTH
              </Badge>
            )}
            <span className="text-[10px] text-slate-400 font-mono">{message.timestamp}</span>
            <span className="text-xs font-semibold text-slate-300">You</span>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 text-sm leading-relaxed rounded-tr-sm">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>

        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
          <User className="w-5 h-5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 my-4 animate-fadeIn">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
        <Bot className="w-5 h-5" />
      </div>

      <div className="flex-1 max-w-[90%] sm:max-w-[85%] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1">
              MentorAI <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{message.timestamp}</span>
            {message.isStreaming && (
              <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-medium animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                Generating...
              </span>
            )}
          </div>

          {!message.isStreaming && message.content && (
            <button
              onClick={handleCopyMessage}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>

        {/* Message Content Bubble */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl backdrop-blur-md rounded-tl-sm text-sm space-y-3">
          {message.content ? (
            <MarkdownViewer content={message.content} isStreaming={message.isStreaming} />
          ) : (
            <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse py-2">
              <Sparkles className="w-4 h-4 animate-spin" /> Thinking & generating live token stream...
            </div>
          )}

          {/* Citations list if present */}
          {message.citations && message.citations.length > 0 && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Citations & Context:
              </span>
              <div className="flex flex-wrap gap-2">
                {message.citations.map((cite, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectCitation?.(cite)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 transition-colors font-mono"
                  >
                    📄 {cite.source} {cite.page ? `(p.${cite.page})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Code references list if present */}
          {message.references && message.references.length > 0 && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-amber-400" /> Code References:
              </span>
              <div className="flex flex-wrap gap-2">
                {message.references.map((ref, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectReference?.(ref)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 hover:bg-amber-900/60 transition-colors font-mono"
                  >
                    💻 {ref.file || ref.source} {ref.lineRange ? `(${ref.lineRange})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
