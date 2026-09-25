'use client';

import { useState, useCallback } from 'react';
import { Search, Filter, Loader2, TrendingUp, Zap } from 'lucide-react';
import AdCard from '@/components/ads/AdCard';
import { EnrichedAd, COUNTRIES, SearchResult } from '@/types';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('US');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);

  const search = useCallback(
    async (append = false) => {
      if (!query.trim()) return;
      if (append) setLoadingMore(true);
      else { setLoading(true); setResult(null); setCursor(undefined); }
      setError(null);

      try {
        const params = new URLSearchParams({ query, country });
        if (append && cursor) params.set('after', cursor);

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
        const msg = e instanceof Error ? e.message : 'Unknown error';
        setError(msg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, country, cursor, result]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(false);
  };

  const quickSearches = ['skincare', 'wireless earbuds', 'fitness tracker', 'home decor', 'protein powder'];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">AdSonar</h1>
        </div>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Discover trending products by analyzing Meta Ads in any region. Find your next winning product.
        </p>
      </div>

      {/* Search form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ads… e.g. skincare, sneakers, supplements"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Analyze
          </button>
        </form>

        {/* Quick searches */}
        {!result && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-400">Try:</span>
            {quickSearches.map((q) => (
              <button
                key={q}
                onClick={() => { setQuery(q); }}
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
            <p className="mt-1 text-red-600">Add your Meta Access Token to <code>.env.local</code> — see README for instructions.</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {result.data.length} ads found
                <span className="text-gray-500 font-normal text-sm ml-2">for "{query}" in {COUNTRIES.find(c => c.code === country)?.name}</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Sorted by sourcing score — highest potential first</p>
            </div>
            <a
              href={`/dashboard?query=${encodeURIComponent(query)}&country=${country}`}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              View analysis →
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.data.map((ad: EnrichedAd) => (
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
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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
          <p className="text-lg font-medium">Search any product to discover winning ads</p>
          <p className="text-sm mt-1">We'll score each ad's sourcing potential based on trend signals, audience size, and more</p>
        </div>
      )}
    </div>
  );
}
