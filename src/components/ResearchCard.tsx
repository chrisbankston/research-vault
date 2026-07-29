'use client';

import { formatDate } from '@/lib/utils';
import { ExternalLink, Trash2, FileText, MessageSquare, Clock3, TriangleAlert } from 'lucide-react';

interface ResearchCardProps {
  research: {
    id: string;
    title: string;
    content?: string;
    summary?: string;
    source_url?: string;
    tags?: string[];
    sourceType?: string;
    processingStatus?: string;
    uploadDate?: string;
    created_at?: string;
    viewOriginalHref?: string;
  };
  onDelete?: (id: string) => void;
  onAskAI?: (id: string) => void;
}

const processingBadge = (status?: string) => {
  if (status === 'failed') {
    return {
      className: 'border-red-500/30 bg-red-500/10 text-red-300',
      icon: TriangleAlert,
      label: 'Processing failed',
    };
  }

  if (status === 'processing' || status === 'uploaded') {
    return {
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      icon: Clock3,
      label: 'Processing',
    };
  }

  return null;
};

export function ResearchCard({ research, onDelete, onAskAI }: ResearchCardProps) {
  const summary = research.summary ?? research.content ?? '';
  const sourceType = research.sourceType ?? 'research';
  const uploadDate = research.uploadDate ?? research.created_at;
  const statusBadge = processingBadge(research.processingStatus);
  const canAskAi = research.processingStatus !== 'failed' && research.processingStatus !== 'processing';

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

      {statusBadge && (
        <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${statusBadge.className}`}>
          <statusBadge.icon size={14} />
          <span>{statusBadge.label}</span>
        </div>
      )}

      <p className="text-slate-400 text-sm line-clamp-3 whitespace-pre-line mb-4">{summary}</p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(research.tags ?? []).map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 text-xs rounded-full bg-slate-700 border border-slate-600 text-slate-300"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 mb-4">
        <span className="capitalize">Source: {sourceType.replace('_', ' ')}</span>
        {uploadDate && <span>Uploaded: {formatDate(uploadDate)}</span>}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onAskAI?.(research.id)}
          disabled={!canAskAi}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:hover:bg-slate-700 disabled:opacity-50 border border-slate-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
        >
          <MessageSquare size={16} />
          Ask AI
        </button>

        {research.viewOriginalHref && (
          <a
            href={research.viewOriginalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-950 border border-slate-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <ExternalLink size={16} />
            View Original
          </a>
        )}
      </div>
    </div>
  );
}
