import { randomUUID } from 'crypto';
import { getAiProviderConfig } from '@/lib/aiProvider';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export type ResearchProgressState =
  | 'searching'
  | 'reading_sources'
  | 'analyzing'
  | 'writing_report'
  | 'saving_to_vault'
  | 'complete'
  | 'failed';

type SearchProviderName = 'tavily' | 'duckduckgo-legacy';

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface WebSearchHit {
  title: string;
  url: string;
  snippet: string;
  publisher: string;
  rank: number;
  score: number;
}

interface SearchProvider {
  name: SearchProviderName;
  search: (question: string, timeoutMs: number) => Promise<WebSearchHit[]>;
}

interface SourceDocument extends WebSearchHit {
  id: string;
  accessedAt: string;
  textContent: string;
}

interface ReportFact {
  fact: string;
  sourceIds: string[];
}

interface ResearchReport {
  executiveSummary: string;
  sourcedFacts: ReportFact[];
  conclusions: string[];
  qualityAssessment: string;
  keywords: string[];
  topics: string[];
  actionItems: string[];
  peopleMentioned: string[];
  datesMentioned: string[];
}

interface ResearchModelResponse {
  report?: ResearchReport;
}

interface StoredKnowledgeCardRow {
  id: string;
  upload_date: string;
  extracted_text: string;
  extracted_metadata: Record<string, unknown> | null;
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  accessDate: string;
  snippet: string;
}

export interface ResearchAnythingResult {
  mode: 'research_anything';
  answer: string;
  sources: ResearchSource[];
  notFoundInVault: false;
  webSearchSuggestion: null;
  progress: ResearchProgressState[];
  qualityAssessment: string;
  question: string;
  knowledgeCardId: string;
  duplicateOfExisting: boolean;
}

const MAX_HISTORY = 8;
const MAX_SEARCH_RESULTS = 8;
const MAX_ANALYZED_SOURCES = 6;
const MAX_SOURCE_TEXT = 6000;
const DEFAULT_FETCH_TIMEOUT_MS = 10000;
const DEFAULT_TOTAL_TIMEOUT_MS = 120000;

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is',
  'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'this', 'or',
  'we', 'they', 'you', 'your', 'our', 'their', 'but', 'not', 'can', 'into', 'than', 'then',
]);

const CREDIBLE_DOMAIN_BONUS: Array<{ pattern: RegExp; bonus: number }> = [
  { pattern: /\.gov$/i, bonus: 0.6 },
  { pattern: /\.edu$/i, bonus: 0.5 },
  { pattern: /wikipedia\.org$/i, bonus: 0.25 },
  { pattern: /(nature|science|nejm|thelancet|ieee)\.com$/i, bonus: 0.35 },
  { pattern: /(who\.int|un\.org|oecd\.org|worldbank\.org)$/i, bonus: 0.4 },
  { pattern: /(reuters\.com|apnews\.com|bbc\.com)$/i, bonus: 0.2 },
];

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const getPublisherFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return 'unknown';
  }
};

const tokenize = (value: string): string[] => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
};

const keywordOverlapScore = (question: string, text: string): number => {
  const q = new Set(tokenize(question));
  if (q.size === 0) {
    return 0;
  }

  const t = new Set(tokenize(text));
  let overlap = 0;
  for (const token of q) {
    if (t.has(token)) {
      overlap += 1;
    }
  }

  return overlap / q.size;
};

const credibilityScore = (url: string): number => {
  let score = 0;
  const host = getPublisherFromUrl(url);

  for (const entry of CREDIBLE_DOMAIN_BONUS) {
    if (entry.pattern.test(host)) {
      score += entry.bonus;
    }
  }

  if (url.startsWith('https://')) {
    score += 0.05;
  }

  return score;
};

const dedupeByUrl = <T extends { url: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const output: T[] = [];

  for (const item of items) {
    const key = item.url.trim().toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(item);
  }

  return output;
};

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Provider timeout.');
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const stripHtml = (html: string): string => {
  const withoutScripts = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return normalizeWhitespace(withoutScripts);
};

