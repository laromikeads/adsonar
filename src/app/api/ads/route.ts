import { NextRequest, NextResponse } from 'next/server';
import { searchMetaAds } from '@/lib/meta/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get('query');
  const country = searchParams.get('country') || 'US';
  const after = searchParams.get('after') || undefined;
  const limit = parseInt(searchParams.get('limit') || '30');

  if (!query) {
    return NextResponse.json({ error: 'query parameter is required' }, { status: 400 });
  }

  try {
    const result = await searchMetaAds({ query, country, after, limit });
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Meta API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
