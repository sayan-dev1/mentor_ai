import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';

interface MarkdownViewerProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, isStreaming = false }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(codeText);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={`prose prose-invert prose-indigo max-w-none prose-dark leading-relaxed ${isStreaming ? 'blinking-cursor' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match) {
              const isCopied = copiedCode === codeString;
              return (
                <div className="relative group my-4 rounded-xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-xl">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/10 text-xs font-mono text-slate-400">
                    <span className="uppercase text-indigo-400 font-semibold">{match[1]}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(codeString)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                      title="Copy code"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-slate-200">
                    <code className={className}>
                      {children}
                    </code>
                  </div>
                </div>
              );
            }

            return (
              <code className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-white/10 text-cyan-300 text-xs font-mono">
                {children}
              </code>
            );
          },
          blockquote({ node, children }: any) {
            return (
              <blockquote className="border-l-4 border-indigo-500 bg-indigo-500/5 px-4 py-3 my-4 rounded-r-xl text-slate-300 italic">
                {children}
              </blockquote>
            );
          },
          table({ node, children }: any) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-white/10">
                <table className="w-full text-left text-sm text-slate-300">
                  {children}
                </table>
              </div>
            );
          },
          th({ node, children }: any) {
            return <th className="bg-slate-900 px-4 py-2.5 font-semibold text-slate-100 border-b border-white/10">{children}</th>;
          },
          td({ node, children }: any) {
            return <td className="px-4 py-2.5 border-b border-white/5 bg-slate-950/30">{children}</td>;
          },
          a({ node, children, href }: any) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 font-medium transition-colors">
                {children}
              </a>
            );
          },
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};