const tavilyProvider: SearchProvider = {
  name: 'tavily',
  search: async (question: string, timeoutMs: number) => {
    const apiKey = process.env.TAVILY_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('No Tavily API key configured.');
    }

    const response = await fetchWithTimeout(
      'https://api.tavily.com/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: question,
          search_depth: 'advanced',
          max_results: MAX_SEARCH_RESULTS,
          include_answer: false,
          include_raw_content: false,
        }),
        cache: 'no-store',
      },
      timeoutMs
    );

    if (!response.ok) {
      throw new Error(`Tavily search failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as {
      results?: Array<{
        title?: string;
        url?: string;
        content?: string;
        score?: number;
      }>;
    };

    const results = (payload.results ?? [])
      .filter((entry) => Boolean(entry.url))
      .map((entry, index) => ({
        title: normalizeWhitespace(entry.title ?? '') || getPublisherFromUrl(entry.url ?? ''),
        url: entry.url ?? '',
        snippet: normalizeWhitespace(entry.content ?? ''),
        publisher: getPublisherFromUrl(entry.url ?? ''),
        rank: index,
        score: Number(entry.score ?? 0),
      }))
      .filter((entry) => entry.url.startsWith('http'));

    if (results.length === 0) {
      throw new Error('No search results returned.');
    }

    return results;
  },
};

const flattenDuckTopics = (
  topics: Array<{ FirstURL?: string; Text?: string; Topics?: Array<{ FirstURL?: string; Text?: string }> }>
): Array<{ url: string; text: string }> => {
  const output: Array<{ url: string; text: string }> = [];

  for (const topic of topics) {
    if (topic.FirstURL && topic.Text) {
      output.push({ url: topic.FirstURL, text: topic.Text });
    }

    for (const nested of topic.Topics ?? []) {
      if (nested.FirstURL && nested.Text) {
        output.push({ url: nested.FirstURL, text: nested.Text });
      }
    }
  }

  return output;
};

export const duckDuckGoLegacyProvider: SearchProvider = {
  name: 'duckduckgo-legacy',
  search: async (question: string, timeoutMs: number) => {
    const query = encodeURIComponent(question);
    const response = await fetchWithTimeout(
      `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=0`,
      {
        cache: 'no-store',
      },
      timeoutMs
    );

    if (!response.ok) {
      throw new Error(`DuckDuckGo legacy search failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as {
      RelatedTopics?: Array<{
        FirstURL?: string;
        Text?: string;
        Topics?: Array<{ FirstURL?: string; Text?: string }>;
      }>;
    };

    const topics = flattenDuckTopics(payload.RelatedTopics ?? []);
    const results = topics
      .map((topic, index) => {
        const title = topic.text.split(' - ')[0]?.trim() || getPublisherFromUrl(topic.url);
        return {
          title,
          url: topic.url,
          snippet: topic.text,
          publisher: getPublisherFromUrl(topic.url),
          rank: index,
          score: 0,
        };
      })
      .filter((entry) => entry.url.startsWith('http'))
      .slice(0, MAX_SEARCH_RESULTS);

    if (results.length === 0) {
      throw new Error('No search results returned.');
    }

    return results;
  },
};

const resolveSearchProvider = (): SearchProvider => {
  const configured = process.env.WEB_SEARCH_PROVIDER?.trim().toLowerCase();
  const hasTavilyKey = Boolean(process.env.TAVILY_API_KEY?.trim());

  if (configured === 'duckduckgo' || configured === 'duckduckgo-legacy') {
    return duckDuckGoLegacyProvider;
  }

  if (configured && configured !== 'tavily') {
    throw new Error(
      'Unsupported WEB_SEARCH_PROVIDER. Supported values are tavily or duckduckgo.'
    );
  }

  if (configured === 'tavily' && !hasTavilyKey) {
    throw new Error('No Tavily API key configured.');
  }

  if (hasTavilyKey) {
    return tavilyProvider;
  }

  throw new Error('No Tavily API key configured.');
};

