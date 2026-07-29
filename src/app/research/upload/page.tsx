'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DocumentUploadPanel } from '@/components/DocumentUploadPanel';

export default function ResearchUploadPage() {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <Link
          href="/research"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Research Library
        </Link>
        <h1 className="text-4xl font-bold text-white">Upload Research Document</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Add source documents to Supabase Storage, process them into structured Knowledge
          Cards, and make them available in the library as soon as processing completes.
        </p>
      </div>

      <DocumentUploadPanel showLibraryLink className="mb-8" />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            Stored
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Original files are uploaded to the research-files bucket and kept linked to their
            Knowledge Card.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            Extracted
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            The pipeline captures title, summary, keywords, topics, action items, people, and
            dates mentioned.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
            Reusable
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            The same ingestion path can be extended later for OCR, PLAUD transcript imports,
            website captures, and image-based uploads.
          </p>
        </div>
      </div>
    </div>
  );
}