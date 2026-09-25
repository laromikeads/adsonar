import { NextRequest, NextResponse } from 'next/server';
import { searchMetaAds } from '@/lib/meta/client';
import { analyzeTrends } from '@/lib/analysis/scorer';
import { EnrichedAd } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const country = searchParams.get('country') || 'US';

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  try {
    const result = await searchMetaAds({ query, country, limit: 50 });
    const ads = result.data;

    const analysis = {
      summary: buildSummary(ads),
      trends: analyzeTrends(ads),
      platformBreakdown: getPlatformBreakdown(ads),
      ageBreakdown: getAgeBreakdown(ads),
      topAdvertisers: getTopAdvertisers(ads),
      scoreDistribution: getScoreDistribution(ads),
      activeVsInactive: {
        active: ads.filter((a) => a.isActive).length,
        inactive: ads.filter((a) => !a.isActive).length,
      },
      avgDaysRunning: Math.round(
        ads.reduce((sum, a) => sum + a.daysSinceLaunch, 0) / (ads.length || 1)
      ),
    };

    return NextResponse.json({ ads: ads.slice(0, 20), analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildSummary(ads: EnrichedAd[]) {
  const hot = ads.filter((a) => a.sourcingScore.label === 'Hot').length;
  const rising = ads.filter((a) => a.sourcingScore.label === 'Rising').length;
  const avgScore = Math.round(
    ads.reduce((sum, a) => sum + a.sourcingScore.overall, 0) / (ads.length || 1)
  );

  return {
    totalAds: ads.length,
    hotAds: hot,
    risingAds: rising,
    avgSourcingScore: avgScore,
    topScore: Math.max(0, ...ads.map((a) => a.sourcingScore.overall)),
  };
}

function getPlatformBreakdown(ads: EnrichedAd[]) {
  const counts: Record<string, number> = {};
  for (const ad of ads) {
    for (const p of ad.publisher_platforms || []) {
      counts[p] = (counts[p] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);
}

function getAgeBreakdown(ads: EnrichedAd[]) {
  const ageCounts: Record<string, number> = {};
  for (const ad of ads) {
    for (const d of ad.demographic_distribution || []) {
      ageCounts[d.age] = (ageCounts[d.age] || 0) + parseFloat(d.percentage || '0');
    }
  }
  return Object.entries(ageCounts)
    .map(([age, total]) => ({ age, percentage: Math.round(total / (ads.length || 1) * 10) / 10 }))
    .sort((a, b) => b.percentage - a.percentage);
}

function getTopAdvertisers(ads: EnrichedAd[]) {
  const map: Record<string, { count: number; avgScore: number; totalScore: number }> = {};
  for (const ad of ads) {
    const name = ad.page_name || 'Unknown';
    if (!map[name]) map[name] = { count: 0, avgScore: 0, totalScore: 0 };
    map[name].count++;
    map[name].totalScore += ad.sourcingScore.overall;
  }
  return Object.entries(map)
    .map(([name, { count, totalScore }]) => ({
      name,
      count,
      avgScore: Math.round(totalScore / count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getScoreDistribution(ads: EnrichedAd[]) {
  const buckets = [
    { range: '0-20', min: 0, max: 20, count: 0 },
    { range: '21-40', min: 21, max: 40, count: 0 },
    { range: '41-60', min: 41, max: 60, count: 0 },
    { range: '61-80', min: 61, max: 80, count: 0 },
    { range: '81-100', min: 81, max: 100, count: 0 },
  ];
  for (const ad of ads) {
    const score = ad.sourcingScore.overall;
    const bucket = buckets.find((b) => score >= b.min && score <= b.max);
    if (bucket) bucket.count++;
  }
  return buckets;
}
