'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, BarChart3, Bookmark, TrendingUp, Users, Flame, ArrowUpRight } from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import {
  ScoreDistributionChart,
  PlatformPieChart,
  TrendKeywordsChart,
} from '@/components/charts/ScoreChart';
import { EnrichedAd, COUNTRIES } from '@/types';

interface AnalysisResult {
  ads: EnrichedAd[];
  analysis: {
    summary: {
      totalAds: number;
      hotAds: number;
      risingAds: number;
      avgSourcingScore: number;
      topScore: number;
    };
    trends: { keyword: string; count: number; avgScore: number }[];
    platformBreakdown: { platform: string; count: number }[];
    topAdvertisers: { name: string; count: number; avgScore: number }[];
    scoreDistribution: { range: string; count: number }[];
    activeVsInactive: { active: number; inactive: number };
    avgDaysRunning: number;
  };
}

interface SavedAd {
  id: string;
  ad_id: string;
  page_name: string;
  body: string;
  snapshot_url: string;
  country: string;
  sourcing_score: number;
  label: string;
  saved_at: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const initialCountry = searchParams.get('country') || 'US';
  const initialTab = searchParams.get('tab') || 'analyze';

  const [tab, setTab] = useState<'analyze' | 'saved'>(initialTab as 'analyze' | 'saved');
  const [query, setQuery] = useState(initialQuery);
  const [country, setCountry] = useState(initialCountry);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/analyze?query=${encodeURIComponent(query)}&country=${country}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  }, [query, country]);

  const loadSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const res = await fetch('/api/save');
      const data = await res.json();
      setSavedAds(data.data || []);
    } catch { /* ignore */ } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) analyze();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (tab === 'saved') loadSaved();
  }, [tab, loadSaved]);

  const deleteSaved = async (id: string) => {
    await fetch(`/api/save?id=${id}`, { method: 'DELETE' });
    setSavedAds((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['analyze', 'saved'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'analyze' ? <BarChart3 className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            {t === 'analyze' ? 'Campaign Analysis' : 'Saved Ads'}
          </button>
        ))}
      </div>

      {/* Analyze tab */}
      {tab === 'analyze' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter product or keyword to analyze…"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && analyze()}
            />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={analyze}
              disabled={loading || !query.trim()}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              Analyze
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              <span>Analyzing campaigns…</span>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* KPI tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiTile icon={<BarChart3 className="w-5 h-5 text-blue-500" />} label="Total Ads" value={result.analysis.summary.totalAds} />
                <KpiTile icon={<Flame className="w-5 h-5 text-red-500" />} label="Hot Products" value={result.analysis.summary.hotAds} highlight />
                <KpiTile icon={<ArrowUpRight className="w-5 h-5 text-orange-500" />} label="Rising" value={result.analysis.summary.risingAds} />
                <KpiTile icon={<TrendingUp className="w-5 h-5 text-green-500" />} label="Avg Score" value={result.analysis.summary.avgSourcingScore} />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Score Distribution</h3>
                  <ScoreDistributionChart data={result.analysis.scoreDistribution} />
                </div>
                {result.analysis.platformBreakdown.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 text-sm">Publisher Platforms</h3>
                    <PlatformPieChart data={result.analysis.platformBreakdown} />
                  </div>
                )}
              </div>

              {/* Trending keywords */}
              {result.analysis.trends.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Product Keywords Found</h3>
                  <TrendKeywordsChart data={result.analysis.trends} />
                </div>
              )}

              {/* Top advertisers */}
              {result.analysis.topAdvertisers.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm">Top Advertisers</h3>
                  <div className="space-y-2">
                    {result.analysis.topAdvertisers.slice(0, 8).map((a) => (
                      <div key={a.name} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 truncate flex-1">{a.name}</span>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-gray-400">{a.count} ads</span>
                          <span className={`text-xs font-bold ${a.avgScore >= 70 ? 'text-red-600' : a.avgScore >= 50 ? 'text-orange-500' : 'text-gray-500'}`}>
                            {a.avgScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active vs inactive */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Campaign Status</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                    <span className="text-sm text-gray-700">Active: <strong>{result.analysis.activeVsInactive.active}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
                    <span className="text-sm text-gray-700">Ended: <strong>{result.analysis.activeVsInactive.inactive}</strong></span>
                  </div>
                  <div className="ml-auto text-sm text-gray-500">
                    Avg duration: <strong>{result.analysis.avgDaysRunning} days</strong>
                  </div>
                </div>
              </div>

              {/* Top ads */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Top Ads by Sourcing Score</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.ads.slice(0, 9).map((ad) => (
                    <AdCard key={ad.id} ad={ad} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved tab */}
      {tab === 'saved' && (
        <div className="space-y-4">
          {savedLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}
          {!savedLoading && savedAds.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No saved ads yet</p>
              <p className="text-sm mt-1">Save ads from search results to track them here</p>
            </div>
          )}
          {!savedLoading && savedAds.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Bookmark className="w-4 h-4" />
                {savedAds.length} saved ads
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedAds.map((ad) => (
                  <div key={ad.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{ad.page_name}</p>
                        <p className="text-xs text-gray-400">{ad.country} · Score: {ad.sourcing_score}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ad.label === 'Hot' ? 'bg-red-100 text-red-700' :
                        ad.label === 'Rising' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{ad.label}</span>
                    </div>
                    {ad.body && <p className="text-xs text-gray-600 line-clamp-3">{ad.body}</p>}
                    <div className="flex gap-2">
                      <a href={ad.snapshot_url} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center text-xs py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                        View Ad
                      </a>
                      <button onClick={() => deleteSaved(ad.id)}
                        className="text-xs py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
