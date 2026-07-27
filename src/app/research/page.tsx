'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { ResearchCard } from '@/components/ResearchCard';
import { UploadButton } from '@/components/UploadButton';
import { Plus, Filter } from 'lucide-react';
import { ResearchItem } from '@/types';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [research, setResearch] = useState(mockResearch);

  const filteredResearch = research.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteResearch = (id: string) => {
    setResearch(research.filter((item) => item.id !== id));
  };

  const handleUpload = (file: File) => {
    console.log('Uploaded file:', file.name);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Research Library</h1>
          <p className="text-slate-400">Explore and manage your knowledge base</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium">
          <Plus size={20} />
          Add to Library
        </button>
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
        <h2 className="text-lg font-semibold text-white mb-4">Upload Research Document</h2>
        <UploadButton onUpload={handleUpload} />
      </div>

      {/* Research Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Research Items ({filteredResearch.length})</h2>
        </div>

        {filteredResearch.length > 0 ? (
          filteredResearch.map((item) => (
            <ResearchCard key={item.id} research={item} onDelete={handleDeleteResearch} />
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
