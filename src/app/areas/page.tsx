'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { AreaCard } from '@/components/AreaCard';
import { Plus, Grid } from 'lucide-react';
import { Area } from '@/types';

// Mock data
const mockAreas: Area[] = [
  {
    id: '1',
    user_id: 'user1',
    title: 'Home Improvement',
    description: 'Deck building, roofing, siding, and structural renovation projects with best practices and materials.',
    icon: 'Home',
    color: '#8b5cf6',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'user1',
    title: 'Landscaping & Outdoor',
    description: 'Fence installation, composite materials, garden design, and outdoor living spaces.',
    icon: 'Leaf',
    color: '#06b6d4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    user_id: 'user1',
    title: 'Building Codes & Permits',
    description: 'Local regulations, permit requirements, inspections, and compliance documentation.',
    icon: 'CheckCircle',
    color: '#ec4899',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    user_id: 'user1',
    title: 'Energy Efficiency',
    description: 'Solar installation, HVAC systems, insulation, and sustainable home technologies.',
    icon: 'Zap',
    color: '#f59e0b',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    user_id: 'user1',
    title: 'Contractors & Services',
    description: 'Professional services, contractor reviews, pricing benchmarks, and vendor management.',
    icon: 'Users',
    color: '#10b981',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    user_id: 'user1',
    title: 'Budget & Finance',
    description: 'Project costs, ROI analysis, financing options, and expense tracking.',
    icon: 'DollarSign',
    color: '#ef4444',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function AreasPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [areas, setAreas] = useState(mockAreas);

  const filteredAreas = areas.filter(
    (area) =>
      area.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteArea = (id: string) => {
    setAreas(areas.filter((area) => area.id !== id));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Workspaces</h1>
          <p className="text-slate-400">Organize your knowledge into distinct workspaces</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium">
          <Plus size={20} />
          New Workspace
        </button>
      </div>

      {/* Search */}
      <div className="mb-8 max-w-md">
        <SearchBar placeholder="Search areas..." onSearch={setSearchQuery} />
      </div>

      {/* Stats */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Grid size={20} />
          <span>{filteredAreas.length} areas</span>
        </div>
      </div>

      {/* Areas Grid */}
      {filteredAreas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAreas.map((area) => (
            <AreaCard key={area.id} area={area} onDelete={handleDeleteArea} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No areas found matching your search.</p>
        </div>
      )}
    </div>
  );
}
