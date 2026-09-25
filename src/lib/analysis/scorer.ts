import { MetaAd, SourcingScore } from '@/types';

export function scoreAd(ad: MetaAd): SourcingScore {
  const trendSignal = scoreTrendSignal(ad);
  const audienceSize = scoreAudienceSize(ad);
  const adDuration = scoreAdDuration(ad);
  const engagementPotential = scoreEngagementPotential(ad);

  const overall = Math.round(
    trendSignal * 0.35 +
      audienceSize * 0.25 +
      adDuration * 0.25 +
      engagementPotential * 0.15
  );

  const label = getLabel(overall, adDuration);

  return {
    overall,
    trendSignal,
    audienceSize,
    adDuration,
    engagementPotential,
    label,
  };
}

function scoreTrendSignal(ad: MetaAd): number {
  const isActive = !ad.ad_delivery_stop_time;
  const daysOld = ad.ad_delivery_start_time
    ? Math.floor(
        (Date.now() - new Date(ad.ad_delivery_start_time).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 999;

  let score = 0;
  if (isActive) score += 40;

  if (daysOld <= 7) score += 60;
  else if (daysOld <= 14) score += 50;
  else if (daysOld <= 30) score += 35;
  else if (daysOld <= 60) score += 20;
  else if (daysOld <= 90) score += 10;
  else score += 0;

  return Math.min(100, score);
}

function scoreAudienceSize(ad: MetaAd): number {
  const size = ad.estimated_audience_size;
  if (!size) return 55;

  const avg = (size.lower_bound + size.upper_bound) / 2;

  if (avg >= 10_000_000) return 100;
  if (avg >= 5_000_000) return 85;
  if (avg >= 1_000_000) return 70;
  if (avg >= 500_000) return 55;
  if (avg >= 100_000) return 40;
  if (avg >= 50_000) return 25;
  return 10;
}

function scoreAdDuration(ad: MetaAd): number {
  const daysOld = ad.ad_delivery_start_time
    ? Math.floor(
        (Date.now() - new Date(ad.ad_delivery_start_time).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;
  const isActive = !ad.ad_delivery_stop_time;

  if (!isActive) {
    return Math.max(0, 30 - daysOld * 0.5);
  }

  if (daysOld >= 3 && daysOld <= 45) return 100;
  if (daysOld > 45 && daysOld <= 90) return 75;
  if (daysOld > 90 && daysOld <= 180) return 50;
  if (daysOld > 180) return 25;
  if (daysOld < 3) return 75;
  return 30;
}

function scoreEngagementPotential(ad: MetaAd): number {
  let score = 0;

  const platforms = ad.publisher_platforms || [];
  if (platforms.length >= 3) score += 30;
  else if (platforms.length === 2) score += 20;
  else if (platforms.length === 1) score += 10;

  const hasTitle = (ad.ad_creative_link_titles?.length || 0) > 0;
  const hasDesc = (ad.ad_creative_link_descriptions?.length || 0) > 0;
  const hasCaption = (ad.ad_creative_link_captions?.length || 0) > 0;
  const hasBody = (ad.ad_creative_bodies?.length || 0) > 0;

  if (hasTitle) score += 15;
  if (hasDesc) score += 15;
  if (hasCaption) score += 10;
  if (hasBody) score += 10;

  const regions = ad.delivery_by_region || [];
  if (regions.length >= 5) score += 20;
  else if (regions.length >= 2) score += 10;

  return Math.min(100, score);
}

function getLabel(overall: number, duration: number): SourcingScore['label'] {
  if (overall >= 75) return 'Hot';
  if (overall >= 55) return 'Rising';
  if (duration < 30) return 'Stable';
  return 'Declining';
}

export function analyzeTrends(ads: Array<{ productKeywords: string[]; sourcingScore: SourcingScore }>) {
  const keywordMap = new Map<string, { count: number; totalScore: number }>();

  for (const ad of ads) {
    for (const kw of ad.productKeywords) {
      const existing = keywordMap.get(kw) || { count: 0, totalScore: 0 };
      keywordMap.set(kw, {
        count: existing.count + 1,
        totalScore: existing.totalScore + ad.sourcingScore.overall,
      });
    }
  }

  return Array.from(keywordMap.entries())
    .map(([keyword, { count, totalScore }]) => ({
      keyword,
      count,
      avgScore: Math.round(totalScore / count),
    }))
    .sort((a, b) => b.count * b.avgScore - a.count * a.avgScore)
    .slice(0, 15);
}
