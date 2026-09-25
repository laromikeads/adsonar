import { NextRequest, NextResponse } from 'next/server';
import { searchMetaAds } from '@/lib/meta/client';
import { extractFingerprint } from '@/lib/analysis/fingerprint';
import { createClient } from '@supabase/supabase-js';

const CRAWL_KEYWORDS = [
  'توصيل مجاني',
  'اطلب الان',
  'متوفر بالجزائر',
  'توصيل لـ 58 ولاية',
  'جودة عالية',
  'livraison gratuite',
  'commandez maintenant',
  'livraison rapide',
  'disponible en algerie',
  'free shipping algeria',
  'shop now',
];

const CRAWL_COUNTRY = 'DZ';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = {
    keywords_crawled: 0,
    ads_fetched: 0,
    ads_stored: 0,
    products_updated: 0,
    errors: [] as string[],
  };

  for (const keyword of CRAWL_KEYWORDS) {
    try {
      const searchResult = await searchMetaAds({
        query: keyword,
        country: CRAWL_COUNTRY,
        limit: 30,
        ecomOnly: true,
      });

      const ads = searchResult.data;
      results.keywords_crawled++;
      results.ads_fetched += ads.length;

      for (const ad of ads) {
        const { fingerprint, name, keywords } = extractFingerprint(ad);
        if (!fingerprint || fingerprint === 'unknown') continue;

        const { error: snapError } = await supabase
          .from('ad_snapshots')
          .upsert(
            {
              ad_id: ad.id,
              product_fingerprint: fingerprint,
              page_id: ad.page_id,
              page_name: ad.page_name,
              body: ad.ad_creative_bodies?.[0] || '',
              snapshot_url: ad.ad_snapshot_url,
              country: CRAWL_COUNTRY,
              sourcing_score: ad.sourcingScore.overall,
              label: ad.sourcingScore.label,
              is_active: ad.isActive,
              days_since_launch: ad.daysSinceLaunch,
              crawl_date: new Date().toISOString().split('T')[0],
            },
            { onConflict: 'ad_id,crawl_date', ignoreDuplicates: true }
          );

        if (snapError) {
          results.errors.push(`Snapshot error: ${snapError.message}`);
          continue;
        }
        results.ads_stored++;

        const { data: existing } = await supabase
          .from('products')
          .select('seller_count, avg_score')
          .eq('fingerprint', fingerprint)
          .single();

        const { data: sellerData } = await supabase
          .from('ad_snapshots')
          .select('page_id')
          .eq('product_fingerprint', fingerprint)
          .eq('crawl_date', new Date().toISOString().split('T')[0]);

        const uniqueSellers = new Set((sellerData || []).map((r: { page_id: string }) => r.page_id)).size;

        const prevCount = existing?.seller_count || 0;
        let trend: 'rising' | 'stable' | 'declining' = 'stable';
        if (uniqueSellers > prevCount + 1) trend = 'rising';
        else if (uniqueSellers < prevCount - 1) trend = 'declining';

        const { error: productError } = await supabase
          .from('products')
          .upsert(
            {
              fingerprint,
              name,
              keywords,
              country: CRAWL_COUNTRY,
              last_seen_at: new Date().toISOString(),
              seller_count: uniqueSellers || 1,
              seller_count_prev: existing?.seller_count || 1,
              trend,
              avg_score: ad.sourcingScore.overall,
              top_ad_id: ad.id,
              top_page_name: ad.page_name,
              top_snapshot_url: ad.ad_snapshot_url,
              top_ad_body: ad.ad_creative_bodies?.[0] || '',
              days_active: ad.daysSinceLaunch,
              is_active: ad.isActive,
            },
            { onConflict: 'fingerprint' }
          );

        if (!productError) results.products_updated++;
      }

      await supabase.from('crawl_log').insert({
        keyword,
        country: CRAWL_COUNTRY,
        ads_fetched: ads.length,
        ads_stored: results.ads_stored,
        products_updated: results.products_updated,
      });

      await new Promise((r) => setTimeout(r, 500));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      results.errors.push(`Keyword "${keyword}": ${msg}`);
    }
  }

  return NextResponse.json(results);
}
