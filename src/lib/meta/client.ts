import { MetaAd, SearchParams, SearchResult } from '@/types';
import { scoreAd } from '@/lib/analysis/scorer';

const META_AD_LIBRARY_BASE = 'https://graph.facebook.com/v21.0/ads_archive';

const AD_FIELDS = [
  'id', 'page_id', 'page_name',
  'ad_creative_bodies', 'ad_creative_link_captions',
  'ad_creative_link_descriptions', 'ad_creative_link_titles',
  'ad_delivery_start_time', 'ad_delivery_stop_time',
  'ad_snapshot_url', 'currency', 'demographic_distribution',
  'delivery_by_region', 'estimated_audience_size',
  'impressions', 'spend', 'languages', 'publisher_platforms',
].join(',');

const NON_ECOM_SIGNALS = [
  'مدبلج', 'مسلسل', 'حلقة', 'موسم', 'مشاهدة', 'مسرحية', 'انمي',
  'دراما', 'رواية', 'قصة', 'روائي',
  'episode', 'serie', 'saison', 'regarder', 'watch', 'streaming', 'doublage',
  'movie', 'drama', 'roman', 'feuilleton', 'tele',
  'fiction', 'romance', 'novel', 'thriller', 'fantasy', 'manga', 'comic',
  'dark romance', 'love story', 'chapitre', 'chapter', 'lecture',
  'rencontre', 'celibataire', 'dating',
  'election', 'politique', 'gouvernement', 'president',
  'emploi', 'recrutement', 'embauche', 'cdi', 'cdd',
  'casino', 'jackpot', 'pari',
];

const ECOM_SIGNALS = [
  'buy', 'shop', 'order', 'shipping', 'delivery', 'store', 'product',
  'price', 'offer', 'deal', 'discount', 'sale', 'stock', 'available',
  'checkout', 'cart', 'purchase', 'limited', 'bundle', 'pack', 'kit',
  'acheter', 'achetez', 'commandez', 'livraison', 'boutique', 'produit',
  'prix', 'offre', 'promo', 'reduction', 'soldes', 'disponible',
  'panier', 'commander', 'expedition', 'gratuit', 'qualite', 'collection',
  'wilaya', 'ولاية', 'ولايات',
  'اشتري', 'اطلب', 'توصيل', 'متجر', 'منتج', 'منتوج', 'سعر', 'عرض',
  'تخفيض', 'مخزون', 'متوفر', 'جودة', 'مجاني',
];

function isEcomAd(ad: MetaAd): boolean {
  const text = [
    ...(ad.ad_creative_bodies || []),
    ...(ad.ad_creative_link_titles || []),
    ...(ad.ad_creative_link_descriptions || []),
    ...(ad.ad_creative_link_captions || []),
  ].join(' ').toLowerCase();

  if (text.includes('this content was removed')) return false;
  if (!text) return true;

  const hasNonEcom = NON_ECOM_SIGNALS.some((s) => text.includes(s));
  if (hasNonEcom) return false;

  const hasEcom = ECOM_SIGNALS.some((s) => text.includes(s));
  const hasLink = !!(ad.ad_creative_link_titles?.length || ad.ad_creative_link_captions?.length);

  return hasEcom || hasLink;
}

export async function searchMetaAds(params: SearchParams): Promise<SearchResult> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error('META_ACCESS_TOKEN is not configured');

  const fetchLimit = Math.min((params.limit || 30) * 4, 100);

  const url = new URL(META_AD_LIBRARY_BASE);
  url.searchParams.set('access_token', token);
  url.searchParams.set('search_terms', params.query);
  url.searchParams.set('ad_reached_countries', `["${params.country}"]`);
  url.searchParams.set('ad_type', params.adType || 'ALL');
  url.searchParams.set('search_type', 'KEYWORD_UNORDERED');
  url.searchParams.set('fields', AD_FIELDS);
  url.searchParams.set('limit', String(fetchLimit));

  if (params.after) url.searchParams.set('after', params.after);

  const response = await fetch(url.toString(), { next: { revalidate: 300 } });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Meta API error ${response.status}: ${error?.error?.message || response.statusText}`);
  }

  const raw = await response.json();
  const ads: MetaAd[] = raw.data || [];

  const ecomAds = params.ecomOnly !== false ? ads.filter(isEcomAd) : ads;

  const enriched = ecomAds.map((ad) => {
    const score = scoreAd(ad);
    const body = ad.ad_creative_bodies?.[0] || '';
    const productKeywords = extractProductKeywords(body);
    const isActive = !ad.ad_delivery_stop_time;
    const daysSinceLaunch = ad.ad_delivery_start_time
      ? Math.floor((Date.now() - new Date(ad.ad_delivery_start_time).getTime()) / 86400000)
      : 0;

    const impressions = ad.impressions;
    const estimatedMonthlyImpressions = impressions
      ? Math.round((parseInt(impressions.lower_bound || '0') + parseInt(impressions.upper_bound || '0')) / 2)
      : 0;

    return { ...ad, sourcingScore: score, productKeywords, estimatedMonthlyImpressions, isActive, daysSinceLaunch };
  });

  // Sort by impressions first (like Meta), then by score
  enriched.sort((a, b) => {
    const impA = a.estimatedMonthlyImpressions;
    const impB = b.estimatedMonthlyImpressions;
    if (impB !== impA) return impB - impA;
    return b.sourcingScore.overall - a.sourcingScore.overall;
  });

  return {
    data: enriched.slice(0, params.limit || 30),
    paging: raw.paging,
    total: enriched.length,
  };
}

function extractProductKeywords(text: string): string[] {
  if (!text) return [];
  const stopWords = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
    'from','up','about','into','our','your','this','that','is','are','was','were',
    'be','been','have','has','had','do','does','did','will','would','could','should',
    'may','might','can','get','now','free','today','new','just','only','also','more',
    'les','des','une','est','qui','que','pour','dans','avec','sur','par','son','ses',
    'leur','tout','plus','vous','nous','pas','comme','mais','elle','ils','elles',
    'cette','entre','sans','bien','alors','aussi','votre','notre','avoir','fait',
    'click','shop','sale','off','discount','limited','order','voir','cliquez','achetez','maintenant',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\p{L}0-9\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  return [...new Set(words)].slice(0, 8);
}