const rankSearchHits = (question: string, hits: WebSearchHit[]): WebSearchHit[] => {
  return hits
    .map((hit) => {
      const overlap = keywordOverlapScore(question, `${hit.title} ${hit.snippet} ${hit.publisher}`);
      const credibility = credibilityScore(hit.url);
      const rankWeight = Math.max(0, (MAX_SEARCH_RESULTS - hit.rank) / MAX_SEARCH_RESULTS);
      const providerScore = Number.isFinite(hit.score) ? hit.score * 0.25 : 0;
      return {
        ...hit,
        score: overlap * 0.5 + credibility * 0.3 + rankWeight * 0.2 + providerScore,
      };
    })
    .sort((a, b) => b.score - a.score);
};

const extractTitleFromHtml = (html: string): string => {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  return titleMatch ? normalizeWhitespace(stripHtml(titleMatch[1])) : '';
};

const readSourcePage = async (
  source: WebSearchHit,
  timeoutMs: number
): Promise<SourceDocument | null> => {
  try {
    const response = await fetchWithTimeout(
      source.url,
      {
        headers: {
          'User-Agent': 'ResearchVaultBot/2.0 (+https://research-vault.local)',
          Accept: 'text/html,application/xhtml+xml',
        },
        cache: 'no-store',
        redirect: 'follow',
      },
      timeoutMs
    );

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }

    const body = await response.text();
    const pageTitle = extractTitleFromHtml(body);
    const textContent = stripHtml(body).slice(0, MAX_SOURCE_TEXT);

    if (textContent.length < 220) {
      return null;
    }

    return {
      ...source,
      id: randomUUID(),
      title: pageTitle || source.title || getPublisherFromUrl(source.url),
      publisher: source.publisher || getPublisherFromUrl(source.url),
      accessedAt: new Date().toISOString(),
      textContent,
    };
  } catch {
    return null;
  }
};

const parseReportResponse = (content: string): ResearchReport | null => {
  try {
    const parsed = JSON.parse(content) as ResearchModelResponse;
    const report = parsed.report;
    if (!report) {
      return null;
    }

    return {
      executiveSummary: normalizeWhitespace(report.executiveSummary ?? ''),
      sourcedFacts: (report.sourcedFacts ?? [])
        .map((item) => ({
          fact: normalizeWhitespace(item.fact ?? ''),
          sourceIds: (item.sourceIds ?? []).map((value) => value.trim()).filter(Boolean),
        }))
        .filter((item) => item.fact && item.sourceIds.length > 0),
      conclusions: (report.conclusions ?? []).map((entry) => normalizeWhitespace(entry)).filter(Boolean),
      qualityAssessment: normalizeWhitespace(report.qualityAssessment ?? ''),
      keywords: (report.keywords ?? []).map((entry) => normalizeWhitespace(entry)).filter(Boolean),
      topics: (report.topics ?? []).map((entry) => normalizeWhitespace(entry)).filter(Boolean),
      actionItems: (report.actionItems ?? []).map((entry) => normalizeWhitespace(entry)).filter(Boolean),
      peopleMentioned: (report.peopleMentioned ?? []).map((entry) => normalizeWhitespace(entry)).filter(Boolean),
      datesMentioned: (report.datesMentioned ?? []).map((entry) => normalizeWhitespace(entry)).filter(Boolean),
    };
  } catch {
    return null;
  }
};

const dedupeList = (items: string[], max: number): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of items) {
    const normalized = normalizeWhitespace(item);
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(normalized);

    if (output.length >= max) {
      break;
    }
  }

  return output;
};

