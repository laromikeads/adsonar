import { MetaAd, SearchParams, SearchResult } from '@/types';
import { scoreAd } from '@/lib/analysis/scorer';

const META_AD_LIBRARY_BASE = 'https://graph.facebook.com/v21.0/ads_archive';

const AD_FIELDS = [
  'id',
  'page_id',
  'page_name',
  'ad_creative_bodies',
  'ad_creative_link_captions',
  'ad_creative_link_descriptions',
  'ad_creative_link_titles',
  'ad_delivery_start_time',
  'ad_delivery_stop_time',
  'ad_snapshot_url',
  'currency',
  'demographic_distribution',
  'delivery_by_region',
  'estimated_audience_size',
  'impressions',
  'spend',
  'languages',
  'publisher_platforms',
].join(',');

export async function searchMetaAds(params: SearchParams): Promise<SearchResult> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error('META_ACCESS_TOKEN is not configured');
  }

  const url = new URL(META_AD_LIBRARY_BASE);
  url.searchParams.set('access_token', token);
  url.searchParams.set('search_terms', params.query);
  url.searchParams.set('ad_reached_countries', `["${params.country}"]`);
  url.searchParams.set('ad_type', params.adType || 'ALL');
  url.searchParams.set('fields', AD_FIELDS);
  url.searchParams.set('limit', String(params.limit || 30));

  if (params.after) {
    url.searchParams.set('after', params.after);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Meta API error ${response.status}: ${error?.error?.message || response.statusText}`
    );
  }

  const raw = await response.json();
  const ads: MetaAd[] = raw.data || [];

  const enriched = ads.map((ad) => {
    const score = scoreAd(ad);
    const body = ad.ad_creative_bodies?.[0] || '';
    const productKeywords = extractProductKeywords(body);
    const isActive = !ad.ad_delivery_stop_time;
    const daysSinceLaunch = ad.ad_delivery_start_time
      ? Math.floor(
          (Date.now() - new Date(ad.ad_delivery_start_time).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    const impressions = ad.impressions;
    const estimatedMonthlyImpressions = impressions
      ? Math.round(
          (parseInt(impressions.lower_bound || '0') +
            parseInt(impressions.upper_bound || '0')) /
            2
        )
      : 0;

    return {
      ...ad,
      sourcingScore: score,
      productKeywords,
      estimatedMonthlyImpressions,
      isActive,
      daysSinceLaunch,
    };
  });

  enriched.sort((a, b) => b.sourcingScore.overall - a.sourcingScore.overall);

  return {
    data: enriched,
    paging: raw.paging,
    total: enriched.length,
  };
}

function extractProductKeywords(text: string): string[] {
  if (!text) return [];

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'our',
    'your', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'get',
    'now', 'free', 'today', 'new', 'just', 'only', 'also', 'more',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  return [...new Set(words)].slice(0, 8);
}
