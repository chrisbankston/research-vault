'use client';

import { ResearchItem } from '@/types';
import { ExternalLink, Trash2, FileText } from 'lucide-react';

interface ResearchCardProps {
  research: ResearchItem;
  onDelete?: (id: string) => void;
}

export function ResearchCard({ research, onDelete }: ResearchCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{research.title}</h3>
            {research.source_url && (
              <a
                href={research.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-1"
              >
                <ExternalLink size={14} />
                Source
              </a>
            )}
          </div>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(research.id)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-red-400 flex-shrink-0"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <p className="text-slate-400 text-sm line-clamp-3">{research.content}</p>
    </div>
  );
}
