'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
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
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-100'
                }`}
              >
                {message.content}
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
