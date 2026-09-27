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
  'دراما', 'رواية', 'قصة', 'روائي', 'فيلم عربي',
  'الملكة', 'الأميرة', 'القصر', 'العرش', 'الوريث',
  'تستيقظ', 'إيزابيلا',
  'episode', 'serie', 'saison', 'regarder', 'streaming', 'doublage',
  'movie', 'drama', 'feuilleton', 'fiction', 'romance novel', 'thriller',
  'rencontre', 'celibataire', 'dating',
  'election', 'politique', 'gouvernement', 'انتخاب', 'حزب', 'ولاية منتدبة',
  'الوالي', 'الوالية', 'بلدية', 'مقاطعة', 'برلمان', 'رئاسي',
  'emploi', 'recrutement', 'توظيف', 'تكوين مهني',
  'فضائل', 'حديث', 'الإمام', 'الشيعة', 'كربلاء',
  'منشطي يسير', 'شريك يسير', 'yassir cash', 'yassir driver',
  'أخبار', 'تقرير', 'مراسل', 'صحيفة',
  'استثمار', 'مشروع استثماري', 'طاقة شمسية', 'crypto', 'bitcoin', 'invest',
  'this content was removed', 'ce contenu a été supprimé',
];

function scoreText(text: string): { score: number; label: string; signal: string; isEcom: boolean } {
  const t = text.toLowerCase();

  const nonEcom = NON_ECOM_SIGNALS.find(s => t.includes(s.toLowerCase()));
  if (nonEcom) {
    return { score: 0, label: 'Not Ecom', signal: nonEcom, isEcom: false };
  }

  if (!t.trim()) {
    return { score: 50, label: 'Image Only', signal: '', isEcom: true };
  }

  const ecomSignals = ECOM_SIGNALS.filter(s => t.includes(s.toLowerCase()));
  if (ecomSignals.length === 0) {
    return { score: 0, label: 'No Signal', signal: '', isEcom: false };
  }

  const score = Math.min(50 + ecomSignals.length * 15, 99);
  const label = score >= 80 ? 'Hot 🔥' : score >= 65 ? 'Good ✅' : 'Weak';

  return { score, label, signal: ecomSignals[0], isEcom: true };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const ads: { id: string; text: string; pageName: string }[] = body.ads || [];

  const results = ads.map(ad => ({
    id: ad.id,
    pageName: ad.pageName,
    ...scoreText(ad.text),
  }));

  return NextResponse.json({ results });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
