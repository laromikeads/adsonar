import { NextRequest, NextResponse } from 'next/server';
import { searchMetaAds } from '@/lib/meta/client';
import { analyzeTrends } from '@/lib/analysis/scorer';

const TRENDING_QUERIES = [
  'shop now',
  'limited offer',
  'buy today',
  'new collection',
  'sale',
  'discount',
  'free shipping',
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country') || 'US';

  try {
    // Fetch from multiple trending search terms in parallel
    const queries = TRENDING_QUERIES.slice(0, 3); // limit API calls
    const results = await Promise.allSettled(
      queries.map((q) => searchMetaAds({ query: q, country, limit: 15 }))
    );

    const allAds = results
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof searchMetaAds>>> =>
        r.status === 'fulfilled'
      )
      .flatMap((r) => r.value.data);

    // Deduplicate by id
    const seen = new Set<string>();
    const uniqueAds = allAds.filter((ad) => {
      if (seen.has(ad.id)) return false;
      seen.add(ad.id);
      return true;
    });

    const trends = analyzeTrends(uniqueAds);
    const topAds = uniqueAds
      .sort((a, b) => b.sourcingScore.overall - a.sourcingScore.overall)
      .slice(0, 10);

    return NextResponse.json({ trends, topAds, total: uniqueAds.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
