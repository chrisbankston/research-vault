import { NextResponse } from 'next/server';
import type { KnowledgeCard } from '@/types';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

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
  suggested_workspace: string;
  source_type: KnowledgeCard['sourceType'];
  processing_status: KnowledgeCard['processingStatus'];
  original_file_path: string;
  upload_date: string;
  related_documents: string[];
  extracted_metadata: KnowledgeCard['extractedMetadata'];
}

const toKnowledgeCard = (row: KnowledgeCardRow): KnowledgeCard => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  keywords: row.keywords ?? [],
  topics: row.topics ?? [],
  actionItems: row.action_items ?? [],
  peopleMentioned: row.people_mentioned ?? [],
  datesMentioned: row.dates_mentioned ?? [],
  tags: row.tags ?? [],
  suggestedWorkspace: row.suggested_workspace,
  sourceType: row.source_type,
  processingStatus: row.processing_status,
  originalFilePath: row.original_file_path,
  uploadDate: row.upload_date,
  relatedDocuments: row.related_documents ?? [],
  extractedMetadata: row.extracted_metadata,
});

const matchesSearch = (card: KnowledgeCard, query: string): boolean => {
  const normalizedQuery = query.toLowerCase();
  const haystack = [
    card.title,
    card.summary,
    card.suggestedWorkspace,
    ...card.keywords,
    ...card.tags,
    ...card.peopleMentioned,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedQuery);
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.trim() ?? '';

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('knowledge_cards')
      .select(
        'id,title,summary,keywords,action_items,people_mentioned,tags,suggested_workspace,source_type,upload_date,related_documents'
        + ',topics,dates_mentioned,processing_status,original_file_path,extracted_metadata'
      )
      .order('upload_date', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json(
        { error: `Unable to load knowledge cards: ${error.message}` },
        { status: 500 }
      );
    }

    const cards = ((data ?? []) as unknown as KnowledgeCardRow[]).map(toKnowledgeCard);
    const filteredCards = query ? cards.filter((card) => matchesSearch(card, query)) : cards;

    return NextResponse.json({ data: filteredCards });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load cards.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
