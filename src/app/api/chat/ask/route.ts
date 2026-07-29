import { NextResponse } from 'next/server';
import { askVault } from '@/lib/askAiPipeline';

export const runtime = 'nodejs';

interface AskRequest {
  question?: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AskRequest;
    const question = payload.question?.trim();

    if (!question) {
      return NextResponse.json({ error: 'A question is required.' }, { status: 400 });
    }

    const history = (payload.history ?? []).filter(
      (item) => item.content && (item.role === 'user' || item.role === 'assistant')
    );

    const result = await askVault(question, history);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ask AI request failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
