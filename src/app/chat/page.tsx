'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatPanel } from '@/components/ChatPanel';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  sources?: MessageSource[];
  webSearchSuggestion?: string | null;
  notFoundInVault?: boolean;
}

interface MessageSource {
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

interface AskApiResponse {
  data?: {
    answer: string;
    sources: MessageSource[];
    notFoundInVault: boolean;
    webSearchSuggestion: string | null;
  };
  error?: string;
}

export default function ChatPage() {
  const [hydratedPrompt, setHydratedPrompt] = useState<string | null>(null);
  const handledPrompts = useRef<Set<string>>(new Set());
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Deck Materials Comparison',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      title: 'Roof Installation Best Practices',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ]);

  const [currentConversationId, setCurrentConversationId] = useState<string | null>('1');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>({
    '1': [
      {
        id: '1',
        content: 'What are the pros and cons of composite decking materials?',
        role: 'user',
        createdAt: new Date(),
      },
      {
        id: '2',
        content:
          'Composite decking offers excellent durability, low maintenance, and resistance to rot and insects. However, it tends to be more expensive upfront than wood and can soften in extreme heat. It is an ideal choice if you prioritize longevity and minimal upkeep.',
        role: 'assistant',
        createdAt: new Date(),
      },
    ],
    '2': [],
  });

  const messages = currentConversationId ? (conversationMessages[currentConversationId] ?? []) : [];

  const requestAssistantReply = async (
    question: string,
    conversationId: string,
    history: Message[]
  ) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history: history.map((item) => ({ role: item.role, content: item.content })),
        }),
      });

      const payload = (await response.json()) as AskApiResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? 'Ask AI request failed.');
      }

      const citedTitles = payload.data.sources.map((source) => source.title).join(', ');
      const content =
        payload.data.sources.length > 0
          ? `${payload.data.answer}\n\nCited documents: ${citedTitles}`
          : payload.data.answer;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content,
        role: 'assistant',
        createdAt: new Date(),
        sources: payload.data.sources,
        webSearchSuggestion: payload.data.webSearchSuggestion,
        notFoundInVault: payload.data.notFoundInVault,
      };

      setConversationMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), assistantMessage],
      }));
    } catch (error) {
      const fallbackMessage: Message = {
        id: `assistant-error-${Date.now()}`,
        content:
          error instanceof Error
            ? `Ask AI error: ${error.message}`
            : 'Ask AI failed due to an unknown error.',
        role: 'assistant',
        createdAt: new Date(),
      };

      setConversationMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), fallbackMessage],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get('prompt');
    if (!prompt || prompt === hydratedPrompt || handledPrompts.current.has(prompt)) {
      return;
    }
    handledPrompts.current.add(prompt);
    setHydratedPrompt(prompt);

    const promptConversationId = `prompt-${encodeURIComponent(prompt).slice(0, 80)}`;

    const prefixedMessage: Message = {
      id: `message-${promptConversationId}`,
      content: prompt,
      role: 'user',
      createdAt: new Date(),
    };

    const autoConversation: Conversation = {
      id: promptConversationId,
      title: 'Ask AI from Research Library',
      createdAt: new Date(),
    };

    setConversations((prev) => {
      if (prev.some((conversation) => conversation.id === promptConversationId)) {
        return prev;
      }

      return [autoConversation, ...prev];
    });

    let historyForPrompt: Message[] = [];
    setConversationMessages((prev) => {
      const existing = prev[promptConversationId] ?? [];
      if (existing.some((item) => item.id === prefixedMessage.id)) {
        historyForPrompt = existing;
        return prev;
      }

      const updated = [...existing, prefixedMessage];
      historyForPrompt = updated;
      return {
        ...prev,
        [promptConversationId]: updated,
      };
    });

    setCurrentConversationId(autoConversation.id);
    void requestAssistantReply(prompt, promptConversationId, historyForPrompt);
  }, [hydratedPrompt]);

  const handleSendMessage = (message: string) => {
    let targetConversationId = currentConversationId;
    if (!targetConversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: 'New Conversation',
        createdAt: new Date(),
      };

      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      targetConversationId = newConversation.id;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      createdAt: new Date(),
    };

    let requestHistory: Message[] = [];
    const conversationId = targetConversationId;
    setConversationMessages((prev) => {
      const existing = prev[conversationId] ?? [];
      const updated = [...existing, userMessage];
      requestHistory = updated;
      return {
        ...prev,
        [conversationId]: updated,
      };
    });

    void requestAssistantReply(message, conversationId, requestHistory);
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      createdAt: new Date(),
    };
    setConversations([newConversation, ...conversations]);
    setCurrentConversationId(newConversation.id);
    setConversationMessages((prev) => ({
      ...prev,
      [newConversation.id]: [],
    }));
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(conversations.filter((c) => c.id !== id));
    setConversationMessages((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus size={20} />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                currentConversationId === conversation.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-700 text-slate-300'
              }`}
              onClick={() => setCurrentConversationId(conversation.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conversation.title}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {conversation.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conversation.id);
                  }}
                  className="p-1 hover:bg-slate-600 rounded transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col p-8">
        {currentConversationId ? (
          <ChatPanel
            messages={messages.map((msg) => ({
              id: msg.id,
              content: msg.content,
              role: msg.role,
              createdAt: msg.createdAt,
              sources: msg.sources,
              webSearchSuggestion: msg.webSearchSuggestion,
              notFoundInVault: msg.notFoundInVault,
            }))}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-medium mb-2">No conversation selected</p>
            <p className="text-sm">Create a new chat or select one from the list to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
