'use client';

import { useState, useCallback, useRef } from 'react';
import { Search, Loader2, TrendingUp, Zap, SlidersHorizontal, X } from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import { EnrichedAd, COUNTRIES, SearchResult } from '@/types';

const PLATFORMS = [
  { value: '', label: 'All Platforms' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'messenger', label: 'Messenger' },
  { value: 'audience_network', label: 'Audience Network' },
];

const SORT_OPTIONS = [
  { value: 'meta', label: 'Meta Rank' },
  { value: 'score', label: 'Sourcing Score' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Running Longest' },
];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('DZ');
  const [activeOnly, setActiveOnly] = useState(false);
  const [platform, setPlatform] = useState('');
  const [sortBy, setSortBy] = useState('meta');
  const [showFilters, setShowFilters] = useState(false);

  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const buildParams = useCallback((after?: string) => {
    const p = new URLSearchParams({ query, country, limit: '30' });
    if (activeOnly) p.set('active_only', 'true');
    if (platform) p.set('platform', platform);
    if (after) p.set('after', after);
    return p;
  }, [query, country, activeOnly, platform]);

  const search = useCallback(async (append = false) => {
    if (!query.trim()) return;
    if (append) setLoadingMore(true);
    else { setLoading(true); setResult(null); setCursor(undefined); setError(null); }

    try {
      const params = buildParams(append && cursor ? cursor : undefined);
      const res = await fetch(`/api/ads?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');

      if (append && result) {
        setResult({ ...data, data: [...result.data, ...data.data] });
      } else {
        setResult(data);
      }
      setCursor(data.paging?.cursors?.after);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, country, activeOnly, platform, cursor, result, buildParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(false);
  };

  const sortedAds = useCallback((): EnrichedAd[] => {
    if (!result) return [];
    const ads = [...result.data];
    switch (sortBy) {
      case 'score':  return ads.sort((a, b) => b.sourcingScore.overall - a.sourcingScore.overall);
      case 'newest': return ads.sort((a, b) => a.daysSinceLaunch - b.daysSinceLaunch);
      case 'oldest': return ads.sort((a, b) => b.daysSinceLaunch - a.daysSinceLaunch);
      default:       return ads; // meta rank = API order
    }
  }, [result, sortBy]);

  const quickSearches = ['كريم', 'حذاء', 'مكياج', 'skincare', 'supplement', 'chaussure'];
  const activeFilterCount = [activeOnly, !!platform].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp className="w-7 h-7 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">AdSonar</h1>
        </div>
        <p className="text-gray-500 max-w-lg mx-auto">
          Search Meta ads exactly as they run — then score them for sourcing potential.
        </p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ads… e.g. كريم تبييض, sneakers, supplement"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Country */}
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          {/* Filters toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>

        {/* Filter panel */}
        {showFilters && (
          <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-4 items-center">
            {/* Active only toggle */}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <div
                onClick={() => setActiveOnly(!activeOnly)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${activeOnly ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${activeOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              Active ads only
            </label>

            {/* Platform pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlatform(p.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    platform === p.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Clear */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => { setActiveOnly(false); setPlatform(''); }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 ml-auto"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* Quick searches */}
        {!result && !loading && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-400">Try:</span>
            {quickSearches.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => { setQuery(q); setTimeout(() => search(false), 0); }}
                className="text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-600 rounded-full px-3 py-1 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <strong>Error:</strong> {error}
          {error.includes('META_ACCESS_TOKEN') && (
            <p className="mt-1 text-red-600">Add your Meta Access Token to <code>.env.local</code></p>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border-2 border-gray-100 p-4 h-64 animate-pulse bg-white">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-3 bg-gray-100 rounded w-4/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-gray-900">
                {result.data.length} ads
                <span className="text-gray-500 font-normal text-sm ml-1.5">
                  for &ldquo;{query}&rdquo; in {COUNTRIES.find((c) => c.code === country)?.name}
                </span>
              </p>
              {activeOnly && <p className="text-xs text-blue-600 mt-0.5">Active ads only</p>}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Sort:</span>
              <div className="flex gap-1">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSortBy(s.value)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                      sortBy === s.value
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              
                href={`/dashboard?query=${encodeURIComponent(query)}&country=${country}`}
                className="text-xs text-blue-600 hover:underline font-medium ml-1 whitespace-nowrap"
              >
                Full analysis →
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedAds().map((ad: EnrichedAd) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>

          {cursor && (
            <div className="text-center pt-2">
              <button
                onClick={() => search(true)}
                disabled={loadingMore}
                className="px-6 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                Load more ads
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Search any product to see real Meta ads</p>
          <p className="text-sm mt-1">Same results as Ad Library — with a sourcing score layered on top</p>
        </div>
      )}
    </div>
  );
}