const buildFallbackReport = (question: string, sources: SourceDocument[]): ResearchReport => {
  const sourceLines = sources
    .slice(0, 5)
    .map((source) => ({
      fact: `${source.title}: ${source.textContent.slice(0, 220)}...`,
      sourceIds: [source.id],
    }));

  const qualityAssessment =
    sources.length < 2
      ? 'Research quality is limited because fewer than two retrievable sources were found.'
      : 'Research quality is moderate. Validate critical claims against primary documents.';

  return {
    executiveSummary: `This report addresses: ${question}. The summary is based only on the retrieved web sources and may omit information unavailable in those pages.`,
    sourcedFacts: sourceLines,
    conclusions: [
      'The available evidence is directional rather than exhaustive.',
      'Use the cited sources for verification before acting on high-impact decisions.',
    ],
    qualityAssessment,
    keywords: dedupeList(tokenize(question), 10),
    topics: dedupeList(tokenize(question).slice(0, 5), 6),
    actionItems: ['Verify the highest-impact claims directly from primary publications.'],
    peopleMentioned: [],
    datesMentioned: [],
  };
};

const synthesizeReport = async (
  question: string,
  history: ChatHistoryItem[],
  sources: SourceDocument[]
): Promise<ResearchReport> => {
  const provider = getAiProviderConfig();
  if (!provider) {
    return buildFallbackReport(question, sources);
  }

  const compactSources = sources.map((source) => ({
    id: source.id,
    title: source.title,
    url: source.url,
    publisher: source.publisher,
    accessedAt: source.accessedAt,
    excerpt: source.textContent.slice(0, 1800),
  }));

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.chatModel,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a rigorous web research analyst. Use only the provided sources. Never invent sources or claims. Return strict JSON only in this shape: {"report":{"executiveSummary":string,"sourcedFacts":[{"fact":string,"sourceIds":string[]}],"conclusions":string[],"qualityAssessment":string,"keywords":string[],"topics":string[],"actionItems":string[],"peopleMentioned":string[],"datesMentioned":string[]}}. sourceIds must contain only IDs from the provided source list. Ensure sourcedFacts and conclusions are clearly distinct.',
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nRecent chat history: ${JSON.stringify(history.slice(-MAX_HISTORY))}\n\nSources JSON: ${JSON.stringify(compactSources)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return buildFallbackReport(question, sources);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    return buildFallbackReport(question, sources);
  }

  const parsed = parseReportResponse(content);
  if (!parsed) {
    return buildFallbackReport(question, sources);
  }

  const sourceIds = new Set(sources.map((source) => source.id));
  const validatedFacts = parsed.sourcedFacts.filter(
    (fact) => fact.sourceIds.length > 0 && fact.sourceIds.every((id) => sourceIds.has(id))
  );

  const fallback = buildFallbackReport(question, sources);
  return {
    executiveSummary: parsed.executiveSummary || fallback.executiveSummary,
    sourcedFacts: validatedFacts.length > 0 ? validatedFacts : fallback.sourcedFacts,
    conclusions: parsed.conclusions.length > 0 ? parsed.conclusions : fallback.conclusions,
    qualityAssessment: parsed.qualityAssessment || fallback.qualityAssessment,
    keywords: dedupeList(parsed.keywords, 10),
    topics: dedupeList(parsed.topics, 6),
    actionItems: dedupeList(parsed.actionItems, 8),
    peopleMentioned: dedupeList(parsed.peopleMentioned, 10),
    datesMentioned: dedupeList(parsed.datesMentioned, 12),
  };
};

const buildReportMarkdown = (
  question: string,
  report: ResearchReport,
  sources: SourceDocument[]
): string => {
  const sourceMap = new Map(sources.map((source) => [source.id, source]));

  const factLines = report.sourcedFacts
    .map((fact, index) => {
      const refs = fact.sourceIds
        .map((id) => {
          const source = sourceMap.get(id);
          if (!source) {
            return null;
          }

          return `[${source.title}](${source.url})`;
        })
        .filter((value): value is string => Boolean(value))
        .join(', ');

      return `${index + 1}. ${fact.fact}${refs ? ` (${refs})` : ''}`;
    })
    .join('\n');

  const conclusionLines = report.conclusions.map((line, index) => `${index + 1}. ${line}`).join('\n');

  const sourceLines = sources
    .map(
      (source, index) =>
        `${index + 1}. ${source.title}\n   - URL: ${source.url}\n   - Publisher: ${source.publisher}\n   - Accessed: ${new Date(source.accessedAt).toISOString().slice(0, 10)}`
    )
    .join('\n');

  return [
    '# Research Report',
    '',
    `Question: ${question}`,
    '',
    '## Executive Summary',
    report.executiveSummary,
    '',
    '## Sourced Facts',
    factLines || 'No high-confidence sourced facts were extracted from the retrieved pages.',
    '',
    '## AI Conclusions',
    conclusionLines || 'No conclusions were produced.',
    '',
    '## Research Quality',
    report.qualityAssessment,
    '',
    '## Sources',
    sourceLines,
  ].join('\n');
};

