'use client';

import { useState } from 'react';
import { CheckCircle2, ExternalLink, Send } from 'lucide-react';

type ChatMode = 'ask_my_vault' | 'research_anything';

interface SourceItem {
  id: string;
  title: string;
  summary?: string;
  url?: string;
  publisher?: string;
  accessDate?: string;
  snippet?: string;
  keywords?: string[];
  topics?: string[];
  sourceType?: string;
  uploadDate?: string;
  fileName?: string;
  extractedMetadata?: Record<string, unknown>;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  mode?: ChatMode;
  sources?: SourceItem[];
  webSearchSuggestion?: string | null;
  notFoundInVault?: boolean;
}

interface ChatPanelProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  researchProgressLabel?: string | null;
}

export function ChatPanel({
  messages = [],
  onSendMessage,
  isLoading = false,
  mode,
  onModeChange,
  researchProgressLabel = null,
}: ChatPanelProps) {
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
      <div className="border-b border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onModeChange('ask_my_vault')}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              mode === 'ask_my_vault'
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-slate-600 bg-slate-900 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Ask My Vault
          </button>
          <button
            type="button"
            onClick={() => onModeChange('research_anything')}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              mode === 'research_anything'
                ? 'border-teal-500 bg-teal-600 text-white'
                : 'border-slate-600 bg-slate-900 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Research Anything
          </button>
          <span className="ml-auto text-xs text-slate-400">
            {mode === 'ask_my_vault'
              ? 'Answers strictly from saved vault evidence.'
              : 'Searches the public web and saves a cited report to your vault.'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <p className="text-sm">
                {mode === 'ask_my_vault'
                  ? 'Ask questions using only your uploaded Research Vault documents.'
                  : 'Ask any research question and get a cited web report saved to your vault.'}
              </p>
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
                          {(source.summary || source.snippet) && (
                            <p className="mt-1 text-xs text-slate-300 line-clamp-3">
                              {source.summary || source.snippet}
                            </p>
                          )}
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-300 hover:text-blue-200"
                            >
                              <ExternalLink size={12} />
                              {source.publisher || source.url}
                            </a>
                          )}
                          <p className="mt-1 text-[11px] text-slate-400">
                            {source.accessDate
                              ? `Accessed ${new Date(source.accessDate).toISOString().slice(0, 10)}`
                              : `${source.fileName ?? 'vault item'} • ${(source.sourceType ?? 'unknown').replace('_', ' ')}`}
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
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                {researchProgressLabel && (
                  <span className="ml-2 text-xs text-slate-200">{researchProgressLabel}</span>
                )}
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
            placeholder={
              mode === 'ask_my_vault'
                ? 'Ask My Vault a grounded question...'
                : 'Ask a research question to search the web...'
            }
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
        {!isLoading && mode === 'research_anything' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 size={14} className="text-teal-300" />
            Research reports are automatically saved as Knowledge Cards with source_type
            web_research.
          </div>
        )}
      </div>
    </div>
  );
}
