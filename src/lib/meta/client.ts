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

// Strong ecom signals — clear product/delivery intent
const ECOM_SIGNALS = [
  // Arabic — DZ ecom phrases (high precision)
  'توصيل', 'اطلب', 'اشتري', 'للطلب', 'الدفع عند الاستلام', 'الدفع عند الإستلام',
  'متجر', 'منتج', 'سعر', 'تخفيض', 'عرض', 'مخزون', 'متوفر',
  'ولاية', // "58 ولاية" = delivery to 58 provinces — strong DZ ecom signal
  'اطلبه', 'اطلبها', 'اطلبي', 'اطلبو', 'اطلب الآن', 'اطلب الان',
  'باب منزل', 'باب دارك', 'باب المنزل',
  // French
  'livraison', 'commander', 'commandez', 'acheter', 'achetez',
  'boutique', 'produit', 'prix', 'promo', 'soldes', 'wilaya',
  // English
  'delivery', 'order now', 'buy now', 'shop now', 'add to cart',
];

// Hard blocklist — anything matching is NOT ecom
const NON_ECOM_SIGNALS = [
  // Drama / streaming Arabic
  'مدبلج', 'مسلسل', 'حلقة', 'موسم', 'مشاهدة', 'مسرحية', 'انمي',
  'مطعم الزلابية', 'دراما', 'رواية', 'قصة', 'روائي', 'فيلم عربي',
  'الملكة', 'الأميرة', 'القصر', 'العرش', 'الوريث',
  'تستيقظ', 'إيزابيلا',
  // Streaming / entertainment French/English
  'episode', 'serie', 'saison', 'regarder', 'streaming', 'doublage',
  'movie', 'drama', 'feuilleton',
  // Fiction
  'fiction', 'romance novel', 'thriller', 'chapitre', 'chapter',
  // Dating
  'rencontre', 'celibataire', 'dating',
  // News / politics / government
  'election', 'politique', 'gouvernement', 'انتخاب', 'حزب', 'ولاية منتدبة',
  'الوالي', 'الوالية', 'بلدية', 'مقاطعة', 'برلمان', 'رئاسي',
  // Jobs / recruitment
  'emploi', 'recrutement', 'توظيف', 'تكوين مهني', 'تسجيل مفتوح',
  // Religious / non-commercial
  'فضائل', 'حديث', 'الإمام', 'الشيعة', 'كربلاء', 'زيارة السيدة',
  // Rideshare / apps (Yassir etc)
  'منشطي يسير', 'شريك يسير', 'yassir cash', 'yassir driver',
  // News pages
  'أخبار', 'تقرير', 'مراسل', 'صحيفة',
  // Removed by Meta
  'this content was removed', 'ce contenu a été supprimé',
  'this ad ran without a required disclaimer',
];

function isEcomAd(ad: MetaAd): boolean {
  const text = [
    ...(ad.ad_creative_bodies || []),
    ...(ad.ad_creative_link_titles || []),
    ...(ad.ad_creative_link_descriptions || []),
    ...(ad.ad_creative_link_captions || []),
  ].join(' ').toLowerCase();

  if (!text) return false; // no text = skip, can't judge

  // Hard block non-ecom first
  const hasNonEcom = NON_ECOM_SIGNALS.some((signal) => text.includes(signal.toLowerCase()));
  if (hasNonEcom) return false;

  // Must have at least one strong ecom signal
  const hasEcom = ECOM_SIGNALS.some((signal) => text.includes(signal.toLowerCase()));
  return hasEcom;
}

export async function searchMetaAds(params: SearchParams): Promise<SearchResult> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new Error('META_ACCESS_TOKEN is not configured');
  }

  const fetchLimit = params.ecomOnly
    ? Math.min((params.limit || 30) * 3, 100)
    : Math.min(params.limit || 30, 100);

  const url = new URL(META_AD_LIBRARY_BASE);
  url.searchParams.set('access_token', token);
  url.searchParams.set('search_terms', params.query);
  url.searchParams.set('ad_reached_countries', `["${params.country}"]`);
  url.searchParams.set('ad_type', params.adType || 'ALL');
  url.searchParams.set('fields', AD_FIELDS);
  url.searchParams.set('limit', String(fetchLimit));

  if (params.activeOnly) {
    url.searchParams.set('ad_active_status', 'ACTIVE');
  }

  if (params.platform) {
    url.searchParams.set('publisher_platforms', `["${params.platform}"]`);
  }

  if (params.after) {
    url.searchParams.set('after', params.after);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Meta API error ${response.status}: ${error?.error?.message || response.statusText}`
    );
  }

  const raw = await response.json();
  const ads: MetaAd[] = raw.data || [];

  const ecomAds = params.ecomOnly ? ads.filter(isEcomAd) : ads;

  const enriched = ecomAds.map((ad) => {
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

  return {
    data: enriched.slice(0, params.limit || 30),
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
    'les', 'des', 'une', 'est', 'qui', 'que', 'pour', 'dans', 'avec',
    'sur', 'par', 'son', 'ses', 'leur', 'tout', 'plus', 'vous', 'nous',
    'pas', 'comme', 'mais', 'elle', 'ils', 'elles', 'cette', 'comment',
    'entre', 'sans', 'bien', 'alors', 'aussi', 'dont', 'quand', 'très',
    'votre', 'notre', 'avoir', 'fait', 'passer', 'pour', 'homme',
    'click', 'shop', 'sale', 'off', 'discount', 'limited', 'order',
    'voir', 'cliquez', 'découvrez', 'obtenez', 'achetez', 'maintenant',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\p{L}0-9\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4 && !stopWords.has(w));

  return [...new Set(words)].slice(0, 8);
}
