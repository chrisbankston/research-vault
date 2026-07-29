import { randomUUID } from 'crypto';
import type {
  KnowledgeCardRecord,
  KnowledgeMetadata,
  KnowledgeProcessingStatus,
  KnowledgeSourceType,
} from '@/types';
import { detectSourceType, extractTextFromFile, normalizeTitle } from '@/lib/documentText';

interface ExistingKnowledgeCard {
  id: string;
  title: string;
  keywords: string[];
  tags: string[];
}

interface KnowledgeInsights extends KnowledgeMetadata {
  tags: string[];
  suggestedWorkspace: string;
}

interface PendingKnowledgeCardInput {
  id?: string;
  fileName: string;
  sourceType: KnowledgeSourceType;
  uploadDate?: string;
  originalFilePath: string;
  processingStatus?: KnowledgeProcessingStatus;
  summary?: string;
}

interface ProcessStoredDocumentInput {
  id?: string;
  file: File;
  existingCards: ExistingKnowledgeCard[];
  uploadDate?: string;
  originalFilePath: string;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is',
  'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'this', 'or',
  'we', 'they', 'you', 'your', 'our', 'their', 'but', 'not', 'can', 'into', 'than', 'then',
]);

const ACTION_LINE_REGEX = /\b(should|must|need to|next step|action|todo|follow up)\b/i;
const NAME_REGEX = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g;
const DATE_REGEX = /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?|\s+\d{4}))\b/gi;

const MAX_AI_INPUT_CHARS = 12000;

const sanitizeList = (items: string[], maxItems: number): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of items) {
    const normalized = raw.trim().replace(/\s+/g, ' ');
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    out.push(normalized);
    if (out.length >= maxItems) {
      break;
    }
  }

  return out;
};

const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
};

const inferWorkspace = (keywords: string[]): string => {
  const joined = keywords.join(' ').toLowerCase();
  if (/(client|customer|stakeholder|meeting|follow up|proposal)/.test(joined)) {
    return 'Client Delivery';
  }
  if (/(research|analysis|study|insight|evidence)/.test(joined)) {
    return 'Research';
  }
  if (/(roadmap|milestone|timeline|project|planning)/.test(joined)) {
    return 'Project Planning';
  }
  if (/(hiring|team|interview|people|culture)/.test(joined)) {
    return 'People Operations';
  }

  return 'General Workspace';
};

const toTitleCase = (value: string): string => {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const summarizeHeuristically = (text: string): string => {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  if (sentences.length === 0) {
    return 'No summary available.';
  }

  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length && paragraphs.length < 4; index += 3) {
    const paragraph = sentences.slice(index, index + 3).join(' ').trim();
    if (paragraph) {
      paragraphs.push(paragraph);
    }
  }

  return paragraphs.join('\n\n').slice(0, 1600);
};

const extractActionItemsHeuristically = (text: string): string[] => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const actionItems = lines
    .filter((line) => ACTION_LINE_REGEX.test(line) || /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').trim());

  return sanitizeList(actionItems, 8);
};

const extractPeopleHeuristically = (text: string): string[] => {
  const matches = text.match(NAME_REGEX) ?? [];
  return sanitizeList(matches, 10);
};

const extractDatesHeuristically = (text: string): string[] => {
  const matches = text.match(DATE_REGEX) ?? [];
  return sanitizeList(matches, 12);
};

const extractKeywordsHeuristically = (text: string): string[] => {
  const frequencies = new Map<string, number>();
  for (const token of tokenize(text)) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
};

const extractTopicsHeuristically = (keywords: string[]): string[] => {
  return sanitizeList(keywords.slice(0, 6).map(toTitleCase), 6);
};

const heuristicInsights = (text: string): KnowledgeInsights => {
  const summary = summarizeHeuristically(text);
  const keywords = sanitizeList(extractKeywordsHeuristically(text), 10);
  const topics = extractTopicsHeuristically(keywords);
  const actionItems = extractActionItemsHeuristically(text);
  const peopleMentioned = extractPeopleHeuristically(text);
  const datesMentioned = extractDatesHeuristically(text);
  const tags = sanitizeList([...topics, ...keywords].slice(0, 5), 5);
  const suggestedWorkspace = inferWorkspace(keywords);

  return {
    title: '',
    summary,
    keywords,
    topics,
    actionItems,
    peopleMentioned,
    datesMentioned,
    tags,
    suggestedWorkspace,
  };
};

const parseAiJson = (content: string): KnowledgeInsights | null => {
  try {
    const parsed = JSON.parse(content) as Partial<KnowledgeInsights>;
    if (!parsed.summary || !parsed.suggestedWorkspace) {
      return null;
    }

    return {
      title: '',
      summary: parsed.summary.trim(),
      keywords: sanitizeList(parsed.keywords ?? [], 10),
      topics: sanitizeList(parsed.topics ?? [], 6),
      actionItems: sanitizeList(parsed.actionItems ?? [], 8),
      peopleMentioned: sanitizeList(parsed.peopleMentioned ?? [], 10),
      datesMentioned: sanitizeList(parsed.datesMentioned ?? [], 12),
      tags: sanitizeList(parsed.tags ?? [], 5),
      suggestedWorkspace: parsed.suggestedWorkspace.trim(),
    };
  } catch {
    return null;
  }
};

