const STOP = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'from','up','about','into','our','your','this','that','is','are','was',
  'were','be','have','has','had','do','does','did','will','would','could',
  'should','may','might','can','get','now','free','today','new','just',
  'only','also','more','buy','shop','order','click','here','sale',
  'les','des','une','est','qui','que','pour','dans','avec','sur','par',
  'son','ses','leur','tout','plus','vous','nous','pas','comme','mais',
  'elle','ils','elles','cette','entre','sans','bien','alors','aussi',
  'votre','notre','avoir','fait','voir','cliquez','achetez','maintenant',
  'offre','promo','livraison','gratuit','commandez','acheter',
  'في','من','على','إلى','عن','مع','هذا','هذه','التي','الذي','الذين',
  'هو','هي','هم','نحن','أنا','أنت','أنتم','كان','كانت','يكون',
  'إن','أن','لأن','حتى','لكن','أو','ثم','بعد','قبل','عند','بين',
  'كل','بعض','غير','حيث','كيف','ماذا','لماذا','متى','أين',
  'اشتري','مجاني','الان','الآن','احصل','اسرع','تواصل','اتصل','واتساب',
  'فقط','اليوم','محدود','رسمي',
]);

export function extractFingerprint(ad: {
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_captions?: string[];
}): { fingerprint: string; name: string; keywords: string[] } {
  const allText = [
    ...(ad.ad_creative_bodies || []),
    ...(ad.ad_creative_link_titles || []),
    ...(ad.ad_creative_link_descriptions || []),
    ...(ad.ad_creative_link_captions || []),
  ].join(' ');

  const filtered = allText
    .toLowerCase()
    .replace(/[^\p{L}0-9\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));

  const keywords = [...new Set(filtered)].sort().slice(0, 8);
  let fingerprint = keywords.slice(0, 5).join('|');

  if (!fingerprint || fingerprint.length < 3) {
    const raw = allText
      .toLowerCase()
      .replace(/[^\p{L}0-9\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .slice(0, 5);
    fingerprint = raw.join('|');
  }

  const name =
    ad.ad_creative_link_titles?.[0]?.slice(0, 80) ||
    ad.ad_creative_bodies?.[0]?.slice(0, 60) ||
    'Unknown product';

  return { fingerprint: fingerprint || 'no-text', name, keywords };
}

export function fingerprintSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const setA = new Set(a.split('|'));
  const setB = new Set(b.split('|'));
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}
