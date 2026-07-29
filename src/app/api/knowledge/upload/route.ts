import { NextResponse } from 'next/server';
import {
  buildPendingKnowledgeCardRecord,
  processStoredDocument,
} from '@/lib/knowledgePipeline';
import {
  buildStoragePath,
  detectSourceType,
  isSupportedUpload,
  RESEARCH_FILE_BUCKET,
} from '@/lib/documentText';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

interface ExistingKnowledgeCardRow {
  id: string;
  title: string;
  keywords: string[];
  tags: string[];
}

const ensureResearchFilesBucket = async (supabase: ReturnType<typeof getSupabaseServerClient>) => {
  const { data: existingBucket, error: bucketLookupError } = await supabase.storage.getBucket(
    RESEARCH_FILE_BUCKET
  );

  if (existingBucket) {
    return;
  }

  if (bucketLookupError && bucketLookupError.message.toLowerCase() !== 'bucket not found') {
    throw new Error(`Unable to verify storage bucket: ${bucketLookupError.message}`);
  }

  const { error: createBucketError } = await supabase.storage.createBucket(RESEARCH_FILE_BUCKET, {
    public: false,
    fileSizeLimit: 52428800,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/x-markdown',
    ],
  });

  if (createBucketError && !createBucketError.message.toLowerCase().includes('already exists')) {
    throw new Error(`Unable to create storage bucket: ${createBucketError.message}`);
  }
};

const toRow = (knowledgeCard: ReturnType<typeof buildPendingKnowledgeCardRecord>) => ({
  id: knowledgeCard.id,
  title: knowledgeCard.title,
  summary: knowledgeCard.summary,
  keywords: knowledgeCard.keywords,
  topics: knowledgeCard.topics,
  action_items: knowledgeCard.actionItems,
  people_mentioned: knowledgeCard.peopleMentioned,
  dates_mentioned: knowledgeCard.datesMentioned,
  tags: knowledgeCard.tags,
  suggested_workspace: knowledgeCard.suggestedWorkspace,
  source_type: knowledgeCard.sourceType,
  processing_status: knowledgeCard.processingStatus,
  original_file_path: knowledgeCard.originalFilePath,
  upload_date: knowledgeCard.uploadDate,
  related_documents: knowledgeCard.relatedDocuments,
  extracted_text: knowledgeCard.extractedText,
  file_name: knowledgeCard.fileName,
  extracted_metadata: knowledgeCard.extractedMetadata,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const maybeFile = formData.get('file');

    if (!(maybeFile instanceof File)) {
      return NextResponse.json({ error: 'A file is required.' }, { status: 400 });
    }

    if (!isSupportedUpload(maybeFile.name, maybeFile.type || '')) {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload PDF, DOCX, TXT, or Markdown files.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    await ensureResearchFilesBucket(supabase);

    const { data: existingRows, error: fetchError } = await supabase
      .from('knowledge_cards')
      .select('id,title,keywords,tags')
      .limit(100);

    if (fetchError) {
      return NextResponse.json(
        { error: `Unable to load existing knowledge cards: ${fetchError.message}` },
        { status: 500 }
      );
    }

    const sourceType = detectSourceType(maybeFile.name, maybeFile.type || '');
    const pendingCardId = crypto.randomUUID();
    const originalFilePath = buildStoragePath(pendingCardId, maybeFile.name);

    const { error: storageError } = await supabase.storage
      .from(RESEARCH_FILE_BUCKET)
      .upload(originalFilePath, maybeFile, {
        cacheControl: '3600',
        contentType: maybeFile.type || 'application/octet-stream',
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json(
        { error: `Unable to store uploaded file: ${storageError.message}` },
        { status: 500 }
      );
    }

    const pendingCard = buildPendingKnowledgeCardRecord({
      id: pendingCardId,
      fileName: maybeFile.name,
      sourceType,
      originalFilePath,
    });

    const { error: insertPendingError } = await supabase
      .from('knowledge_cards')
      .insert(toRow(pendingCard));

    if (insertPendingError) {
      await supabase.storage.from(RESEARCH_FILE_BUCKET).remove([originalFilePath]);
      return NextResponse.json(
        { error: `Unable to create upload record: ${insertPendingError.message}` },
        { status: 500 }
      );
    }

    try {
      const knowledgeCard = await processStoredDocument({
        id: pendingCard.id,
        file: maybeFile,
        existingCards: (existingRows ?? []) as ExistingKnowledgeCardRow[],
        uploadDate: pendingCard.uploadDate,
        originalFilePath,
      });

      const { error: updateError } = await supabase
        .from('knowledge_cards')
        .update(toRow(knowledgeCard))
        .eq('id', knowledgeCard.id);

      if (updateError) {
        throw new Error(`Unable to finalize knowledge card: ${updateError.message}`);
      }

      return NextResponse.json({ data: knowledgeCard }, { status: 201 });
    } catch (processingError) {
      const failedCard = buildPendingKnowledgeCardRecord({
        id: pendingCard.id,
        fileName: maybeFile.name,
        sourceType,
        uploadDate: pendingCard.uploadDate,
        originalFilePath,
        processingStatus: 'failed',
        summary:
          processingError instanceof Error
            ? processingError.message
            : 'Document processing failed after upload.',
      });

      await supabase
        .from('knowledge_cards')
        .update(toRow(failedCard))
        .eq('id', failedCard.id);

      throw processingError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
