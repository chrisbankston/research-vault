'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import dynamic from 'next/dynamic';
import { Plus, Filter } from 'lucide-react';
import { KnowledgeCard, ResearchItem } from '@/types';
import { useRouter } from 'next/navigation';

const ResearchCard = dynamic(
  () => import('@/components/ResearchCard').then((module) => module.ResearchCard),
  {
    ssr: false,
    loading: () => <div className="h-44 rounded-lg border border-slate-700 bg-slate-800" />,
  }
);

const DocumentUploadPanel = dynamic(
  () => import('@/components/DocumentUploadPanel').then((module) => module.DocumentUploadPanel),
  {
    ssr: false,
    loading: () => <div className="h-56 rounded-2xl border border-slate-700 bg-slate-800/70" />,
  }
);

// Mock data
const mockResearch: ResearchItem[] = [
  {
    id: '1',
    topic_id: 'topic1',
    title: 'Professional Composite Decking vs. Traditional Wood',
    content: 'Comprehensive comparison of modern composite materials versus traditional wood, including maintenance, lifespan, and cost analysis.',
    source_url: 'https://www.compositedeck.org',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    topic_id: 'topic2',
    title: 'Metal Roofing Installation Guide 2024',
    content: 'Step-by-step installation procedures for residential metal roofing, including materials, tools, and weather considerations.',
    source_url: 'https://www.roofingmaterials.org',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    topic_id: 'topic3',
    title: 'Building Permit Checklist by State',
    content: 'Comprehensive guide to permit requirements across different states for residential construction and renovation projects.',
    source_url: undefined,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    topic_id: 'topic1',
    title: 'Energy-Efficient Home Upgrades ROI',
    content: 'Analysis of return on investment for solar panels, HVAC upgrades, and insulation improvements.',
    source_url: 'https://www.energysavings.org',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function ResearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [research, setResearch] = useState(mockResearch);
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCard[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingCards, setLoadingCards] = useState(true);

  const upsertKnowledgeCard = (knowledgeCard: KnowledgeCard) => {
    setKnowledgeCards((prev) => {
      const remaining = prev.filter((item) => item.id !== knowledgeCard.id);
      return [knowledgeCard, ...remaining];
    });
  };

  useEffect(() => {
    const loadKnowledgeCards = async () => {
      try {
        setLoadingCards(true);
        setLoadError(null);
        const response = await fetch('/api/knowledge/cards', { cache: 'no-store' });
        const payload = (await response.json()) as { data?: KnowledgeCard[]; error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? `Knowledge cards request failed (${response.status}).`);
        }

        setKnowledgeCards(payload.data ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load knowledge cards.';
        setLoadError(message);
        console.error('Knowledge card load error:', message);
      } finally {
        setLoadingCards(false);
      }
    };

    void loadKnowledgeCards();
  }, []);

  const libraryItems = useMemo(
    () => [
      ...knowledgeCards.map((card) => ({
        id: card.id,
        title: card.title,
        summary: card.summary,
        tags: card.tags,
        sourceType: card.sourceType,
        processingStatus: card.processingStatus,
        uploadDate: card.uploadDate,
        viewOriginalHref: card.originalFilePath ? `/api/knowledge/files/${card.id}` : undefined,
        searchable: [
          card.title,
          card.summary,
          card.suggestedWorkspace,
          ...card.topics,
          ...card.tags,
          ...card.keywords,
          ...card.peopleMentioned,
          ...card.datesMentioned,
        ]
          .join(' ')
          .toLowerCase(),
      })),
      ...research.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        source_url: item.source_url,
        sourceType: 'research_item',
        uploadDate: item.created_at,
        searchable: [item.title, item.content].join(' ').toLowerCase(),
      })),
    ],
    [knowledgeCards, research]
  );

  const filteredItems = useMemo(() => {
    const normalized = searchQuery.toLowerCase();
    return libraryItems.filter((item) => item.searchable.includes(normalized));
  }, [libraryItems, searchQuery]);

  const handleDeleteResearch = (id: string) => {
    setResearch((prev) => prev.filter((item) => item.id !== id));
    setKnowledgeCards((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAskAI = (id: string) => {
    const target = filteredItems.find((item) => item.id === id);
    if (!target) {
      router.push('/chat');
      return;
    }

    const prompt = `Help me understand this document: ${target.title}`;
    router.push(`/chat?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Research Library</h1>
          <p className="text-slate-400">Explore and manage your knowledge base</p>
        </div>
        <Link
          href="/research/upload"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          Add to Library
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 max-w-md">
          <SearchBar placeholder="Search research..." onSearch={setSearchQuery} />
        </div>
        <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Filter size={20} />
          Filter
        </button>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <DocumentUploadPanel onUploaded={upsertKnowledgeCard} />
        {loadError && <p className="text-red-400 text-sm mt-2">{loadError}</p>}
      </div>

      {/* Research Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Research Items ({filteredItems.length})</h2>
        </div>

        {loadingCards ? (
          <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
            <p className="text-slate-400 text-lg">Loading research items...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <ResearchCard
              key={item.id}
              research={item}
              onDelete={handleDeleteResearch}
              onAskAI={handleAskAI}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-slate-800 border border-slate-700 rounded-lg">
            <p className="text-slate-400 text-lg">No research items found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
