'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react';
import { UploadButton } from '@/components/UploadButton';
import { cn } from '@/lib/utils';
import type { KnowledgeCard } from '@/types';

interface UploadResponse {
  data?: KnowledgeCard;
  error?: string;
}

interface DocumentUploadPanelProps {
  onUploaded?: (knowledgeCard: KnowledgeCard) => void;
  showLibraryLink?: boolean;
  className?: string;
}

const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];

const isAcceptedFile = (fileName: string): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? ACCEPTED_EXTENSIONS.includes(extension) : false;
};

const tryParseUploadResponse = (value: string): UploadResponse => {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value) as UploadResponse;
  } catch {
    return {};
  }
};

export function DocumentUploadPanel({
  onUploaded,
  showLibraryLink = false,
  className,
}: DocumentUploadPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'processing'>('idle');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== 'processing') {
      return;
    }

    const interval = setInterval(() => {
      setProgress((previous) => (previous < 98 ? previous + 1 : previous));
    }, 350);

    return () => clearInterval(interval);
  }, [phase]);

  const resetMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleUpload = (file: File) => {
    if (!isAcceptedFile(file.name)) {
      setErrorMessage('Unsupported file type. Upload PDF, DOCX, TXT, or Markdown files.');
      setSuccessMessage(null);
      return;
    }

    resetMessages();
    setUploading(true);
    setProgress(0);
    setPhase('uploading');
    setSelectedFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/knowledge/upload');

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const uploadProgress = Math.round((event.loaded / event.total) * 90);
      setProgress(uploadProgress);
      if (uploadProgress >= 90) {
        setPhase('processing');
      }
    });

    xhr.addEventListener('load', () => {
      const payload = tryParseUploadResponse(xhr.responseText);

      if (xhr.status >= 200 && xhr.status < 300 && payload.data) {
        setProgress(100);
        setPhase('idle');
        setSuccessMessage(`Processed ${file.name} and added it to the Research Library.`);
        onUploaded?.(payload.data);
      } else {
        setPhase('idle');
        setErrorMessage(payload.error ?? 'Upload failed.');
      }

      setUploading(false);
    });

    xhr.addEventListener('error', () => {
      setUploading(false);
      setPhase('idle');
      setErrorMessage('Upload failed due to a network error.');
    });

    xhr.send(formData);
  };

  const statusMessage = uploading
    ? phase === 'uploading'
      ? `Uploading ${selectedFileName ?? 'document'}... ${Math.min(progress, 90)}%`
      : `Upload complete. Verifying storage integrity and processing ${selectedFileName ?? 'document'}...`
    : successMessage;

  return (
    <div className={cn('rounded-2xl border border-slate-700 bg-slate-800/70 p-6', className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Intelligent Document Upload</h2>
          <p className="mt-1 text-sm text-slate-400">
            Drag in research files and Research Vault will store the original, extract metadata,
            and create a Knowledge Card automatically.
          </p>
        </div>
        <div className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-300">
          PDF, DOCX, TXT, MD
        </div>
      </div>

      <UploadButton
        onUpload={handleUpload}
        loading={uploading}
        accept=".pdf,.docx,.txt,.md"
        description="PDF, DOCX, TXT, or Markdown"
      />

      <div className="mt-4 space-y-3">
        {selectedFileName && (
          <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            <span className="truncate">{selectedFileName}</span>
            <span>{uploading ? `${Math.min(progress, 99)}%` : 'Ready'}</span>
          </div>
        )}

        {uploading && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
              <LoaderCircle size={16} className="animate-spin" />
              <span>{statusMessage}</span>
            </div>
          </div>
        )}

        {!uploading && successMessage && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
            {showLibraryLink && (
              <Link href="/research" className="mt-2 inline-flex text-xs font-medium text-emerald-200 hover:text-white">
                View in Research Library
              </Link>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <div className="flex items-center gap-2">
              <TriangleAlert size={16} />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}