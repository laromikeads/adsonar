'use client';

import { SourcingScore } from '@/types';

interface ScoreBadgeProps {
  score: SourcingScore;
  size?: 'sm' | 'md' | 'lg';
}

const labelColors = {
  Hot: 'bg-red-500 text-white',
  Rising: 'bg-orange-400 text-white',
  Stable: 'bg-blue-500 text-white',
  Declining: 'bg-gray-400 text-white',
};

const labelEmoji = {
  Hot: '🔥',
  Rising: '📈',
  Stable: '📊',
  Declining: '📉',
};

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const scoreColor =
    score.overall >= 75
      ? 'text-red-600'
      : score.overall >= 55
      ? 'text-orange-500'
      : score.overall >= 35
      ? 'text-blue-600'
      : 'text-gray-500';

  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold text-lg ${scoreColor}`}>{score.overall}</span>
      <span
        className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]} ${labelColors[score.label]}`}
      >
        {labelEmoji[score.label]} {score.label}
      </span>
    </div>
  );
}
