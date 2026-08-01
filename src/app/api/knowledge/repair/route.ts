import { NextResponse } from 'next/server';
import { RESEARCH_FILE_BUCKET } from '@/lib/documentText';
import { scanAndRepairKnowledgeLibrary } from '@/lib/storageIntegrity';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const supabase = getSupabaseServerClient();
    const report = await scanAndRepairKnowledgeLibrary(supabase, RESEARCH_FILE_BUCKET);

    return NextResponse.json({ data: report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Repair Library command failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}