const enrichWithOpenAI = async (
  text: string,
  title: string,
  sourceType: KnowledgeSourceType
): Promise<KnowledgeInsights | null> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const userContent = text.slice(0, MAX_AI_INPUT_CHARS);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You generate structured knowledge cards. Return strict JSON only with keys: summary, keywords, topics, actionItems, peopleMentioned, datesMentioned, tags, suggestedWorkspace. The summary must be 3 to 5 short paragraphs.',
        },
        {
          role: 'user',
          content: `Create metadata for this uploaded ${sourceType} document. Title: ${title}\n\nText:\n${userContent}`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  return parseAiJson(content);
};

const scoreRelatedDocument = (
  currentKeywords: string[],
  candidate: ExistingKnowledgeCard
): number => {
  const currentSet = new Set(currentKeywords.map((k) => k.toLowerCase()));
  const candidateSet = new Set(
    [...candidate.keywords, ...candidate.tags].map((value) => value.toLowerCase())
  );

  let overlap = 0;
  for (const keyword of currentSet) {
    if (candidateSet.has(keyword)) {
      overlap += 1;
    }
  }

  return overlap;
};

const pickRelatedDocuments = (
  keywords: string[],
  existingCards: ExistingKnowledgeCard[]
): string[] => {
  return existingCards
    .map((card) => ({ id: card.id, score: scoreRelatedDocument(keywords, card) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => entry.id);
};

export const buildKnowledgeCardFromUpload = async (
  file: File,
  existingCards: ExistingKnowledgeCard[]
): Promise<KnowledgeCardRecord> => {
  return processStoredDocument({
    file,
    existingCards,
    originalFilePath: file.name,
  });
};

export const buildPendingKnowledgeCardRecord = ({
  id = randomUUID(),
  fileName,
  sourceType,
  uploadDate = new Date().toISOString(),
  originalFilePath,
  processingStatus = 'processing',
  summary,
}: PendingKnowledgeCardInput): KnowledgeCardRecord => {
  const title = normalizeTitle(fileName) || 'Untitled Document';
  const defaultSummary =
    summary ??
    (processingStatus === 'failed'
      ? 'Document processing failed. Open the original file or retry the upload.'
      : 'Document uploaded successfully. Processing extracted metadata now.');

  const extractedMetadata: KnowledgeMetadata = {
    title,
    summary: defaultSummary,
    keywords: [],
    topics: [],
    actionItems: [],
    peopleMentioned: [],
    datesMentioned: [],
  };

  return {
    id,
    title,
    summary: defaultSummary,
    keywords: [],
    topics: [],
    actionItems: [],
    peopleMentioned: [],
    datesMentioned: [],
    tags: [],
    suggestedWorkspace: 'Research',
    sourceType,
    processingStatus,
    originalFilePath,
    uploadDate,
    relatedDocuments: [],
    extractedMetadata,
    extractedText: '',
    fileName,
  };
};

export const processStoredDocument = async ({
  id = randomUUID(),
  file,
  existingCards,
  uploadDate = new Date().toISOString(),
  originalFilePath,
}: ProcessStoredDocumentInput): Promise<KnowledgeCardRecord> => {
  const sourceType = detectSourceType(file.name, file.type || '');
  const title = normalizeTitle(file.name) || 'Untitled Document';
  const extractedText = await extractTextFromFile(file, sourceType);

  if (!extractedText) {
    throw new Error('Unable to extract text from uploaded file.');
  }

  const aiInsights = await enrichWithOpenAI(extractedText, title, sourceType);
  const fallbackInsights = heuristicInsights(extractedText);
  const insights = aiInsights ?? fallbackInsights;
  const finalInsights: KnowledgeInsights = {
    ...insights,
    title,
    topics: insights.topics.length > 0 ? insights.topics : extractTopicsHeuristically(insights.keywords),
    datesMentioned:
      insights.datesMentioned.length > 0
        ? insights.datesMentioned
        : extractDatesHeuristically(extractedText),
    tags:
      insights.tags.length > 0
        ? insights.tags
        : sanitizeList([...insights.topics, ...insights.keywords].slice(0, 5), 5),
  };

  const relatedDocuments = pickRelatedDocuments(finalInsights.keywords, existingCards);
  const extractedMetadata: KnowledgeMetadata = {
    title,
    summary: finalInsights.summary,
    keywords: finalInsights.keywords,
    topics: finalInsights.topics,
    actionItems: finalInsights.actionItems,
    peopleMentioned: finalInsights.peopleMentioned,
    datesMentioned: finalInsights.datesMentioned,
  };

  return {
    id,
    title,
    summary: finalInsights.summary,
    keywords: finalInsights.keywords,
    topics: finalInsights.topics,
    actionItems: finalInsights.actionItems,
    peopleMentioned: finalInsights.peopleMentioned,
    datesMentioned: finalInsights.datesMentioned,
    tags: finalInsights.tags,
    suggestedWorkspace: finalInsights.suggestedWorkspace,
    sourceType,
    processingStatus: 'completed',
    originalFilePath,
    uploadDate,
    relatedDocuments,
    extractedMetadata,
    extractedText,
    fileName: file.name,
  };
};
