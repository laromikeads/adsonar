'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

// ── Signal lists ──────────────────────────────────────────────
const STRONG_SIGNALS = [
  'الدفع عند الاستلام','الدفع عند الإستلام','باب منزل','باب دارك','باب المنزل',
  'توصيل لجميع','توصيل مجاني','livraison gratuite','livraison rapide',
  'اطلب الآن','اطلب الان','commandez maintenant','order now',
  'آلاف الطلبات','آلاف العملاء','نفذ المخزون','كميات محدودة',
  'stock limité','rupture de stock','sold out','limited stock',
  'تخفيض','عرض خاص','promotion','promo','soldes','offre limitée',
];
const BASIC_SIGNALS = [
  'توصيل','اطلب','اشتري','للطلب','متجر','منتج','سعر','مخزون','متوفر','ولاية',
  'اطلبه','اطلبها','اطلبي','اطلبو',
  'livraison','commander','commandez','acheter','achetez',
  'boutique','produit','prix','wilaya',
  'delivery','buy now','shop now','add to cart',
];

// ── Generic words to ignore in keyword extraction ─────────────
const GENERIC = new Set([
  'الجودة','الأفضل','الأحسن','الحل','المثالي','بسهولة','اليوم','الان','الأن',
  'يومية','عالية','قوية','سريع','سريعة','مريح','مريحة','جميل','جميلة',
  'أصلي','أصلية','خفيف','خفيفة','ممتاز','رائع','رائعة','مضمون','للجميع',
  'للرجال','للنساء','مناسب','مناسبة','مثالي','مثالية','احسن','افضل',
  'كبير','صغير','جديد','جديدة','ممتازة','خاص','خاصة',
  'shop','store','now','free','click','voir','prix','bon','top','best',
  'plus','pour','avec','dans','notre','vous','style','mode','qualite',
  'taille','couleur','design','produit','article','marque','livraison','achat',
]);

const MONTHS: Record<string, number> = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
};

// ── Helpers ───────────────────────────────────────────────────
function parseDays(text: string): number {
  const m = text.match(/started running on\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i);
  if (!m) return 0;
  const d = parseInt(m[1]);
  const month = MONTHS[m[2].toLowerCase().slice(0, 3)];
  const y = parseInt(m[3]);
  if (month === undefined) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(y, month, d).getTime()) / 864e5));
}

function getAdBody(text: string): string {
  const m = text.match(/Sponsored\n([\s\S]{10,500})/);
  return m ? m[1].slice(0, 400) : text.slice(0, 400);
}

function getKeywords(body: string): string[] {
  const words = body
    .replace(/[^؀-ۿݐ-ݿa-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 5 && !GENERIC.has(w.toLowerCase()));
  const freq: Record<string, number> = {};
  words.forEach(w => { const k = w.toLowerCase(); freq[k] = (freq[k] || 0) + 1; });
  return Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 4);
}

// ── Scoring ───────────────────────────────────────────────────
type AdInput = { id: string; text: string; pageName: string };

