'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

interface ScoreDistributionProps {
  data: { range: string; count: number }[];
}

export function ScoreDistributionChart({ data }: ScoreDistributionProps) {
  const colors = ['#9ca3af', '#6b7280', '#3b82f6', '#f97316', '#ef4444'];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="range" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index] || '#3b82f6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PlatformProps {
  data: { platform: string; count: number }[];
}

const PLATFORM_COLORS = ['#1877f2', '#e4405f', '#1da1f2', '#0a66c2', '#ff4500'];
const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  audience_network: 'Audience Network',
  messenger: 'Messenger',
};

export function PlatformPieChart({ data }: PlatformProps) {
  const chartData = data.map((d) => ({
    name: PLATFORM_LABELS[d.platform] || d.platform,
    value: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface TrendKeywordsProps {
  data: { keyword: string; count: number; avgScore: number }[];
}

export function TrendKeywordsChart({ data }: TrendKeywordsProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data.slice(0, 10)}
        layout="vertical"
        margin={{ top: 5, right: 40, left: 60, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="keyword" type="category" tick={{ fontSize: 11 }} width={60} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          formatter={(value, name) => [value, name === 'count' ? 'Ads found' : 'Avg score']}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="count" />
      </BarChart>
    </ResponsiveContainer>
  );
}
