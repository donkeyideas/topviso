# ASO Platform — Custom-Built Technology Reference

> Complete inventory of all custom-engineered systems, algorithms, and components.

---

## Table of Contents

1. [Dual-Platform Scraping Engine](#1-dual-platform-scraping-engine)
2. [Sync Pipeline Orchestrator](#2-sync-pipeline-orchestrator)
3. [AI Analysis Engine (23 Actions)](#3-ai-analysis-engine-23-actions)
4. [Custom Scoring Algorithms](#4-custom-scoring-algorithms)
5. [Keyword Enrichment System](#5-keyword-enrichment-system)
6. [Dashboard Pages (10 Pages)](#6-dashboard-pages-10-pages)
7. [Custom UI Components](#7-custom-ui-components)
8. [Backend API Routes](#8-backend-api-routes)
9. [Database Schema (14 Tables)](#9-database-schema-14-tables)
10. [Type System](#10-type-system)
11. [Admin Panel](#11-admin-panel)
12. [Third-Party Dependencies](#12-third-party-dependencies)

---

## 1. Dual-Platform Scraping Engine

**File:** `apps/web/src/lib/store-scraper.ts`

A unified scraping layer that abstracts data fetching from both Google Play and Apple App Store. No scraping framework is used — all iOS scraping is 100% custom fetch calls to Apple's public APIs + HTML scraping.

### Google Play (Android)

Uses the `google-play-scraper` npm package with typed wrappers:

| Function | What It Does |
|----------|-------------|
| `fetchGooglePlayData(appId)` | Full app metadata: title, description, ratings, installs, developer, genre, icon, screenshots, version, price |
| `fetchGooglePlayReviews(appId, count)` | Up to 100 newest reviews with user name, text, score, thumbsUp, version, reply text/date |
| `checkKeywordRanking(keyword, targetAppId, country)` | Searches top 250 results, finds target app position, identifies #1 competitor |
| `batchCheckKeywordRankings(keywords, targetAppId, country, delayMs)` | Sequential batch with 300ms delay between calls to avoid rate-limiting |
| `fetchSimilarApps(appId)` | Returns similar apps with appId, title, developer, score, icon |
| `searchApps(term, count, country)` | General search for competitor discovery |
| `fetchCategoryTopApps(genreId, count, country)` | Category leaderboard via `gplay.list()` with `TOP_FREE` collection, fallback to genre name search |

### Apple/iOS (Custom — No npm Package)

All iOS scraping is built from scratch using Apple's public APIs:

| Function | API Used | What It Does |
|----------|----------|-------------|
| `fetchAppleAppData(appId)` | iTunes Lookup API (`itunes.apple.com/lookup`) | Full app metadata. If iTunes API returns 0 screenshots, automatically falls back to HTML scraping |
| `scrapeAppleScreenshots(appId)` | App Store HTML (`apps.apple.com`) | Fetches the public App Store page, regex-extracts `mzstatic.com` screenshot URLs from server-rendered HTML, deduplicates by base path, sorts by screenshot number, serves at 460px width. Includes User-Agent spoofing |
| `fetchAppleAppReviews(appId, country)` | Apple RSS Feed (`itunes.apple.com/rss/customerreviews`) | Parses JSON feed for review id, userName, text, score, date, version |
| `checkKeywordRankingIOS(keyword, targetAppId, country)` | iTunes Search API (`itunes.apple.com/search?limit=200`) | Finds app position by `trackId` match, extracts top competitor |
| `batchCheckKeywordRankingsIOS(keywords, targetAppId, country, delayMs)` | iTunes Search API | Sequential batch with 400ms delay |
| `searchAppsIOS(term, count, country)` | iTunes Search API | General search returning appId, title, developer, score, icon |
| `fetchSimilarAppsIOS(appId)` | iTunes Lookup + Search APIs | Looks up app to get primary genre, then searches by genre name (Apple has no native similar-apps endpoint) |
| `fetchAppleCategoryTopApps(genreId, count, country)` | iTunes Search API with `genreId` + `sort=popular` | Category leaderboard approximation |

### Rate Limiting Strategy

- All batch operations use configurable `delayMs` (300-400ms) in sequential `for` loops
- Failed individual checks return `{ position: null }` and execution continues
- No retry logic or circuit breaker — designed for resilience over perfection

### Screenshot Preservation Pattern

All screenshot consumers (creative-lab, conversion, sync pipeline) implement a preservation pattern: if the API returns 0 screenshots, the code checks for previously cached screenshots in `analysis_results` before overwriting. This prevents data loss when Apple's API temporarily doesn't index screenshots.

---

## 2. Sync Pipeline Orchestrator

**File:** `apps/web/src/lib/sync-pipeline.ts`

The `runFullSync()` function is the backbone of the "Sync All" operation. It runs 7 sequential steps that combine real store data with AI enrichment:

### Step 1: Fetch Real Store Data
- Platform-aware: calls `fetchGooglePlayData()` or `fetchAppleAppData()` based on `app.platform`
- Returns full `StoreAppData` object

### Step 2: Persist Metadata
- Updates the `apps` table with fresh name, icon, developer, category, version
- Inserts a new `app_metadata_snapshots` row (immutable historical record)
- Upserts `app_installs_estimate` with install range from store data

### Step 3: Scrape Reviews
- Platform-aware: `fetchGooglePlayReviews()` or `fetchAppleAppReviews()`
- Upserts up to 100 reviews to the `reviews` table in batches of 50
- Deduplicates by `store_review_id`

### Step 4: AI Keyword Suggestions + Real Rank Checks
- Sends app context to DeepSeek asking for 15 keyword suggestions
- For each keyword: inserts into `keywords` table, then checks real ranking via store APIs
- Records rank results to `keyword_ranks_daily` for historical tracking

### Step 5: Competitor Discovery
- Algorithm: searches each tracked keyword, counts how frequently each app appears across all keyword results
- Also fetches similar apps from the store
- Merges frequency-counted search results with similar apps
- Platform-aware: uses `searchAppsIOS`/`fetchSimilarAppsIOS` for iOS

### Step 6: Compute Scores
- **Visibility Score**: Volume-weighted position scoring (see Scoring Algorithms section)
- **ASO Score**: Metadata quality assessment

### Step 7: Write Analysis Results
Writes structured results to `analysis_results` for 7 types:
- `keywords` — full keyword data with ranks, volumes, difficulties, intents, deltas
- `competitors` — competitor list with threat levels and overlap data
- `visibility` — score, distribution histogram, per-keyword contributions
- `reviews-analysis` — basic review stats (count, average rating)
- `overview` — summary KPIs
- `store-intel` — leaderboard data
- `conversion` — deterministic conversion scoring (no AI call during sync)

### Conversion Scoring (Deterministic, No AI)
Computed during sync without an AI call:
- **Icon Score**: Has icon (+30), not default (+20), good rating bonus (+20)
- **Title Score**: Length optimization (20-30 chars ideal: +30), keyword presence (+15 per match), structured format bonus (+20)
- **Subtitle Score**: Exists (+30), optimal length (+25), keyword presence (+12 per match), hook quality (+20)
- **Rating Score**: Rating value (4.5+ = 40pts, 4.0+ = 25pts, etc.) + ratings count (10K+ = 40pts, 1K+ = 30pts, etc.) + recency bonus (+20)
- **Screenshot Score**: Count (8+ = 30pts, 5+ = 20pts) + first-3 exist (+30) + per-screenshot bonus (5pts each, max 40)
- **Weighted Average**: Icon 15% + Title 25% + Subtitle 20% + Rating 25% + Screenshots 15%

---

## 3. AI Analysis Engine (23 Actions)

**File:** `apps/web/src/app/api/generate/route.ts`

A massive dispatcher that accepts an `action` string and `appId`, then orchestrates real data collection + AI enrichment. Uses DeepSeek (`deepseek-chat` model) via the OpenAI SDK.

### Architecture Pattern

```
Real Store Data → Deterministic Scoring → AI Qualitative Analysis → Structured JSON → Upsert to DB
```

Every action follows this flow:
1. Fetch the app, keywords, and latest snapshot from Supabase
2. Build a structured `appContext` string with real data
3. Route to the appropriate handler (scraping + heuristics + AI)
4. Parse AI response (JSON with markdown fence stripping)
5. Upsert structured result to `analysis_results`

### All 23 Actions

| Action | Type | Description |
|--------|------|-------------|
| `sync` | Pipeline | Runs the full sync pipeline (7 steps above) |
| `overview` | AI + Data | KPI summary with health score, top opportunities, risk alerts |
| `keywords` | AI + Data | AI suggests keywords, real rank checks, volume/difficulty estimation |
| `optimize-title` | AI | 5 title variants optimized for the selected goal (balanced/visibility/conversion/etc.) |
| `optimize-subtitle` | AI | 5 subtitle variants with keyword integration |
| `optimize-description` | AI | 5 description variants with keyword density optimization |
| `optimize-keywords-field` | AI | 5 keyword field variants (iOS 100-char field optimization) |
| `strategy` | AI | Long-term ASO strategy with phases, KPIs, and timeline |
| `recommendations` | AI | Prioritized action items with effort/impact scoring |
| `localization` | AI | Translations for title/subtitle/description/keywords across target locales |
| `intent-map` | AI | Keywords clustered by user intent with coverage percentages |
| `llm-track` | AI | Simulates how ChatGPT/Claude/Gemini/Perplexity/Copilot respond to category queries |
| `competitors` | Data + AI | Real competitor discovery + AI strengths/weaknesses/keyword gaps |
| `reviews-analysis` | Data + AI | Real reviews fed to AI for theme extraction, sentiment, reply templates |
| `store-intel` | Data + AI | Real category leaderboard + AI trend analysis and featuring tips |
| `visibility` | Data | Pure computation — visibility score, distribution, trends |
| `update-impact` | AI | Version history analysis, rating deltas, next update plan |
| `discovery-map` | AI | Discovery flow visualization data (surfaces, connections, queries) |
| `creative-lab` | Data + AI | Real screenshots/icons + AI visual asset recommendations |
| `ad-intel` | AI | Ad creative recommendations, audience targeting, budget allocation |
| `market-intel` | Data + AI | Market size estimation, growth trends, whitespace opportunities |
| `growth-insights` | AI | Growth metrics, install trends, user acquisition analysis |
| `reviews-plus` | AI | Advanced review analysis with response strategies |
| `keyword-audiences` | AI | Audience segment clustering from keyword data |
| `agent-ready` | AI | Structured data export for external AI agent consumption |
| `conversion` | Data + AI | Search card audit with deterministic scoring + AI recommendations |

### AI Integration Details

- **Model**: `deepseek-chat` via DeepSeek API (OpenAI-compatible endpoint)
- **Temperature**: 0.7 for all prompts
- **Max Tokens**: 500-3000 depending on action
- **Response Format**: JSON-only system prompts, parsed with markdown fence stripping
- **Client**: Singleton factory in `deepseek.ts` using the `openai` npm package pointed at `https://api.deepseek.com`

---

## 4. Custom Scoring Algorithms

**File:** `apps/web/src/lib/aso-scoring.ts`

Three distinct scoring algorithms, all custom-designed:

### Visibility Score (`calculateVisibilityScore`)

Volume-weighted position scoring with exponential decay:

```
Position Weights:
  #1 = 1.00    #6 = 0.25
  #2 = 0.70    #7 = 0.20
  #3 = 0.50    #8 = 0.16
  #4 = 0.38    #9 = 0.13
  #5 = 0.30    #10 = 0.12
  Beyond #10: exponential decay toward 0
```

- Each keyword contributes: `positionWeight × volumeWeight`
- Volume weight is normalized against the maximum volume in the set
- Falls back to equal weights if no volume data exists
- Final score: `(weightedSum / maxPossible) × 100`

### ASO Score (`calculateASOScore`)

Metadata quality assessment with weighted categories:

| Category | Weight | What's Scored |
|----------|--------|--------------|
| Title | 25% | Length (20-30 chars optimal), keyword presence, clear value proposition |
| Subtitle | 15% | Length, keyword presence, compelling hook |
| Description | 20% | Length (>500 chars), keyword density, structure (bullets/headers) |
| Keywords Field | 10% | Utilization of 100-char limit (iOS), no spaces, no duplicates |
| Ratings | 15% | Star rating value + total count + recency |
| Creatives | 15% | Screenshot count (8+ ideal), icon quality proxy |

### Visibility Trend (`computeVisibilityTrend`)

- Walks back 13 weeks from today
- For each weekly date: fetches historical `keyword_ranks_daily` data for all tracked keywords
- Computes visibility score at each point using the same algorithm
- Returns array of `{ date, score }` objects

### SVG Path Generator (`scoresToSvgPath`)

Converts score arrays into SVG `M/L` path strings for inline trend charts. No charting library — pure string generation.

---

## 5. Keyword Enrichment System

**File:** `apps/web/src/lib/keyword-enrichment.ts`

A fully custom heuristic-based keyword metrics estimation system. No third-party keyword API is used.

### Intent Classification

Regex pattern matching classifies keywords into 4 intents:
- **Navigational**: Contains brand names or specific app names
- **Transactional**: Contains action words (download, install, buy, get)
- **Commercial**: Contains comparison words (best, top, vs, review, alternative)
- **Informational**: Contains question words (how, what, why) or general terms

### Volume Estimation

```
Base volume = f(word_count):
  1 word  → 8000-15000
  2 words → 3000-8000
  3 words → 1000-3000
  4+ words → 200-1000

Multipliers applied:
  × intent_multiplier (navigational: 1.5, transactional: 1.3, commercial: 1.1, informational: 0.8)
  × niche_boost (sports: 1.4, fitness: 1.3, gaming: 1.5, etc.)
  × seeded_hash_jitter (±20% deterministic variation per keyword)
```

### Difficulty & CPC Estimation

- **Difficulty**: Based on estimated volume (higher volume = higher difficulty) + intent modifier
- **CPC**: Based on commercial intent (transactional > commercial > informational > navigational) + volume factor

### Consistency

All estimates use a **seeded hash function** so the same keyword always produces the same metrics across calls. Outputs are flagged `isEstimate: { volume: true, cpc: true, difficulty: true }`.

---

## 6. Dashboard Pages (10 Pages)

**Location:** `apps/web/src/app/(app)/focused/app/[slug]/`

All pages are `'use client'` React components sharing a common data pattern:
```typescript
const { data } = useAnalysis<TypeName>(slug, 'analysis-type')
const { generate, generating } = useGenerate(slug, 'action', { onSuccess: refetch })
```

### Overview (`overview/page.tsx`)
- **Mission control**: Fetches 8 analysis types simultaneously
- **Sync All**: 2-phase parallel execution — Phase 1: `sync`, `competitors`, `growth-insights`, `update-impact` → Phase 2: `market-intel`, `creative-lab`, `conversion`
- **KPI Cards**: Visibility score, ASO score, keyword count, average rank
- **Sortable recommendations table** with priority/effort pills
- **Competitor summary strip**
- **LLM share-of-voice bar**

### Keywords (`keywords/page.tsx`)
4-tab hub:
- **Rankings**: Sortable table with rank, volume, difficulty, CPC, KEI, 7-day delta, intent badge
- **Visibility**: Score ring + distribution histogram (top 3 / 4-10 / 11-50 / 50+ / unranked) + per-keyword contribution bars
- **Intent Map**: Keywords clustered by intent type with coverage percentages
- **Audiences**: Audience segment clusters with affinity bars

### Optimizer (`optimizer/page.tsx`)
- **Goal-driven**: 5 presets — balanced, visibility, keyword-opportunities, conversion, competitive-edge
- **Side-by-side comparison**: Current snapshot metadata vs 5 AI-generated variants for title, subtitle, description, keywords field
- **Variant cards** with keyword highlighting and character counts

### Competitors (`competitors/page.tsx`)
- **Competitor table**: Threat level (pill), ratings, installs, keyword overlap percentage, shared keywords list, keyword gaps
- **Market intelligence**: Category leaderboard, market trends, whitespace opportunities
- **Data fusion**: Real scraped competitor data + AI qualitative analysis

### LLM Discovery (`llm-discovery/page.tsx`)
- **LLM Tracker**: Simulated responses from ChatGPT, Claude, Gemini, Perplexity, Copilot
- **Share-of-voice KPI**: Percentage of AI surfaces that mention the app
- **Prompt matrix heatmap**: Which prompts trigger mentions on which surfaces
- **Discovery Flow Map**: Custom SVG visualization (see UI Components)

### Reviews (`reviews/page.tsx`)
- **Praise themes**: Clustered positive feedback with frequency counts
- **Complaint themes**: Sortable by frequency, with severity indicators
- **Reply templates**: AI-generated response templates for common complaints
- **Active-topic filter**: Chip filter to drill into specific themes

### Growth (`growth/page.tsx`)
- **Custom SVG trend charts**: Install estimates and rating trends over time (polyline charts)
- **Keyword visibility table**: Estimated traffic per keyword based on rank × volume
- **Update impact analysis**: Version history, rating deltas per version, next update plan

### Creative Lab (`creative-lab/page.tsx`)
- **Screenshot grid**: With graceful error fallback (onError → placeholder)
- **Score bars**: Per-dimension scoring (design, messaging, first impression, etc.)
- **Competitor creative comparison**: Side-by-side icons + screenshot counts
- **AI recommendations**: Specific screenshot and icon improvement suggestions

### Conversion (`conversion/page.tsx`)
- **Search card audit**: Visual preview of how the app appears in search results
- **Score bars**: Icon, Title, Subtitle, Rating, Screenshots — individual scores
- **Conversion score ring**: Weighted overall score
- **Competitor comparison**: Side-by-side cards (your app vs top 3 competitors) with rating, ratings count, screenshot count
- **Issues & fixes**: AI-identified problems with impact pills (high/medium/low)
- **Conversion playbook**: Prioritized recommendations with effort and expected lift

### Localization (`localization/page.tsx`)
- **Localization table**: Per-locale translations of title, subtitle, description, keywords
- **Market opportunities**: Scored by category fit and competition level
- **Market performance**: Estimated downloads per locale

---

## 7. Custom UI Components

**Location:** `apps/web/src/components/`

### DiscoveryFlowMap (`DiscoveryFlowMap.tsx`)
Entirely custom SVG renderer. No visualization library used.
- Takes an array of `Surface` objects (LLM engines + app stores)
- Computes layout geometry algorithmically (node positions, connection paths)
- Renders SVG diagram showing how user queries flow through LLM engines into app stores
- Draws curved Bezier connector lines between nodes using computed control points
- Animated path drawing on mount

### ScoreRing (`charts/ScoreRing.tsx`)
Custom SVG ring gauge for 0-100 scores.
- Calculates `strokeDasharray` and `strokeDashoffset` for the arc
- Color-coded by score range (red → yellow → green)
- No charting library dependency

### Sparkline / AreaChart / BarFill (`charts/`)
Custom SVG micro-charts:
- **Sparkline**: SVG polyline from data points, auto-scaled to container
- **AreaChart**: Filled area chart with gradient
- **BarFill**: Horizontal fill bar with percentage

### GenerateModal (`GenerateModal.tsx`)
Animated loading overlay for all 23 action types:
- Maps each action to a human-readable label and 3-8 step descriptions
- Animates through steps while generation is in progress (2.5s per step)
- Shows progress percentage and current step name
- Backdrop blur with centered card

### SidebarV2 (`dashboard/SidebarV2.tsx`)
Full navigation sidebar:
- Dynamically reads app slug from URL
- Fetches sibling apps from the org for app-switcher dropdown
- 10 nav items: Overview, Optimizer, Keywords, Competitors, LLM Discovery, Reviews, Growth, Creative Lab, Conversion, Localization
- Includes ThemeToggle for dark/light mode
- Collapse/expand state

### SortableTable / SortHeader (`dashboard/SortableTable.tsx`)
Generic sortable table system:
- Custom `useTableSort` hook managing sort column + direction state
- `SortHeader` component with ascending/descending indicators
- Type-safe column definitions

### Other Dashboard Components
- **TopStrip**: Breadcrumb bar with `/`-separated trail
- **PageHero**: Page header with app icon, name, and generate button area
- **GenerateWithASO**: Generate button with loading spinner state
- **EmptyState**: Placeholder shown before first data sync
- **IntegrationGate**: Gates content behind "connect your app store" prompt

---

## 8. Backend API Routes

**Location:** `apps/web/src/app/api/`

| Route | Method | Custom? | Description |
|-------|--------|---------|-------------|
| `/api/generate` | POST | Fully custom | The core dispatcher — 23 analysis actions with real data + AI |
| `/api/analysis` | GET | Fully custom | Flexible query for `analysis_results` by appId, type, or types |
| `/api/app-data` | GET | Fully custom | Multi-mode data hydration with `?include=` param for joins (analysis, snapshot, keywords, reviews, siblings) |
| `/api/apps` | GET/POST | Custom | List all apps or create new app with platform validation |
| `/api/apps/[id]` | GET/PATCH/DELETE | Custom | Single app CRUD |
| `/api/apps/[id]/enrich` | POST | Custom | Trigger fresh metadata scrape from store |
| `/api/llm-mentions` | GET | Custom | Aggregates LLM mention polls, computes share-of-voice percentages |
| `/api/billing/checkout` | POST | Custom | Creates/reuses Stripe customer, opens Checkout session |
| `/api/billing/portal` | POST | Custom | Opens Stripe Billing Portal |
| `/api/billing/webhook` | POST | Custom | Handles `checkout.session.completed`, `subscription.updated`, `subscription.deleted` |
| `/api/admin/overview` | GET | Custom | Superuser-only platform stats (users, orgs, apps, keywords, reviews) |
| `/api/auth/callback` | GET | Wrapper | Supabase OAuth code exchange |
| `/api/auth/signout` | POST | Wrapper | Supabase session signout |

### Admin Middleware (`lib/admin/middleware.ts`)
- `requireSuperuser()`: JWT verification + `profiles.is_superuser` check
- `auditLog()`: Writes to `admin_audit_log` table
- Typed response helpers: `adminResponse()` / `adminError()`

---

## 9. Database Schema (14 Tables)

All tables use organization-scoped Row Level Security (RLS) via a custom `get_user_org_ids()` PostgreSQL function.

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User metadata | `id`, `email`, `full_name`, `is_superuser`, `default_organization_id` |
| `organizations` | Multi-tenant container | `plan_tier` (solo/team/enterprise), `stripe_customer_id`, `stripe_subscription_id`, `seat_limit`, `app_limit` |
| `organization_members` | User-org junction | `role` (owner/admin/member/viewer) |
| `invitations` | Email invite tokens | `email`, `organization_id`, `role`, `token`, `expires_at` |
| `apps` | Tracked applications | `platform` (ios/android), `store_id`, `name`, `icon_url`, `optimization_goal` |
| `keywords` | Tracked keywords | `app_id`, `keyword`, `country`, `is_tracked` |
| `keyword_ranks_daily` | Rank time series | `keyword_id`, `date`, `rank`, `impressions`, `volume`, `difficulty`, `kei` |
| `competitors` | App-to-competitor links | `app_id`, `competitor_store_id`, `competitor_name` |
| `reviews` | Scraped user reviews | `app_id`, `store_review_id`, `text`, `score`, `date`, `sentiment`, `cluster` |
| `api_keys` | Hashed API keys | `organization_id`, `key_hash`, `label` |
| `app_metadata_snapshots` | Immutable listing snapshots | `app_id`, `title`, `subtitle`, `description`, `version`, `snapshot_at`, `metadata` (JSONB with screenshots, ratings, etc.) |
| `app_rankings_daily` | Category rank time series | `app_id`, `date`, `rank_overall`, `rank_category` |
| `app_installs_estimate` | Install estimates | `app_id`, `date`, `downloads_low`, `downloads_high` |
| `analysis_results` | Central key-value store | `app_id`, `analysis_type`, `result` (JSONB), `updated_at` — one row per (app_id, analysis_type) |

### Key Design Decisions
- `analysis_results` is the central storage — every AI/data analysis is a JSON blob keyed by `(app_id, analysis_type)`
- `app_metadata_snapshots` is append-only (immutable history)
- `keyword_ranks_daily` enables historical trend computation
- RLS uses `get_user_org_ids()` to avoid recursive policy issues

---

## 10. Type System

**File:** `apps/web/src/lib/analysis-types.ts`

23 TypeScript interfaces defining the exact JSON shape for each analysis action. These are the contracts between the API and the UI.

Key types include:
- `OverviewData` — health score, opportunities, risk alerts
- `KeywordData` — keyword list with ranks, volumes, difficulties, intents, deltas
- `CompetitorData` — threat levels, keyword overlap, shared/gap keywords
- `VisibilityData` — score, distribution, per-keyword contributions, trend
- `ConversionData` — search card audit scores, competitor comparison, recommendations
- `CreativeLabData` — screenshot analysis, design scores, competitor creatives
- `LLMTrackData` — AI surface mentions, positions, share-of-voice
- `LocalizationData` — per-locale translations and market opportunities

Also includes `asArray<T>()` helper to safely normalize LLM responses that sometimes return raw arrays instead of objects.

**File:** `apps/web/src/lib/database.types.ts`

Hand-maintained Supabase types for all 14 tables (Row, Insert, Update types for each).

---

## 11. Admin Panel

**Location:** `apps/web/src/app/(app)/admin/` and `apps/web/src/components/admin/`

Superuser-only dashboard with 20+ sections:

### Components
- `AdminShell` / `AdminSidebar` / `AdminTopBar` — Chrome and navigation
- `CommandPalette` — Wraps `cmdk` library for keyboard-driven navigation
- `KpiCard` / `ExecSummaryCard` / `AdminCard` — Stat display cards
- `MrrBridgeChart` / `MrrWaterfallChart` / `SparklineChart` — Revenue charts (uses Recharts)

### Sections
Revenue, Unit Economics, Cohort Retention, Funnel Analytics, and more — each rendering platform-wide analytics from Supabase queries.

---

## 12. Third-Party Dependencies

What is NOT custom-built:

| Package | Role |
|---------|------|
| `next` 15 | Web framework |
| `@supabase/supabase-js` + `@supabase/ssr` | Database + auth |
| `openai` | SDK for DeepSeek API (pointed at `https://api.deepseek.com`) |
| `google-play-scraper` | Google Play data scraping (Android only) |
| `stripe` | Billing and subscription management |
| `tailwindcss` | CSS utility framework |
| `recharts` | Admin charts only (dashboard uses custom SVG) |
| `cmdk` | Admin command palette |
| `zustand` | State management (GenerateContext) |
| `react-hook-form` + `zod` | Form validation |
| `lucide-react` | Icon library |
| `date-fns` | Date formatting |

**Everything else** — the scraping infrastructure, scoring algorithms, keyword enrichment, sync pipeline, AI orchestration, all 10 dashboard pages, and all custom SVG components — is custom-built.

---

*Generated April 2026*
