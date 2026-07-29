'use client';

import { useState } from 'react';
import { ExternalLink, Send } from 'lucide-react';

interface SourceItem {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  topics: string[];
  sourceType: string;
  uploadDate: string;
  fileName: string;
  extractedMetadata: Record<string, unknown>;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  sources?: SourceItem[];
  webSearchSuggestion?: string | null;
  notFoundInVault?: boolean;
}

interface ChatPanelProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
}

export function ChatPanel({ messages = [], onSendMessage, isLoading = false }: ChatPanelProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage?.(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <p className="text-sm">Start a conversation about your research</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>

                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <details className="mt-3 rounded border border-slate-600 bg-slate-800/70 p-2">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Sources ({message.sources.length})
                    </summary>
                    <div className="mt-2 space-y-2">
                      {message.sources.map((source) => (
                        <div key={source.id} className="rounded border border-slate-600 bg-slate-900/50 p-2">
                          <p className="text-xs font-semibold text-white">{source.title}</p>
                          <p className="mt-1 text-xs text-slate-300 line-clamp-3">{source.summary}</p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {source.fileName} • {source.sourceType.replace('_', ' ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {message.role === 'assistant' && message.notFoundInVault && message.webSearchSuggestion && (
                  <a
                    href={message.webSearchSuggestion}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded border border-slate-500 px-3 py-1 text-xs text-slate-200 hover:bg-slate-600"
                  >
                    <ExternalLink size={12} />
                    Optional Web Search
                  </a>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-100 px-4 py-2 rounded-lg">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask something..."
            disabled={isLoading}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
