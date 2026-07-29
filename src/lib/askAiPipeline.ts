import { getSupabaseServerClient } from '@/lib/supabaseServer';

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface KnowledgeCardRow {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  topics: string[];
  action_items: string[];
  people_mentioned: string[];
  dates_mentioned: string[];
  tags: string[];
  source_type: string;
  upload_date: string;
  extracted_text: string;
  file_name: string;
  extracted_metadata: Record<string, unknown> | null;
}

export interface AskAiSource {
  id: string;
  title: string;
  summary: string;
  extractedText: string;
  keywords: string[];
  topics: string[];
  sourceType: string;
  uploadDate: string;
  fileName: string;
  extractedMetadata: Record<string, unknown>;
}

export interface AskAiResult {
  answer: string;
  sources: AskAiSource[];
  notFoundInVault: boolean;
  webSearchSuggestion: string | null;
}

const MAX_CARD_TEXT = 3500;
const MAX_CONTEXT_TEXT = 2500;
const MAX_HISTORY = 8;
const MAX_CANDIDATES = 30;
const MAX_SOURCES = 5;

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is',
  'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'this', 'or',
  'we', 'they', 'you', 'your', 'our', 'their', 'but', 'not', 'can', 'into', 'than', 'then',
]);

const normalizeText = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
};

const tokenize = (value: string): string[] => {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
};

