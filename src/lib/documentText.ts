import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import type { KnowledgeSourceType } from '@/types';

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'] as const;

const DOCX_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

export const RESEARCH_FILE_BUCKET = 'research-files';
export const RESEARCH_FILE_ACCEPT = SUPPORTED_EXTENSIONS.join(',');

const hasExtension = (fileName: string, extension: string): boolean => {
  return fileName.toLowerCase().endsWith(extension);
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-');
};

export const normalizeTitle = (fileName: string): string => {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const detectSourceType = (fileName: string, mimeType: string): KnowledgeSourceType => {
  const lowerFileName = fileName.toLowerCase();
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.includes('pdf') || hasExtension(lowerFileName, '.pdf')) {
    return 'pdf';
  }

  if (DOCX_MIME_TYPES.has(normalizedMimeType) || hasExtension(lowerFileName, '.docx')) {
    return 'docx';
  }

  if (hasExtension(lowerFileName, '.md') || lowerFileName.endsWith('.markdown')) {
    return 'markdown';
  }

  if (lowerFileName.includes('plaud')) {
    return 'plaud_transcript';
  }

  if (normalizedMimeType.startsWith('text/') || hasExtension(lowerFileName, '.txt')) {
    return 'text';
  }

  return 'other';
};

export const isSupportedUpload = (fileName: string, mimeType: string): boolean => {
  return detectSourceType(fileName, mimeType) !== 'other';
};

export const buildStoragePath = (documentId: string, fileName: string): string => {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}/${month}/${documentId}-${sanitizeFileName(fileName)}`;
};

export const extractTextFromFile = async (
  file: File,
  sourceType: KnowledgeSourceType
): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (sourceType === 'pdf') {
    const parsed = await pdfParse(buffer);
    return parsed.text.trim();
  }

  if (sourceType === 'docx') {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value.trim();
  }

  if (sourceType === 'markdown' || sourceType === 'plaud_transcript' || sourceType === 'text') {
    return buffer.toString('utf-8').trim();
  }

  throw new Error('Unsupported file type. Upload a PDF, DOCX, TXT, or Markdown document.');
};