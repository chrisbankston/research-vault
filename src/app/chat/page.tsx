'use client';

import { useState } from 'react';
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
}

export default function ChatPage() {
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

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'What are the pros and cons of composite decking materials?',
      role: 'user',
      createdAt: new Date(),
    },
    {
      id: '2',
      content: 'Composite decking offers excellent durability, low maintenance, and resistance to rot and insects. However, it tends to be more expensive upfront than wood and can soften in extreme heat. It&apos;s an ideal choice if you prioritize longevity and minimal upkeep.',
      role: 'assistant',
      createdAt: new Date(),
    },
  ]);

  const handleSendMessage = (message: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      createdAt: new Date(),
    };
    setMessages([...messages, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'This is a simulated response. Integrate with your OpenAI API for real responses.',
        role: 'assistant',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      createdAt: new Date(),
    };
    setConversations([newConversation, ...conversations]);
    setCurrentConversationId(newConversation.id);
    setMessages([]);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(conversations.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
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
            }))}
            onSendMessage={handleSendMessage}
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
