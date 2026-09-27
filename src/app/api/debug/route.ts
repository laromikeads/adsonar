import { NextRequest, NextResponse } from 'next/server';

const ECOM_SIGNALS = [
  'توصيل', 'اطلب', 'اشتري', 'للطلب', 'الدفع عند الاستلام', 'الدفع عند الإستلام',
  'متجر', 'منتج', 'سعر', 'تخفيض', 'عرض', 'مخزون', 'متوفر',
  'ولاية', 'اطلبه', 'اطلبها', 'اطلبي', 'اطلبو', 'اطلب الآن', 'اطلب الان',
  'باب منزل', 'باب دارك', 'باب المنزل',
  'livraison', 'commander', 'commandez', 'acheter', 'achetez',
  'boutique', 'produit', 'prix', 'promo', 'soldes', 'wilaya',
  'delivery', 'order now', 'buy now', 'shop now', 'add to cart',
];

const NON_ECOM_SIGNALS = [
  'مدبلج', 'مسلسل', 'حلقة', 'موسم', 'مشاهدة', 'مسرحية', 'انمي',
  'مطعم الزلابية', 'دراما', 'رواية', 'قصة', 'روائي', 'فيلم عربي',
  'الملكة', 'الأميرة', 'القصر', 'العرش', 'الوريث',
  'تستيقظ', 'إيزابيلا',
  'episode', 'serie', 'saison', 'regarder', 'streaming', 'doublage',
  'movie', 'drama', 'feuilleton',
  'fiction', 'romance novel', 'thriller', 'chapitre', 'chapter',
  'rencontre', 'celibataire', 'dating',
  'election', 'politique', 'gouvernement', 'انتخاب', 'حزب', 'ولاية منتدبة',
  'الوالي', 'الوالية', 'بلدية', 'مقاطعة', 'برلمان', 'رئاسي',
  'emploi', 'recrutement', 'توظيف', 'تكوين مهني', 'تسجيل مفتوح',
  'فضائل', 'حديث', 'الإمام', 'الشيعة', 'كربلاء', 'زيارة السيدة',
  'منشطي يسير', 'شريك يسير', 'yassir cash', 'yassir driver',
  'أخبار', 'تقرير', 'مراسل', 'صحيفة',
  'this content was removed', 'ce contenu a été supprimé',
  'this ad ran without a required disclaimer',
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'كريم';
  const country = searchParams.get('country') || 'DZ';
  const activeOnly = searchParams.get('active_only') === 'true';

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'no token' }, { status: 500 });

  const url = new URL('https://graph.facebook.com/v21.0/ads_archive');
  url.searchParams.set('access_token', token);
  url.searchParams.set('search_terms', query);
  url.searchParams.set('ad_reached_countries', `["${country}"]`);
  url.searchParams.set('ad_type', 'ALL');
  url.searchParams.set('fields', 'id,page_name,ad_creative_bodies,ad_creative_link_titles,ad_creative_link_descriptions,ad_creative_link_captions,ad_delivery_stop_time');
  url.searchParams.set('limit', '100');
  if (activeOnly) url.searchParams.set('ad_active_status', 'ACTIVE');

  const res = await fetch(url.toString());
  const raw = await res.json();
  if (raw.error) return NextResponse.json({ error: raw.error.message }, { status: 500 });

  const ads = raw.data || [];
  const results = ads.map((ad: Record<string, unknown>) => {
    const text = [
      ...((ad.ad_creative_bodies as string[]) || []),
      ...((ad.ad_creative_link_titles as string[]) || []),
      ...((ad.ad_creative_link_descriptions as string[]) || []),
      ...((ad.ad_creative_link_captions as string[]) || []),
    ].join(' ').toLowerCase();

    if (!text.trim()) return { page: ad.page_name, verdict: 'PASS', reason: 'no-text' };

    const nonEcom = NON_ECOM_SIGNALS.find(s => text.includes(s.toLowerCase()));
    if (nonEcom) return { page: ad.page_name, verdict: 'BLOCK', reason: `non-ecom: "${nonEcom}"`, preview: text.slice(0, 80) };

    const ecom = ECOM_SIGNALS.find(s => text.includes(s.toLowerCase()));
    if (ecom) return { page: ad.page_name, verdict: 'PASS', reason: `ecom: "${ecom}"` };

    return { page: ad.page_name, verdict: 'DROP', reason: 'no ecom signal', preview: text.slice(0, 80) };
  });

  const passed = results.filter((r: {verdict: string}) => r.verdict === 'PASS').length;
  const blocked = results.filter((r: {verdict: string}) => r.verdict === 'BLOCK').length;
  const dropped = results.filter((r: {verdict: string}) => r.verdict === 'DROP').length;

  return NextResponse.json({
    total: ads.length,
    passed, blocked, dropped,
    breakdown: results,
  });
}
