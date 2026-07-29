'use client';

import { Upload } from 'lucide-react';
import { useState } from 'react';

interface UploadButtonProps {
  onUpload?: (file: File) => void;
  accept?: string;
  loading?: boolean;
  description?: string;
}

export function UploadButton({
  onUpload,
  accept = '.pdf,.doc,.docx,.txt',
  loading = false,
  description = 'PDF, DOC, DOCX, or TXT',
}: UploadButtonProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onUpload?.(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload?.(e.target.files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-500/10'
          : loading
            ? 'border-slate-700 bg-slate-800/80'
            : 'border-slate-600 hover:border-slate-500 bg-slate-700/50 hover:bg-slate-700'
      }`}
    >
      <label className={`flex flex-col items-center gap-2 ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
        <Upload size={32} className="text-slate-400" />
        <div className="text-center">
          <p className="text-white font-medium">{loading ? 'Upload in progress' : 'Drag or click to upload'}</p>
          <p className="text-slate-400 text-sm">{description}</p>
        </div>
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={loading}
          className="hidden"
        />
      </label>
    </div>
  );
}