const keywordScore = (queryTokens: string[], searchableText: string): number => {
  if (queryTokens.length === 0) {
    return 0;
  }

  const cardTokens = new Set(tokenize(searchableText));
  let overlap = 0;
  for (const token of queryTokens) {
    if (cardTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / queryTokens.length;
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const buildSearchableText = (card: KnowledgeCardRow): string => {
  const metadataText = JSON.stringify(card.extracted_metadata ?? {});
  return [
    card.title,
    card.summary,
    card.extracted_text,
    card.file_name,
    ...card.keywords,
    ...card.topics,
    ...card.action_items,
    ...card.people_mentioned,
    ...card.dates_mentioned,
    ...card.tags,
    metadataText,
  ]
    .join(' ')
    .slice(0, MAX_CARD_TEXT);
};

const toSource = (card: KnowledgeCardRow): AskAiSource => ({
  id: card.id,
  title: card.title,
  summary: card.summary,
  extractedText: card.extracted_text.slice(0, MAX_CONTEXT_TEXT),
  keywords: card.keywords ?? [],
  topics: card.topics ?? [],
  sourceType: card.source_type,
  uploadDate: card.upload_date,
  fileName: card.file_name,
  extractedMetadata: card.extracted_metadata ?? {},
});

const fetchEmbeddings = async (inputs: string[]): Promise<number[][] | null> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || inputs.length === 0) {
    return null;
  }

  const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: inputs,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const vectors = payload.data?.map((entry) => entry.embedding ?? []) ?? [];
  if (vectors.length !== inputs.length) {
    return null;
  }

  return vectors;
};

const retrieveRelevantCards = async (question: string): Promise<AskAiSource[]> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('knowledge_cards')
    .select(
      'id,title,summary,keywords,topics,action_items,people_mentioned,dates_mentioned,tags,source_type,upload_date,extracted_text,file_name,extracted_metadata,processing_status'
    )
    .eq('processing_status', 'completed')
    .order('upload_date', { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Unable to load knowledge cards for Ask AI: ${error.message}`);
  }

  const cards = (data ?? []) as Array<KnowledgeCardRow & { processing_status: string }>;
  if (cards.length === 0) {
    return [];
  }

  const queryTokens = tokenize(question);
  const withKeywordScores = cards.map((card) => {
    const searchableText = buildSearchableText(card);
    return {
      card,
      searchableText,
      keyword: keywordScore(queryTokens, searchableText),
    };
  });

  const keywordSorted = [...withKeywordScores].sort((a, b) => b.keyword - a.keyword);
  const candidatePool = keywordSorted.slice(0, MAX_CANDIDATES);

  const embeddingInputs = [
    question,
    ...candidatePool.map((entry) => entry.searchableText),
  ];
  const vectors = await fetchEmbeddings(embeddingInputs);

  const scored = candidatePool.map((entry, index) => {
    let semantic = 0;
    if (vectors && vectors.length === embeddingInputs.length) {
      semantic = cosineSimilarity(vectors[0], vectors[index + 1]);
    }

    const combined = vectors ? semantic * 0.65 + entry.keyword * 0.35 : entry.keyword;
    return {
      ...entry,
      semantic,
      combined,
    };
  });

  const relevant = scored
    .filter((entry) => entry.combined >= 0.12 || entry.keyword >= 0.2)
    .sort((a, b) => b.combined - a.combined)
    .slice(0, MAX_SOURCES)
    .map((entry) => toSource(entry.card));

  return relevant;
};

const parseAskResponse = (raw: string): {
  answer: string;
  citationIds: string[];
  notFoundInVault: boolean;
} | null => {
  try {
    const parsed = JSON.parse(raw) as {
      answer?: string;
      citationIds?: string[];
      notFoundInVault?: boolean;
    };

    if (!parsed.answer) {
      return null;
    }

    return {
      answer: parsed.answer.trim(),
      citationIds: (parsed.citationIds ?? []).filter(Boolean),
      notFoundInVault: Boolean(parsed.notFoundInVault),
    };
  } catch {
    return null;
  }
};

const askGroundedModel = async (
  question: string,
  history: ChatHistoryItem[],
  sources: AskAiSource[]
): Promise<{ answer: string; citationIds: string[]; notFoundInVault: boolean } | null> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const contextPayload = sources.map((source) => ({
    id: source.id,
    title: source.title,
    summary: source.summary,
    extractedText: source.extractedText,
    keywords: source.keywords,
    topics: source.topics,
    fileName: source.fileName,
    sourceType: source.sourceType,
    uploadDate: source.uploadDate,
    extractedMetadata: source.extractedMetadata,
  }));

  const cappedHistory = history.slice(-MAX_HISTORY);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a strict research assistant. Only answer using the supplied vault documents. If the answer cannot be found, return notFoundInVault=true and explain briefly that the vault does not contain enough evidence. Return valid JSON only with keys: answer, citationIds, notFoundInVault. citationIds must include only provided document IDs used for the answer.',
        },
        {
          role: 'user',
          content: `Vault documents JSON:\n${JSON.stringify(contextPayload)}\n\nRecent chat:\n${JSON.stringify(cappedHistory)}\n\nUser question:\n${question}`,
        },
      ],
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

  return parseAskResponse(content);
};

const fallbackNotFound = (question: string): AskAiResult => {
  const encoded = encodeURIComponent(question);
  return {
    answer:
      'I could not find enough evidence in your Research Vault to answer that reliably. I can only answer from uploaded documents.',
    sources: [],
    notFoundInVault: true,
    webSearchSuggestion: `https://www.google.com/search?q=${encoded}`,
  };
};

const fallbackGroundedAnswer = (sources: AskAiSource[]): string => {
  const top = sources.slice(0, 3);
  const evidence = top
    .map((source, index) => {
      const summary = source.summary || source.extractedText || 'No summary available.';
      return `${index + 1}. ${source.title}: ${summary}`;
    })
    .join('\n');

  return `I could not reach the configured LLM right now, but based on the retrieved vault documents:\n${evidence}`;
};

export const askVault = async (
  question: string,
  history: ChatHistoryItem[]
): Promise<AskAiResult> => {
  const retrievedSources = await retrieveRelevantCards(question);
  if (retrievedSources.length === 0) {
    return fallbackNotFound(question);
  }

  const llmResponse = await askGroundedModel(question, history, retrievedSources);
  if (!llmResponse) {
    return {
      answer: fallbackGroundedAnswer(retrievedSources),
      sources: retrievedSources,
      notFoundInVault: false,
      webSearchSuggestion: null,
    };
  }

  const sourceMap = new Map(retrievedSources.map((source) => [source.id, source]));
  const citedSources = llmResponse.citationIds
    .map((id) => sourceMap.get(id))
    .filter((source): source is AskAiSource => Boolean(source));

  if (llmResponse.notFoundInVault) {
    return fallbackNotFound(question);
  }

  const finalSources = citedSources.length > 0 ? citedSources : retrievedSources;
  return {
    answer: llmResponse.answer,
    sources: finalSources,
    notFoundInVault: false,
    webSearchSuggestion: null,
  };
};
