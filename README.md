# AdSonar — Meta Ads Product Sourcing Platform

Discover trending products by analyzing Meta Ads in any region. Built with Next.js 14, Supabase, and the Meta Ad Library API.

## Features

- 🔍 **Search Meta Ads** by keyword + region (30+ countries)
- 📊 **Sourcing Score** — AI-scored ads based on trend signals, audience size, ad duration, engagement potential
- 🔥 **Hot / Rising / Stable / Declining** labels per ad
- 📈 **Campaign Analysis Dashboard** — score distribution, platform breakdown, top advertisers, product keyword trends
- 💾 **Save Ads** to Supabase — bookmark products to your watchlist
- ♾️ **Pagination** — load more ads with cursor-based paging

## Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd adsonar
npm install
```

### 2. Get a Meta Access Token

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create an App → Add **Marketing API** product
3. Go to **Tools → Graph API Explorer**
4. Generate a User Access Token with `ads_read` permission
5. For production, use a **System User token** from Business Manager

### 3. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:
   ```sql
   -- Copy & paste contents of supabase/migrations/001_init.sql
   ```
3. Copy your project URL and anon key from **Settings → API**

### 4. Configure environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your tokens
```

### 5. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel

# Set environment variables in Vercel dashboard:
# META_ACCESS_TOKEN
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Sourcing Score Algorithm

Each ad is scored 0–100 based on four signals:

| Signal | Weight | What it measures |
|--------|--------|-----------------|
| **Trend Signal** (35%) | 0–100 | How recently the ad launched + is it still active |
| **Audience Size** (25%) | 0–100 | Estimated reach → larger = more market demand |
| **Ad Duration** (25%) | 0–100 | Sweet spot is 7–45 days running (proven but not saturated) |
| **Engagement Potential** (15%) | 0–100 | Multi-platform, rich creative, regional coverage |

**Labels:**
- 🔥 **Hot** — score ≥ 75
- 📈 **Rising** — score ≥ 55
- 📊 **Stable** — score ≥ 35
- 📉 **Declining** — score < 35 or ad stopped

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ads/       # Meta Ad Library search
│   │   ├── analyze/   # Campaign analysis
│   │   ├── save/      # Saved ads CRUD
│   │   └── trending/  # Trending products
│   ├── dashboard/     # Analytics dashboard
│   └── page.tsx       # Home / search
├── components/
│   ├── ads/           # AdCard
│   ├── charts/        # Recharts visualizations
│   ├── layout/        # Navbar
│   └── ui/            # ScoreBadge
├── lib/
│   ├── analysis/      # Scoring engine
│   ├── meta/          # Meta API client
│   └── supabase/      # Supabase client (browser + server)
└── types/             # TypeScript interfaces
supabase/
└── migrations/        # SQL schema
```

## Meta Ad Library API Notes

- **Public API** — no special approval required beyond a basic App
- **Rate limits** — 200 requests/hour per token
- **Data freshness** — ads updated daily
- **Regions** — use ISO 3166-1 alpha-2 country codes (US, FR, DZ, etc.)
- **Ad types** — `ALL` includes all ads; `POLITICAL_AND_ISSUE_ADS` for political only

## License

MIT
