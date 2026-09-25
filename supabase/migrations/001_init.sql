-- AdSonar: Meta Ads Sourcing Platform
-- Migration 001: Initial schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Saved Ads: ads the user bookmarked for sourcing
CREATE TABLE IF NOT EXISTS saved_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id TEXT NOT NULL UNIQUE,
  page_name TEXT,
  body TEXT,
  snapshot_url TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  sourcing_score INTEGER DEFAULT 0,
  label TEXT CHECK (label IN ('Hot', 'Rising', 'Stable', 'Declining')),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search history: track what users searched for
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  country TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  avg_score INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trending snapshots: daily trending product keywords
CREATE TABLE IF NOT EXISTS trending_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country TEXT NOT NULL,
  keyword TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  avg_score INTEGER NOT NULL DEFAULT 0,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (country, keyword, snapshot_date)
);

-- Watchlist: keywords/products to monitor
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  alert_threshold INTEGER DEFAULT 70,
  is_active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (keyword, country)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_ads_country ON saved_ads(country);
CREATE INDEX IF NOT EXISTS idx_saved_ads_score ON saved_ads(sourcing_score DESC);
CREATE INDEX IF NOT EXISTS idx_saved_ads_label ON saved_ads(label);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
CREATE INDEX IF NOT EXISTS idx_search_history_country ON search_history(country);
CREATE INDEX IF NOT EXISTS idx_trending_country_date ON trending_snapshots(country, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_active ON watchlist(is_active) WHERE is_active = TRUE;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saved_ads_updated_at
  BEFORE UPDATE ON saved_ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (open for now, add auth later)
ALTER TABLE saved_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (single-user app)
CREATE POLICY "Allow all for anon" ON saved_ads FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON search_history FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON trending_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON watchlist FOR ALL TO anon USING (true) WITH CHECK (true);
