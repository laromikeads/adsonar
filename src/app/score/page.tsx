'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

const STRONG_SIGNALS = [
  'الدفع عند الاستلام', 'الدفع عند الإستلام', 'باب منزل', 'باب دارك', 'باب المنزل',
  'توصيل لجميع', 'توصيل مجاني', 'livraison gratuite', 'livraison rapide',
  'اطلب الآن', 'اطلب الان', 'commandez maintenant', 'order now',
  'آلاف الطلبات', 'آلاف العملاء', 'نفذ المخزون', 'كميات محدودة',
  'stock limité', 'rupture de stock', 'sold out', 'limited stock',
  'تخفيض', 'عرض خاص', 'promotion', 'promo', 'soldes', 'offre limitée',
];

const BASIC_SIGNALS = [
  'توصيل', 'اطلب', 'اشتري', 'للطلب', 'متجر', 'منتج', 'سعر', 'مخزون', 'متوفر', 'ولاية',
  'اطلبه', 'اطلبها', 'اطلبي', 'اطلبو',
  'livraison', 'commander', 'commandez', 'acheter', 'achetez',
  'boutique', 'produit', 'prix', 'wilaya',
  'delivery', 'buy now', 'shop now', 'add to cart',
];

function scoreAd(text: string) {
  const t = text.toLowerCase();
  const strongCount = STRONG_SIGNALS.filter(s => t.includes(s.toLowerCase())).length;
  const basicCount = BASIC_SIGNALS.filter(s => t.includes(s.toLowerCase())).length;
  const score = Math.min(strongCount * 25 + basicCount * 10, 99);
  if (score >= 75) return { score, label: '🔥 Hot', color: '#166534', bg: '#f0fdf4', border: '#86efac' };
  if (score >= 50) return { score, label: '✅ Good', color: '#1e40af', bg: '#eff6ff', border: '#93c5fd' };
  if (score >= 25) return { score, label: '~ Weak', color: '#92400e', bg: '#fffbeb', border: '#fcd34d' };
  return { score, label: '○ Low', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
}

type AdResult = {
  id: string;
  text: string;
  score: number;
  label: string;
  color: string;
  bg: string;
  border: string;
};

export default function ScorePage() {
  const [results, setResults] = useState<AdResult[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('ads');
      if (!raw) { setError('No ad data received.'); return; }
      const ads: { id: string; text: string }[] = JSON.parse(decodeURIComponent(raw));
      const scored = ads.map(ad => ({ id: ad.id, text: ad.text, ...scoreAd(ad.text) }));
      scored.sort((a, b) => b.score - a.score);
      setResults(scored);
    } catch {
      setError('Failed to parse ad data.');
    }
  }, []);

  const hot = results.filter(r => r.score >= 75).length;
  const good = results.filter(r => r.score >= 50 && r.score < 75).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-4 pt-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h1 className="font-bold text-gray-900">AdSonar Results</h1>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {results.length > 0 && (
          <>
            <div className="flex gap-3 mb-4 text-sm">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">{results.length} ads scored</span>
              {hot > 0 && <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">🔥 {hot} Hot</span>}
              {good > 0 && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">✅ {good} Good</span>}
            </div>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={r.id} style={{ background: r.bg, borderColor: r.border }} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 font-medium">Ad {i + 1}</span>
                    <span style={{ color: r.color }} className="font-bold text-sm">{r.label}{r.score > 0 ? ` (${r.score})` : ''}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{r.text.slice(0, 200) || '(image only)'}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {results.length === 0 && !error && (
          <p className="text-gray-400 text-sm">Loading...</p>
        )}
      </div>
    </div>
  );
}
