import { NextResponse } from 'next/server';
import { RESEARCH_FILE_BUCKET } from '@/lib/documentText';
import { storageObjectExists } from '@/lib/storageIntegrity';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

interface FileRow {
  original_file_path: string;
  source_type?: string;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('knowledge_cards')
      .select('original_file_path,source_type')
      .eq('id', id)
      .single<FileRow>();

    if (error || !data) {
      return NextResponse.json({ error: 'Original file not found.' }, { status: 404 });
    }

    const path = data.original_file_path?.trim();
    if (!path) {
      return NextResponse.json({ error: 'No original file is stored for this record.' }, { status: 404 });
    }

    if (data.source_type === 'web_research' || data.source_type === 'research_item') {
      return NextResponse.json({ error: 'This record does not have a stored original file.' }, { status: 404 });
    }

    const exists = await storageObjectExists(supabase, RESEARCH_FILE_BUCKET, path);
    if (!exists.exists) {
      return NextResponse.json({ error: exists.error || 'Stored original file does not exist.' }, { status: 404 });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(RESEARCH_FILE_BUCKET)
      .createSignedUrl(path, 300);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json({ error: 'Unable to open original file.' }, { status: 500 });
    }

    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to open original file.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}