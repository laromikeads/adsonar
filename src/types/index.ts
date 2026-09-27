export interface SearchParams {
  query: string;
  country: string;
  adType?: 'ALL' | 'POLITICAL_AND_ISSUE_ADS';
  category?: string;
  after?: string;
  limit?: number;
  ecomOnly?: boolean;
}
