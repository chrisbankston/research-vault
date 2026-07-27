'use client';

import { Area } from '@/types';
import { ArrowRight, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface AreaCardProps {
  area: Area;
  onDelete?: (id: string) => void;
}

export function AreaCard({ area, onDelete }: AreaCardProps) {
  const Icon = require('lucide-react')[area.icon] || null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${area.color}20`, borderColor: area.color, borderWidth: 2 }}
        >
          {Icon ? <Icon size={24} style={{ color: area.color }} /> : <span style={{ color: area.color }}>📚</span>}
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(area.id)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-red-400"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{area.title}</h3>
      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{area.description}</p>

      <Link
        href={`/areas/${area.id}`}
        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
      >
        View Topics <ArrowRight size={16} />
      </Link>
    </div>
  );
}
