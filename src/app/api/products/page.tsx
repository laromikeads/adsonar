'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, TrendingUp, TrendingDown, Minus,
  Users, Zap, RefreshCw, ExternalLink, Flame,
  ArrowUpRight, AlertCircle
} from 'lucide-react';

interface Product {
  id: string;
  fingerprint: string;
  name: string;
  keywords: string[];
  country: string;
  first_seen_at: string;
  last_seen_at: string;
  seller_count: number;
  seller_count_prev: number;
  trend: 'rising' | 'stable' | 'declining';
  avg_score: number;
  top_page_name: string;
  top_snapshot_url: string;
  top_ad_body: string;
  days_active: number;
  is_active: boolean;
}

interface Stats {
  rising: number;
  stable: number;
  declining: number;
}

type TrendFilter = 'all' | 'rising' | 'stable' | 'declining';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TrendFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);

  const load = useCallback(async (trendFilter: TrendFilter = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ country: 'DZ', limit: '50' });
      if (trendFilter !== 'all') params.set('trend', trendFilter);
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(data.products || []);
      setStats(data.stats);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const triggerCrawl = async () => {
    setCrawling(true);
    try {
      const res = await fetch('/api/cron/crawl');
      const data = await res.json();
      await load(filter);
      alert(`Done: ${data.products_updated} products updated, ${data.ads_fetched} ads fetched`);
    } catch {
      alert('Crawl failed');
    } finally {
      setCrawling(false);
    }
  };

  const isEmpty = !loading && products.length === 0 && !error;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Sourcing Agent
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Products detected across multiple sellers in Algeria — updated daily
          </p>
        </div>
        <button
          onClick={triggerCrawl}
          disabled={crawling}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {crawling ? 'Crawling…' : 'Crawl now'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Rising" value={stats.rising} icon={<TrendingUp className="w-4 h-4 text-green-500" />} color="green" onClick={() => setFilter('rising')} active={filter === 'rising'} />
          <StatCard label="Stable" value={stats.stable} icon={<Minus className="w-4 h-4 text-blue-500" />} color="blue" onClick={() => setFilter('stable')} active={filter === 'stable'} />
          <StatCard label="Declining" value={stats.declining} icon={<TrendingDown className="w-4 h-4 text-gray-400" />} color="gray" onClick={() => setFilter('declining')} active={filter === 'declining'} />
        </div>
      )}

      <div className="flex gap-2">
        {(['all', 'rising', 'stable', 'declining'] as TrendFilter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'all' ? 'All products' : f}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading products…</span>
        </div>
      )}

      {isEmpty && (
        <div className="text-center py-20 text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-gray-600">No products tracked yet</p>
          <p className="text-sm mt-1">Hit <strong>Crawl now</strong> to start discovering trending products</p>
          <button onClick={triggerCrawl} disabled={crawling}
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {crawling ? 'Crawling…' : 'Start first crawl'}
          </button>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const sellerDelta = product.seller_count - product.seller_count_prev;
  const isHot = product.avg_score >= 70 && product.trend === 'rising';

  return (
    <div className={`bg-white rounded-xl border p-4 space-y-3 hover:shadow-md transition-shadow ${isHot ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{product.name}</p>
          <p className="text-xs text-gray-400 truncate">{product.top_page_name}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isHot && (
            <span className="flex items-center gap-0.5 text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
              <Flame className="w-3 h-3" /> Hot
            </span>
          )}
          <TrendBadge trend={product.trend} />
        </div>
      </div>

      {product.top_ad_body && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{product.top_ad_body}</p>
      )}

      {product.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {product.keywords.slice(0, 4).map((kw) => (
            <span key={kw} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{kw}</span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
        <Metric icon={<Users className="w-3 h-3" />} label="Sellers"
          value={<span className="flex items-center gap-0.5">{product.seller_count}
            {sellerDelta > 0 && <span className="text-green-600 text-xs">+{sellerDelta}</span>}
            {sellerDelta < 0 && <span className="text-red-500 text-xs">{sellerDelta}</span>}
          </span>} />
        <Metric icon={<Zap className="w-3 h-3" />} label="Score"
          value={<span className={product.avg_score >= 70 ? 'text-red-600 font-bold' : ''}>{product.avg_score}</span>} />
        <Metric icon={<ArrowUpRight className="w-3 h-3" />} label="Days" value={product.days_active} />
      </div>

      <a href={product.top_snapshot_url} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 font-medium transition-colors">
        <ExternalLink className="w-3.5 h-3.5" /> View top ad
      </a>
    </div>
  );
}

function TrendBadge({ trend }: { trend: 'rising' | 'stable' | 'declining' }) {
  const config = {
    rising: { icon: <TrendingUp className="w-3 h-3" />, label: 'Rising', cls: 'bg-green-50 text-green-700' },
    stable: { icon: <Minus className="w-3 h-3" />, label: 'Stable', cls: 'bg-blue-50 text-blue-700' },
    declining: { icon: <TrendingDown className="w-3 h-3" />, label: 'Declining', cls: 'bg-gray-100 text-gray-500' },
  }[trend];
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${config.cls}`}>
      {config.icon} {config.label}
    </span>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-0.5 text-gray-400 mb-0.5">
        {icon}<span className="text-xs">{label}</span>
      </div>
      <div className="text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}

function StatCard({ label, value, icon, color, onClick, active }: {
  label: string; value: number; icon: React.ReactNode;
  color: 'green' | 'blue' | 'gray'; onClick: () => void; active: boolean;
}) {
  const borders = { green: 'border-green-200 bg-green-50', blue: 'border-blue-200 bg-blue-50', gray: 'border-gray-200 bg-gray-50' }[color];
  return (
    <button onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-all ${active ? `${borders} ring-2 ring-offset-1` : 'border-gray-200 bg-white hover:border-gray-300'}`}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </button>
  );
}
