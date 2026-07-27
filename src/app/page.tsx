'use client';

import { Search, BookOpen, FileText, MessageSquare, Plus, ChevronRight, FileUp, Lightbulb, Clock } from 'lucide-react';
import { useState } from 'react';

const timelineItems = [
  {
    id: 1,
    time: '10:42 AM',
    type: 'AUDIO',
    title: 'Roofing Material Comparison Notes',
    description: 'PLAUD Recording - Comparison between asphalt and metal roofing',
  },
  {
    id: 2,
    time: '9:51 AM',
    type: 'PDF',
    title: 'Deck Construction Guide 2024',
    description: 'Step-by-step guide for building composite decks',
  },
  {
    id: 3,
    time: '8:23 AM',
    type: 'ARTICLE',
    title: 'Best Fence Stains for Climate Control',
    description: 'Research on weather-resistant fence treatments',
  },
];

const yesterdayItems = [
  {
    id: 4,
    time: '2:15 PM',
    type: 'ARTICLE',
    title: 'Energy-Efficient Home Improvements',
    description: 'Latest trends in sustainable home upgrades',
  },
  {
    id: 5,
    time: '11:30 AM',
    type: 'AUDIO',
    title: 'Contractor Interview - Solar Installation',
    description: 'PLAUD Recording - Discussion on residential solar options',
  },
  {
    id: 6,
    time: '9:00 AM',
    type: 'PDF',
    title: 'Building Permits Checklist',
    description: 'Complete guide to local construction requirements',
  },
];

const cards = [
  {
    icon: BookOpen,
    title: 'Workspaces',
    description: 'Organize research by topic',
    color: 'from-purple-600 to-purple-900',
    textColor: 'text-purple-400',
  },
  {
    icon: FileText,
    title: 'Research Library',
    description: 'Explore your knowledge base',
    color: 'from-blue-600 to-blue-900',
    textColor: 'text-blue-400',
  },
  {
    icon: MessageSquare,
    title: 'Ask Research Vault',
    description: 'Query your knowledge with AI',
    color: 'from-cyan-600 to-cyan-900',
    textColor: 'text-cyan-400',
  },
  {
    icon: FileUp,
    title: 'Capture',
    description: 'Add documents and notes',
    color: 'from-emerald-600 to-emerald-900',
    textColor: 'text-emerald-400',
  },
];

function TimelineItem({ item, isFirst }: { item: typeof timelineItems[0]; isFirst: boolean }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'AUDIO':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'ARTICLE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="relative flex gap-4 pb-8">
      <div className="relative">
        <div className="w-3 h-3 bg-blue-500 rounded-full mt-2" />
        {!isFirst && <div className="absolute top-3 left-1 w-0.5 h-8 bg-slate-700" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-semibold text-slate-500">{item.time}</span>
          <span className={`text-xs font-bold px-2 py-1 rounded border ${getTypeColor(item.type)}`}>
            {item.type}
          </span>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-blue-500/30 transition-colors cursor-pointer">
          <h4 className="text-sm font-semibold text-white">{item.title}</h4>
          <p className="text-xs text-slate-400 mt-2">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">Research Vault</h1>
              <p className="text-slate-400 text-lg">Your AI-powered knowledge management system</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-lg hover:shadow-blue-600/50">
              <Plus size={22} />
              New Capture
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Ask anything or search your knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Quick Action Cards */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${card.color} p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 border border-slate-700/30 hover:border-slate-600/50`}
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className={`w-12 h-12 ${card.textColor} mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                    <p className="text-slate-300 text-sm mb-4">{card.description}</p>
                    <div className="flex items-center text-slate-400 group-hover:text-slate-300 transition-colors">
                      <span className="text-sm font-medium">Explore</span>
                      <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <Clock size={24} className="text-blue-400" />
              Your Captures
            </h2>
            <p className="text-slate-400">Recently added to your knowledge base</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-6 text-slate-300">Today</h3>
                <div className="relative">
                  {timelineItems.map((item, idx) => (
                    <TimelineItem key={item.id} item={item} isFirst={idx === 0} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-6 text-slate-300">Yesterday</h3>
                <div className="relative">
                  {yesterdayItems.map((item, idx) => (
                    <TimelineItem key={item.id} item={item} isFirst={idx === 0} />
                  ))}
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6 h-fit">
              <div className="flex items-start gap-3 mb-4">
                <Lightbulb size={24} className="text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-semibold mb-2">Knowledge Tips</h4>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li>• Use the Capture button to add new documents</li>
                    <li>• Ask Research Vault questions about your knowledge</li>
                      <li>• Organize captures into Workspaces</li>
                    <li>• Search across all your research instantly</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