function scoreAd(ad: AdInput, allAds: AdInput[]) {
  const text = ad.text;
  const t = text.toLowerCase();
  const body = getAdBody(text);
  const kw = getKeywords(body);
  const days = parseDays(text);

  // 1. Days running (max 40 pts)
  let daysScore = 0;
  if (days >= 90) daysScore = 40;
  else if (days >= 60) daysScore = 32;
  else if (days >= 30) daysScore = 22;
  else if (days >= 14) daysScore = 12;
  else if (days >= 7) daysScore = 5;

  // 2. Product velocity — other DIFFERENT pages with 2+ matching keywords (max 30 pts)
  const productMatches = kw.length >= 2
    ? allAds.filter(o =>
        o.id !== ad.id &&
        o.pageName !== ad.pageName &&
        getKeywords(getAdBody(o.text)).filter(k => kw.includes(k)).length >= 2
      ).length
    : 0;
  let velocityScore = 0;
  if (productMatches >= 5) velocityScore = 30;
  else if (productMatches >= 3) velocityScore = 22;
  else if (productMatches >= 2) velocityScore = 14;
  else if (productMatches >= 1) velocityScore = 7;

  // 3. Spend range (max 15 pts, bonus when visible)
  const spendMatch = text.match(/[€$£﷼]([\d,]+)\s*[-–]/);
  const spend = spendMatch ? parseInt(spendMatch[1].replace(/,/g, '')) : 0;
  let spendScore = 0;
  if (spend >= 5000) spendScore = 15;
  else if (spend >= 1000) spendScore = 10;
  else if (spend >= 100) spendScore = 5;

  // 4. Keywords (max 10 pts)
  const strongCount = STRONG_SIGNALS.filter(s => t.includes(s.toLowerCase())).length;
  const basicCount = BASIC_SIGNALS.filter(s => t.includes(s.toLowerCase())).length;
  const kwScore = Math.min(strongCount * 4 + basicCount * 1, 10);

  const score = Math.min(daysScore + velocityScore + spendScore + kwScore, 99);

  const breakdown = { days, daysScore, productMatches, velocityScore, spendScore, kwScore };

  if (score >= 75) return { score, label: '🔥 Hot', color: '#166534', bg: '#f0fdf4', border: '#86efac', breakdown };
  if (score >= 50) return { score, label: '✅ Good', color: '#1e40af', bg: '#eff6ff', border: '#93c5fd', breakdown };
  if (score >= 25) return { score, label: '~ Weak', color: '#92400e', bg: '#fffbeb', border: '#fcd34d', breakdown };
  return { score, label: '○ Low', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', breakdown };
}

type AdResult = AdInput & ReturnType<typeof scoreAd>;

// ── Page ──────────────────────────────────────────────────────
export default function ScorePage() {
  const [results, setResults] = useState<AdResult[]>([]);
  const [status, setStatus] = useState('Waiting for ad data...');

  useEffect(() => {
    let received = false;

    function processAds(ads: AdInput[]) {
      if (received) return;
      received = true;
      const filtered = ads.filter((a: AdInput) =>
        a.pageName && !a.pageName.includes('INSTAGRAM') && !a.pageName.includes('Visit') && !a.pageName.includes('Send')
      );
      if (filtered.length === 0) { setStatus('No ads found.'); return; }
      const scored = filtered.map(ad => ({ ...ad, ...scoreAd(ad, filtered) }));
      scored.sort((a, b) => b.score - a.score);
      setResults(scored);
      setStatus('');
    }

    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'https://www.facebook.com') return;
      const data = event.data;
      if (!data || data.type !== 'adsonar' || !Array.isArray(data.ads)) return;
      // Tell the opener to stop sending
      try { event.source && (event.source as Window).postMessage({ type: 'adsonar_ack' }, event.origin); } catch {}
      processAds(data.ads);
    }

    window.addEventListener('message', handleMessage);

    // Also check if opener already stored data (race condition fallback)
    const check = setInterval(() => {
      try {
        const opener = window.opener;
        if (opener && opener.__adsonar_data) {
          clearInterval(check);
          processAds(opener.__adsonar_data);
        }
      } catch {}
    }, 300);

    setTimeout(() => clearInterval(check), 15000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(check);
    };
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

        {status && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">{status}</p>
            <p className="text-gray-300 text-xs mt-2">Click the bookmarklet on Meta Ad Library</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 mb-4 text-sm">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">{results.length} ads scored</span>
              {hot > 0 && <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">🔥 {hot} Hot</span>}
              {good > 0 && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">✅ {good} Good</span>}
            </div>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={r.id} style={{ background: r.bg, borderColor: r.border }} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 font-semibold truncate max-w-[60%]">{r.pageName}</span>
                    <span style={{ color: r.color }} className="font-bold text-sm shrink-0">{r.label} ({r.score})</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2">{getAdBody(r.text).slice(0, 120) || '(image only)'}</p>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {r.breakdown.days > 0 && (
                      <span className="bg-white/80 border border-gray-200 rounded-full px-2 py-0.5 text-gray-500">📅 {r.breakdown.days}d</span>
                    )}
                    {r.breakdown.productMatches > 0 && (
                      <span className="bg-white/80 border border-gray-200 rounded-full px-2 py-0.5 text-gray-500">⚡ {r.breakdown.productMatches} sellers</span>
                    )}
                    {r.breakdown.spendScore > 0 && (
                      <span className="bg-white/80 border border-gray-200 rounded-full px-2 py-0.5 text-gray-500">💰 spend</span>
                    )}
                    {r.breakdown.kwScore > 0 && (
                      <span className="bg-white/80 border border-gray-200 rounded-full px-2 py-0.5 text-gray-500">🎯 ecom signals</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
