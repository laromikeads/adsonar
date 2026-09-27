import { NextRequest, NextResponse } from 'next/server';

// Sourcing strength signals — more = stronger product ad
const STRONG_SIGNALS = [
  // Delivery / urgency
  'الدفع عند الاستلام', 'الدفع عند الإستلام', 'باب منزل', 'باب دارك', 'باب المنزل',
  'توصيل لجميع', 'توصيل مجاني', 'livraison gratuite', 'livraison rapide',
  'اطلب الآن', 'اطلب الان', 'commandez maintenant', 'order now',
  // Proof / social
  'آلاف الطلبات', 'آلاف العملاء', 'نفذ المخزون', 'كميات محدودة',
  'stock limité', 'rupture de stock', 'sold out', 'limited stock',
  // Price / offer
  'تخفيض', 'عرض خاص', 'promotion', 'promo', 'soldes', 'offre limitée',
];

const BASIC_SIGNALS = [
  'توصيل', 'اطلب', 'اشتري', 'للطلب', 'متجر', 'منتج', 'سعر', 'مخزون', 'متوفر', 'ولاية',
  'اطلبه', 'اطلبها', 'اطلبي', 'اطلبو',
  'livraison', 'commander', 'commandez', 'acheter', 'achetez',
  'boutique', 'produit', 'prix', 'wilaya',
  'delivery', 'buy now', 'shop now', 'add to cart',
];

function scoreAd(text: string): { score: number; label: string; color: string } {
  const t = text.toLowerCase();

  const strongCount = STRONG_SIGNALS.filter(s => t.includes(s.toLowerCase())).length;
  const basicCount = BASIC_SIGNALS.filter(s => t.includes(s.toLowerCase())).length;

  const score = Math.min(strongCount * 25 + basicCount * 10, 99);

  if (score >= 75) return { score, label: '🔥 Hot', color: '#166534' };
  if (score >= 50) return { score, label: '✅ Good', color: '#1e40af' };
  if (score >= 25) return { score, label: '~ Weak', color: '#92400e' };
  return { score, label: '○ Low', color: '#6b7280' };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const ads: { id: string; text: string; pageName: string }[] = body.ads || [];

  const results = ads.map(ad => ({
    id: ad.id,
    pageName: ad.pageName,
    ...scoreAd(ad.text),
  }));

  return NextResponse.json({ results }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
