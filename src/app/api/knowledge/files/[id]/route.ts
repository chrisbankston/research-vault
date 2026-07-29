import { NextResponse } from 'next/server';
import { RESEARCH_FILE_BUCKET } from '@/lib/documentText';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

interface FileRow {
  original_file_path: string;
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
      .select('original_file_path')
      .eq('id', id)
      .single<FileRow>();

    if (error || !data?.original_file_path) {
      return NextResponse.json({ error: 'Original file not found.' }, { status: 404 });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(RESEARCH_FILE_BUCKET)
      .createSignedUrl(data.original_file_path, 300);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json({ error: 'Unable to open original file.' }, { status: 500 });
    }

    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to open original file.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}