const mapSupabaseError = (error: unknown): never => {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Supabase server credentials are not configured')) {
    throw new Error('Supabase credentials missing.');
  }

  if (message.toLowerCase().includes('fetch failed')) {
    throw new Error('Unable to save research.');
  }

  throw new Error('Unable to save research.');
};

const findRecentDuplicate = async (question: string): Promise<StoredKnowledgeCardRow | null> => {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('knowledge_cards')
      .select('id,upload_date,extracted_text,extracted_metadata')
      .eq('source_type', 'web_research')
      .eq('processing_status', 'completed')
      .order('upload_date', { ascending: false })
      .limit(50);

    if (error) {
      return null;
    }

    const rows = (data ?? []) as unknown as StoredKnowledgeCardRow[];
    const normalized = normalizeWhitespace(question).toLowerCase();
    const windowMs = 30 * 60 * 1000;
    const now = Date.now();

    for (const row of rows) {
      const metadata = row.extracted_metadata ?? {};
      const originalQuestion = String((metadata as { originalQuestion?: unknown }).originalQuestion ?? '');
      const uploaded = Date.parse(row.upload_date);
      if (!Number.isFinite(uploaded) || now - uploaded > windowMs) {
        continue;
      }

      if (normalizeWhitespace(originalQuestion).toLowerCase() === normalized) {
        return row;
      }
    }

    return null;
  } catch (error) {
    mapSupabaseError(error);
    return null;
  }
};

const toResearchSources = (sources: SourceDocument[]): ResearchSource[] => {
  return sources.map((source) => ({
    id: source.id,
    title: source.title,
    url: source.url,
    publisher: source.publisher,
    accessDate: source.accessedAt,
    snippet: source.snippet || source.textContent.slice(0, 320),
  }));
};

const saveResearchKnowledgeCard = async (input: {
  question: string;
  reportMarkdown: string;
  report: ResearchReport;
  sources: SourceDocument[];
  provider: SearchProviderName;
}): Promise<string> => {
  try {
    const supabase = getSupabaseServerClient();
    const id = randomUUID();
    const uploadDate = new Date().toISOString();

    const tags = dedupeList([...input.report.topics, ...input.report.keywords], 8);
    const title = `Web Research: ${input.question.slice(0, 120)}`;

    const extractedMetadata = {
      originalQuestion: input.question,
      searchProvider: input.provider,
      generatedAt: uploadDate,
      sources: toResearchSources(input.sources),
      sourcedFacts: input.report.sourcedFacts,
      conclusions: input.report.conclusions,
      qualityAssessment: input.report.qualityAssessment,
      reportMarkdown: input.reportMarkdown,
    };

    const row = {
      id,
      title,
      summary: input.report.executiveSummary,
      keywords: dedupeList(input.report.keywords, 10),
      topics: dedupeList(input.report.topics, 6),
      action_items: dedupeList(input.report.actionItems, 8),
      people_mentioned: dedupeList(input.report.peopleMentioned, 10),
      dates_mentioned: dedupeList(input.report.datesMentioned, 12),
      tags,
      suggested_workspace: 'Web Research',
      source_type: 'web_research',
      processing_status: 'completed',
      original_file_path: `web_research/${id}.md`,
      upload_date: uploadDate,
      related_documents: [],
      extracted_text: input.reportMarkdown,
      file_name: `web-research-${uploadDate.slice(0, 10)}.md`,
      extracted_metadata: extractedMetadata,
    };

    const { error } = await supabase.from('knowledge_cards').insert(row);

    if (error) {
      throw new Error('Unable to save research.');
    }

    return id;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'Unable to save research.') {
      throw error;
    }

    mapSupabaseError(error);
    return '';
  }
};

