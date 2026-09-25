'use client';

import { EnrichedAd } from '@/types';
import ScoreBadge from '@/components/ui/ScoreBadge';
import { Bookmark, ExternalLink, Clock, Users, Globe } from 'lucide-react';
import { useState } from 'react';

interface AdCardProps {
  ad: EnrichedAd;
  onSave?: (ad: EnrichedAd) => void;
  isSaved?: boolean;
}

export default function AdCard({ ad, onSave, isSaved = false }: AdCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);

  const body = ad.ad_creative_bodies?.[0] || '';
  const title = ad.ad_creative_link_titles?.[0] || ad.page_name;
  const description = ad.ad_creative_link_descriptions?.[0] || '';

  const handleSave = async () => {
    if (saving || saved) return;
    setSaving(true);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: ad.id,
          page_name: ad.page_name,
          body: body,
          snapshot_url: ad.ad_snapshot_url,
          sourcing_score: ad.sourcingScore.overall,
          label: ad.sourcingScore.label,
        }),
      });
      if (res.ok) {
        setSaved(true);
        onSave?.(ad);
      }
    } finally {
      setSaving(false);
    }
  };

  const scoreColor = ad.sourcingScore.overall >= 75
    ? 'border-red-200 bg-red-50/30'
    : ad.sourcingScore.overall >= 55
    ? 'border-orange-200 bg-orange-50/30'
    : 'border-gray-200 bg-white';

  return (
    <div className={`rounded-xl border-2 p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3 ${scoreColor}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{ad.page_name}</p>
          {title && title !== ad.page_name && (
            <p className="text-sm text-gray-600 truncate">{title}</p>
          )}
        </div>
        <ScoreBadge score={ad.sourcingScore} size="sm" />
      </div>

      {/* Ad body */}
      {body && (
        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{body}</p>
      )}
      {description && !body && (
        <p className="text-sm text-gray-600 italic line-clamp-2">{description}</p>
      )}

      {/* Keywords */}
      {ad.productKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ad.productKeywords.slice(0, 5).map((kw) => (
            <span
              key={kw}
              className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {ad.daysSinceLaunch}d ago
        </span>
        {ad.isActive ? (
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Active
          </span>
        ) : (
          <span className="text-gray-400">Ended</span>
        )}
        {ad.estimated_audience_size && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {formatAudience(
              (ad.estimated_audience_size.lower_bound + ad.estimated_audience_size.upper_bound) / 2
            )}
          </span>
        )}
        {(ad.publisher_platforms || []).length > 0 && (
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {(ad.publisher_platforms || []).join(', ')}
          </span>
        )}
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-4 gap-1 pt-1 border-t border-gray-100">
        {[
          { label: 'Trend', value: ad.sourcingScore.trendSignal },
          { label: 'Audience', value: ad.sourcingScore.audienceSize },
          { label: 'Duration', value: ad.sourcingScore.adDuration },
          { label: 'Engage', value: ad.sourcingScore.engagementPotential },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-xs text-gray-400">{label}</div>
            <div className={`text-xs font-bold ${getScoreTextColor(value)}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 px-3 rounded-lg transition-colors ${
            saved
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-green-600' : ''}`} />
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </button>
        <a
          href={ad.ad_snapshot_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-sm py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View
        </a>
      </div>
    </div>
  );
}

function formatAudience(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
}

function getScoreTextColor(score: number): string {
  if (score >= 75) return 'text-red-600';
  if (score >= 55) return 'text-orange-500';
  if (score >= 35) return 'text-blue-600';
  return 'text-gray-400';
}
