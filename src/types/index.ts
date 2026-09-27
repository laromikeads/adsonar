export interface MetaAd {
  id: string;
  page_id: string;
  page_name: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_descriptions?: string[];
  ad_creative_link_titles?: string[];
  ad_delivery_start_time: string;
  ad_delivery_stop_time?: string;
  ad_snapshot_url: string;
  currency?: string;
  demographic_distribution?: DemographicEntry[];
  delivery_by_region?: RegionEntry[];
  estimated_audience_size?: AudienceSize;
  impressions?: RangeValue;
  spend?: RangeValue;
  languages?: string[];
  publisher_platforms?: string[];
}

export interface DemographicEntry {
  percentage: string;
  age: string;
  gender: string;
}

export interface RegionEntry {
  region: string;
  percentage: string;
}

export interface AudienceSize {
  lower_bound: number;
  upper_bound: number;
}

export interface RangeValue {
  lower_bound: string;
  upper_bound: string;
}

export interface SourcingScore {
  overall: number;
  trendSignal: number;
  audienceSize: number;
  adDuration: number;
  engagementPotential: number;
  label: 'Hot' | 'Rising' | 'Stable' | 'Declining';
}

export interface EnrichedAd extends MetaAd {
  sourcingScore: SourcingScore;
  productKeywords: string[];
  estimatedMonthlyImpressions: number;
  isActive: boolean;
  daysSinceLaunch: number;
}

export interface SearchParams {
  query: string;
  country: string;
  adType?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS';
  after?: string;
  limit?: number;
  activeOnly?: boolean;
  platform?: string;
  ecomOnly?: boolean;
}

export interface SearchResult {
  data: EnrichedAd[];
  paging?: {
    cursors?: { after?: string; before?: string };
    next?: string;
  };
  total?: number;
}

export interface SavedAd {
  id: string;
  ad_id: string;
  page_name: string;
  body: string;
  snapshot_url: string;
  country: string;
  sourcing_score: number;
  label: string;
  saved_at: string;
  notes?: string;
  tags?: string[];
}

export interface TrendingProduct {
  keyword: string;
  count: number;
  avgScore: number;
  topAd?: EnrichedAd;
  trend: 'up' | 'down' | 'stable';
}

export const COUNTRIES: { code: string; name: string }[] = [
  { code: 'DZ', name: 'Algeria' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'IN', name: 'India' },
  { code: 'NG', name: 'Nigeria' },
];

export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Fashion & Apparel',
  'Beauty & Skincare',
  'Home & Garden',
  'Health & Wellness',
  'Sports & Fitness',
  'Food & Beverage',
  'Toys & Kids',
  'Pets',
  'Jewelry & Accessories',
  'Automotive',
  'Books & Education',
];