const asDeadline = (totalTimeoutMs: number): number => Date.now() + totalTimeoutMs;

const assertWithinDeadline = (deadlineMs: number) => {
  if (Date.now() > deadlineMs) {
    throw new Error('Provider timeout.');
  }
};

export const researchAnything = async (
  question: string,
  history: ChatHistoryItem[]
): Promise<ResearchAnythingResult> => {
  const progress: ResearchProgressState[] = [];
  const pushProgress = (state: ResearchProgressState) => {
    if (progress[progress.length - 1] !== state) {
      progress.push(state);
    }
  };

  const totalTimeoutMs = parsePositiveInt(
    process.env.WEB_RESEARCH_TIMEOUT_MS,
    DEFAULT_TOTAL_TIMEOUT_MS
  );
  const fetchTimeoutMs = parsePositiveInt(
    process.env.WEB_SOURCE_FETCH_TIMEOUT_MS,
    DEFAULT_FETCH_TIMEOUT_MS
  );
  const deadline = asDeadline(totalTimeoutMs);

  try {
    const provider = resolveSearchProvider();
    assertWithinDeadline(deadline);

    const duplicate = await findRecentDuplicate(question);
    if (duplicate) {
      pushProgress('complete');

      const metadata = (duplicate.extracted_metadata ?? {}) as {
        sources?: ResearchSource[];
        qualityAssessment?: string;
      };

      return {
        mode: 'research_anything',
        answer: duplicate.extracted_text,
        sources: metadata.sources ?? [],
        notFoundInVault: false,
        webSearchSuggestion: null,
        progress,
        qualityAssessment:
          metadata.qualityAssessment ??
          'Duplicate submission prevented. Showing the latest matching web research from vault.',
        question,
        knowledgeCardId: duplicate.id,
        duplicateOfExisting: true,
      };
    }

    pushProgress('searching');
    const rawHits = await provider.search(question, fetchTimeoutMs);
    const dedupedHits = dedupeByUrl(rawHits);
    const rankedHits = rankSearchHits(question, dedupedHits).slice(0, MAX_SEARCH_RESULTS);

    if (rankedHits.length === 0) {
      throw new Error('No search results returned.');
    }

    assertWithinDeadline(deadline);
    pushProgress('reading_sources');
    const sourceReads = await Promise.all(
      rankedHits.slice(0, MAX_ANALYZED_SOURCES).map((hit) => readSourcePage(hit, fetchTimeoutMs))
    );

    const retrievedSources = dedupeByUrl(
      sourceReads.filter((source): source is SourceDocument => Boolean(source))
    );

    if (retrievedSources.length < 2) {
      throw new Error('No search results returned.');
    }

    assertWithinDeadline(deadline);
    pushProgress('analyzing');
    const report = await synthesizeReport(question, history, retrievedSources);

    assertWithinDeadline(deadline);
    pushProgress('writing_report');
    const reportMarkdown = buildReportMarkdown(question, report, retrievedSources);

    assertWithinDeadline(deadline);
    pushProgress('saving_to_vault');
    const knowledgeCardId = await saveResearchKnowledgeCard({
      question,
      reportMarkdown,
      report,
      sources: retrievedSources,
      provider: provider.name,
    });

    pushProgress('complete');
    return {
      mode: 'research_anything',
      answer: reportMarkdown,
      sources: toResearchSources(retrievedSources),
      notFoundInVault: false,
      webSearchSuggestion: null,
      progress,
      qualityAssessment: report.qualityAssessment,
      question,
      knowledgeCardId,
      duplicateOfExisting: false,
    };
  } catch (error) {
    pushProgress('failed');
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Research request failed.');
  }
};
