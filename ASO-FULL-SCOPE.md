# ASO -- Full Project Scope & Implementation Plan

> **Code name: ASO.** Domain and final name TBD. Global rename when locked.
> This document supersedes `SCOPE.md` and incorporates findings from a full review of all four HTML mocks, the existing spec, and gap analysis.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Review Findings -- What Needs Fixing](#2-review-findings)
3. [Hard Rules (Unchanged)](#3-hard-rules)
4. [Repo Structure](#4-repo-structure)
5. [Product Architecture](#5-product-architecture)
6. [Tech Stack](#6-tech-stack)
7. [Database Schema (Revised)](#7-database-schema)
8. [Data Acquisition Pipeline](#8-data-acquisition-pipeline)
9. [API Surface](#9-api-surface)
10. [Auth & Onboarding](#10-auth--onboarding)
11. [Billing -- Stripe](#11-billing--stripe)
12. [Web App -- Page Inventory](#12-web-app--page-inventory)
13. [Admin Dashboard -- Page Inventory](#13-admin-dashboard--page-inventory)
14. [Mobile App -- Screen Inventory](#14-mobile-app--screen-inventory)
15. [Design System](#15-design-system)
16. [Testing](#16-testing)
17. [Observability](#17-observability)
18. [CI/CD](#18-cicd)
19. [Build Order -- Weeks 1-16](#19-build-order)
20. [What NOT to Build in v1](#20-what-not-to-build-in-v1)
21. [Suggested Additions -- What's Missing](#21-suggested-additions)
22. [Risk Register](#22-risk-register)
23. [Appendices](#23-appendices)

---

## 1. Executive Summary

ASO is a SaaS platform that tracks app visibility across **7 surfaces**: App Store, Google Play, ChatGPT, Claude, Gemini, Perplexity, and Copilot. The wedge feature is the **LLM Tracker** -- no competitor tracks AI-engine recommendations at this depth.

**Deliverables:**
- Marketing website (Next.js 15, ported from `surface-home-bold.html`)
- Customer web app (Next.js 15, ported from `surface-full.html` -- 23+ pages)
- Admin dashboard (Next.js 15, ported from `surface-admin.html` -- 14 pages)
- iOS companion app (Expo SDK 55, ported from `surface-ios.html` -- 7 screens)
- Worker services (Node.js on Railway -- scrapers, LLM pollers, MMM jobs)
- Supabase backend (Postgres + Auth + Edge Functions + Realtime)

---

## 2. Review Findings

### 2.1 SCOPE.md Issues

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | All references say "Surface" -- project renamed to "ASO" | Medium | Global rename in scope, env vars, package names |
| 2 | Discovery Map page exists in dashboard mock but not in scope | High | Add as 12th core tab |
| 3 | Market Intel page exists in dashboard mock but not in scope | High | Add as 9th additive module |
| 4 | Admin dashboard says "10 pages" but mock nav has 14 items | Medium | Define all 14 admin pages |
| 5 | Mobile tab bar labels (Search, Data, Me) don't match scope (LLM, Keywords) | Medium | Align to mock's 5-tab structure |
| 6 | iOS mock footer says "SwiftUI native" but scope says Expo/React Native | Low | Mock is aspirational -- Expo is correct for v1 |
| 7 | Missing `changelog_entries` table (referenced in page inventory) | High | Add to schema |
| 8 | Missing `feature_flags` table (admin API references it) | High | Add to schema |
| 9 | Missing `worker_runs` table (referenced in error policy section) | High | Add to schema |
| 10 | Missing `audit_log` table (admin nav shows "Audit log") | High | Add to schema |
| 11 | Missing `notification_preferences` table for push settings | Medium | Add to schema |
| 12 | No scheduled reports/email digests capability | Medium | Add as feature |
| 13 | No command palette / global search defined | Medium | Add to web app |
| 14 | No annotation system for charts | Low | Phase 2 |
| 15 | Pricing still says "Surface Solo/Team/Enterprise" | Low | Rename when brand is locked |

### 2.2 Homepage Mock (`surface-home-bold.html`) Review

**Status: Well-designed, production-ready layout.**

What exists:
- Announcement bar with live feature callout
- Sticky nav with backdrop blur (Product, Customers, Pricing, Changelog, Docs, Sign in, Start free trial)
- Hero with headline, two CTAs (trial + demo), social proof (2,147 teams, $184K MRR, 128% NRR, +84% CVR lift)
- Logo marquee (10 brands: Moburst, Phiture, yellowHEAD, AppAgent, Kite Health, Lumen, Gummicube, Fetch Rewards, Calm, Strava)
- Problem section (40% stat about LLM-driven discovery)
- 6 feature cards (LLM Tracker, Keywords + Intent, Creative Lab, Attribution, Reviews+, Agent Ready)
- 6 testimonials
- VS comparison (Legacy ASO vs ASO -- 8 bullets each)
- 3 pricing tiers (Solo $49/mo, Team $290/mo, Enterprise custom)
- Final CTA with trust badges (SOC 2, GDPR, CCPA)
- Footer with 4 link columns

**Issues to fix:**
- All "Surface" references need "ASO" rename
- Social proof numbers are static -- should eventually pull from live metrics or be easily updatable via admin
- Testimonial avatars are placeholder initials -- need real photos or keep initials with consent
- Logo marquee brands need permission/contracts before go-live

### 2.3 User Dashboard (`surface-full.html`) Review

**Status: Comprehensive, 23+ pages fully designed.**

Pages confirmed in the mock:
1. Overview (KPIs, install trend chart, priorities, surfaces breakdown)
2. Discovery Map (SVG flow: 5 AI assistants -> Intent -> 2 app stores)
3. Visibility (composite score, per-surface breakdown)
4. Keywords (KEI, metadata score ring, suggested keywords)
5. Competitors (head-to-head matrix, Est. MRR, LLM SoV, Alerts & Moves, AI keyword gap)
6. Reviews (topic intelligence, clustered reviews with routing, emerging signals)
7. Optimizer (metadata snapshot, score, suggestions)
8. Store Intel (editorial features, category rankings)
9. Localization (market opportunity matrix, market-by-market performance)
10. Update Impact (version history, before/after metrics)
11. Recommendations (AI action list, predicted lift)
12. Strategy (quarterly canvas)
13. LLM Tracker (prompts, per-engine SoV, citations)
14. Intent Map (semantic clusters)
15. Ad Intel (spend breakdown, creative library, competitor creatives)
16. Market Intel (category KPIs, share chart)
17. Creative Lab (A/B tests)
18. Custom Product Pages (iOS CPPs)
19. Attribution (7-channel flow, cross-surface causal paths, CAC table)
20. Reviews+ (predictive risk, auto-routing, emerging signals)
21. Agent Readiness (score, manifest)
22. API (docs / key management)
23. Pricing (in-app plan view)

**Issues found:**
- No settings pages in mock (profile, org, members, API keys, webhooks, integrations, billing)
- No empty states designed -- need to add for every page
- No loading skeleton states visible -- need to design
- No error states designed
- Sidebar doesn't collapse -- need mobile/tablet responsive behavior

### 2.4 Admin Dashboard (`surface-admin.html`) Review

**Status: Only Overview page is built. 13 pages are navigation stubs.**

Built:
- Overview with 6 KPI cards, MRR movement (build chart + funnel), plan mix & retention (stacked bars + cohort heatmap), acquisition & geography, module adoption, infra & unit economics (request heatmap + COGS + event stream), top accounts & churn risks

Not built (nav items exist, pages don't):
- Revenue
- Growth & Acquisition
- Retention & Churn
- Customers
- Usage & Engagement
- Feature Adoption
- Module Health
- Infra & API
- Costs & Unit Economics
- Team
- Alerts
- Audit Log
- Settings

**Issues:**
- Still branded "Surface Admin"
- No impersonation UI (mentioned in scope API)
- No incident management page (mentioned in scope)
- Activity/event stream should be a full page, not just an overview widget

### 2.5 iOS Mock (`surface-ios.html`) Review

**Status: 5 screens designed, good UX but inconsistencies with scope.**

Screens in mock:
1. Today/Home -- Visibility hero, quick stats (ASO Score, LLM SoV), alerts feed
2. LLM Tracker -- SoV big number, engine breakdown bars, winning prompts
3. Keywords -- 184 tracked, filter pills, keyword list with rank/delta
4. Reviews+ -- Chase sync alert banner, trending themes, review bubbles
5. Lock Screen/Push -- 3 push notification previews

Tab bar labels: Today, Search, Data, Reviews, Me

**Issues:**
- Still branded "Surface" in push notifications and footer
- Footer says "SwiftUI native" -- we're building Expo/React Native (scope is correct)
- Tab bar has "Search" and "Data" tabs but scope says tabs are Today, LLM, Keywords, Reviews+
- Missing screens: Settings, Upgrade, Sign-in/Sign-up, Verify
- No dark mode variant
- No landscape / iPad layout

---

## 3. Hard Rules

Unchanged from SCOPE.md. Non-negotiable:

1. **No mock data in runtime code.** Empty DB = empty state UI. Test fixtures only in `__tests__/`.
2. **Expo SDK 55 compatibility.** New Architecture always on. No native-only packages.
3. **Supabase is the single source of truth.** RLS on every table. Service role only in Edge Functions.
4. **Vercel hosts web + admin.** Next.js 15 App Router.
5. **TypeScript strict mode.** `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`.
6. **Secrets never reach the client.** Only `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` prefixed.
7. **Every API route validates input with Zod.**
8. **Every mutation returns a typed result.**
9. **Errors caught and surfaced.** Toast or error state -- never silently swallowed.
10. **Accessibility.** All interactive elements labeled. WCAG AA contrast.

---

## 4. Repo Structure

```
aso/
├── apps/
│   ├── web/              # Next.js 15 -- marketing site + customer web app
│   ├── mobile/           # Expo SDK 55 -- iOS companion app
│   ├── admin/            # Next.js 15 -- internal admin dashboard
│   └── workers/          # Node.js workers (scrapers, LLM pollers, MMM jobs)
├── packages/
│   ├── db/               # Supabase client + generated types + migration runner
│   ├── ui-web/           # Shared React components (Tailwind) for web + admin
│   ├── ui-mobile/        # Shared RN components for mobile
│   ├── config/           # ESLint, Prettier, tsconfig bases
│   ├── types/            # Shared TS types (API contracts, DB row types)
│   └── scrapers/         # Reusable scrapers (App Store, Play Store, LLM pollers)
├── supabase/
│   ├── migrations/       # SQL migrations (numbered, forward-only)
│   ├── functions/        # Edge Functions (Deno)
│   └── seed.sql          # Dev only -- role-based test users, NEVER app data
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

Monorepo: pnpm workspaces + Turborepo. Naming: lowercase-kebab-case files, PascalCase components, camelCase functions.

---

## 5. Product Architecture

### 5.1 The 12 Core ASO Tabs (per app)

| # | Tab | Description |
|---|-----|-------------|
| 1 | Overview | KPI cards, 30d trend chart, install trend, priorities, surfaces breakdown, alerts |
| 2 | Discovery Map | SVG flow diagram: 5 AI assistants -> semantic intent -> 2 app stores |
| 3 | Visibility | Composite visibility score across 7 surfaces, historical chart, per-surface breakdown |
| 4 | Keywords | Tracked keywords with rank, volume, difficulty, KEI, SoV, sparklines, metadata score ring, AI-suggested keywords |
| 5 | Competitors | Matrix (up to 10), head-to-head per keyword, Est. MRR, LLM SoV, Alerts & Moves, AI keyword gap analysis |
| 6 | Reviews | Timeline feed, sentiment, reply drafter, filter by rating/country/date, topic intelligence, export CSV |
| 7 | Optimizer | Current metadata snapshot, score, suggested edits, character counts with limits |
| 8 | Store Intel | Editorial features, category rankings, featured placements history, competitor metadata changes |
| 9 | Localization | Per-locale view (40 locales), translation status, market opportunity matrix, market-by-market performance |
| 10 | Update Impact | Version release history, before/after metrics for each release |
| 11 | Recommendations | AI-generated prioritized action list, rationale + predicted lift per action |
| 12 | Strategy | Quarterly planning canvas, goals, linked recommendations, progress tracking |

### 5.2 The 9 Additive Modules (global, cross-app)

| # | Module | Description |
|---|--------|-------------|
| 1 | LLM Tracker | Poll ChatGPT, Claude, Gemini, Perplexity, Copilot. Rank, citation sources, SoV |
| 2 | Intent Map | Semantic clustering of keywords into intent groups, gap analysis |
| 3 | Creative Lab | Icon/screenshot/video A/B testing, synthetic + native store tests, auto-rollout |
| 4 | Ad Intel | Competitor ad creatives from Meta Ad Library, TikTok, Apple Search Ads + Pinterest spend, category spenders |
| 5 | Market Intel | Category-level KPIs (TAM, downloads, ARPU, CAC, seasonality), category share chart |
| 6 | Attribution | Bayesian MMM + geo holdouts, 7-channel flow (incl. Creator/UGC), cross-surface causal paths, per-channel incrementality |
| 7 | Reviews+ | Predictive rating risk, auto-routing to Linear/Jira/Slack, sentiment cluster webhooks, emerging signals |
| 8 | CPPs | Custom Product Pages management (iOS only), AI drafting, performance tracking |
| 9 | Agent Readiness | Score app against OpenAI/Anthropic/Google agent specs, generate manifest files |

---

## 6. Tech Stack

### 6.1 Web (`apps/web` and `apps/admin`)
- Next.js 15 (App Router, React 19)
- Tailwind CSS v4 + shadcn/ui (custom theme from mocks -- `--paper`, `--ink`, `--accent`, etc.)
- TanStack Query (server state)
- Zustand (client UI state -- command palette, modals)
- react-hook-form + Zod (forms)
- Recharts (charts -- SVG palette consistent with design)
- Lucide React (icons)
- date-fns (dates)
- Stripe.js (Checkout redirect)
- cmdk (command palette -- see additions)
- nuqs (URL state management for filters/sorts)

### 6.2 Mobile (`apps/mobile`)
- Expo SDK 55 (Expo Go compatible)
- Expo Router v5 (file-based routing)
- expo-web-browser (Stripe Checkout)
- expo-notifications (push)
- expo-secure-store (session tokens)
- @supabase/supabase-js v2 + AsyncStorage adapter
- react-native-reanimated v4
- react-native-gesture-handler
- NativeWind (Tailwind for RN)
- Victory Native or react-native-svg-charts (charts)

**Banned:** `react-native-mmkv`, `@react-native-firebase/*`, `@stripe/stripe-react-native`, `react-native-fast-image`

### 6.3 Backend
- Supabase (Postgres + Auth + Storage + Edge Functions + Realtime)
- Vercel (web + admin hosting, API routes)
- Railway (long-running Node workers)
- Upstash Redis (queues, rate limits, cron locks)
- Inngest (durable cron/jobs)
- Resend (transactional email)

### 6.4 Workers (`apps/workers`)
- Node 20, TypeScript
- BullMQ + Upstash Redis
- Playwright (headless scraping)
- p-queue (rate-limited concurrency)
- @anthropic-ai/sdk, openai, @google/generative-ai (LLM polling)
- Sentry (error tracking)

---

## 7. Database Schema (Revised)

### 7.1 Core Principles
- Every table: `id uuid default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` (auto-trigger)
- Every user-data table: `organization_id uuid references organizations(id) on delete cascade`
- RLS enabled on all tables. Policies enforce org-scoping.
- Foreign keys everywhere. Indexes on every FK and every `WHERE`/`ORDER BY` column.
- Postgres `enum` types for fixed vocabularies.

### 7.2 Tables

**Auth & Accounts**
| Table | Key Columns |
|-------|-------------|
| `profiles` | `id` (=auth.users.id), `full_name`, `avatar_url`, `default_organization_id`, `is_superuser` (admin flag) |
| `organizations` | `id`, `name`, `slug`, `plan_tier` (enum: solo/team/enterprise), `stripe_customer_id`, `stripe_subscription_id`, `trial_ends_at`, `seat_limit`, `app_limit` |
| `organization_members` | `organization_id`, `user_id`, `role` (enum: owner/admin/member/viewer) |
| `invitations` | `organization_id`, `email`, `role`, `token`, `expires_at`, `accepted_at` |
| `api_keys` | `organization_id`, `name`, `prefix`, `hashed_key`, `last_used_at`, `created_by`, `revoked_at` |

**Apps**
| Table | Key Columns |
|-------|-------------|
| `apps` | `organization_id`, `platform` (ios/android), `store_id`, `name`, `icon_url`, `developer`, `category`, `current_version`, `is_active` |
| `app_metadata_snapshots` | `app_id`, `locale`, `title`, `subtitle`, `description`, `keywords_field`, `promotional_text`, `version`, `snapshot_at` |
| `app_rankings_daily` | `app_id`, `date`, `country`, `category`, `rank_overall`, `rank_category` |
| `app_installs_estimate` | `app_id`, `date`, `country`, `downloads_low`, `downloads_high` |

**Keywords**
| Table | Key Columns |
|-------|-------------|
| `keywords` | `organization_id`, `app_id`, `text`, `country`, `is_tracked`, `added_at` |
| `keyword_ranks_daily` | `keyword_id`, `date`, `rank`, `impressions_estimate`, `search_volume`, `difficulty`, `kei` |
| `intent_clusters` | `organization_id`, `name`, `description`, `embedding` (pgvector) |
| `keyword_cluster_assignments` | `keyword_id`, `cluster_id`, `similarity` |

**Competitors**
| Table | Key Columns |
|-------|-------------|
| `competitors` | `app_id`, `competitor_app_id`, `added_at` |

**Reviews**
| Table | Key Columns |
|-------|-------------|
| `reviews` | `app_id`, `store_review_id` (unique), `rating`, `title`, `body`, `author`, `country`, `version`, `reviewed_at`, `reply_body`, `reply_at`, `sentiment_score`, `cluster_id` |
| `review_clusters` | `app_id`, `label`, `description`, `volume_7d`, `velocity`, `risk_score`, `predicted_rating_delta`, `status` (enum: escalated/ticketed/shipped/building/monitoring) |

**LLM Tracker**
| Table | Key Columns |
|-------|-------------|
| `llm_prompts` | `organization_id`, `app_id` (nullable), `text`, `is_active` |
| `llm_engines` | Static lookup: chatgpt, claude, gemini, perplexity, copilot |
| `llm_poll_runs` | `prompt_id`, `engine`, `polled_at`, `model_version`, `response_raw`, `response_parsed`, `cited_apps` (jsonb), `sources` (jsonb), `error` |
| `llm_visibility_daily` | `app_id`, `engine`, `date`, `share_of_voice`, `avg_rank`, `prompts_cited`, `prompts_total` |

**Surfaces -- Composite Visibility**
| Table | Key Columns |
|-------|-------------|
| `surface_visibility_daily` | `app_id`, `surface` (enum: 7 surfaces), `date`, `visibility_score` (0-100), `rank_avg`, `share_of_voice` |

**Creative Lab**
| Table | Key Columns |
|-------|-------------|
| `creative_tests` | `app_id`, `name`, `asset_type` (icon/screenshot/video/subtitle), `status` (draft/synthetic/live/completed/rolled_out) |
| `creative_variants` | `test_id`, `name`, `asset_url`, `is_control`, `cvr`, `impressions`, `conversions`, `is_winner` |

**Attribution**
| Table | Key Columns |
|-------|-------------|
| `attribution_channels` | `organization_id`, `name`, `type` (enum: organic/paid_asa/paid_meta/paid_google/paid_tiktok/paid_linkedin/referral/llm_referral/content/creator_ugc) |
| `attribution_spend_daily` | `channel_id`, `date`, `spend_usd`, `impressions`, `clicks` |
| `attribution_installs_daily` | `channel_id`, `app_id`, `date`, `installs`, `attributed_model` (last_touch/mmm) |
| `attribution_mmm_runs` | `organization_id`, `ran_at`, `config_json`, `results_json`, `holdout_rmse` |

**Ad Intel**
| Table | Key Columns |
|-------|-------------|
| `competitor_ads` | `competitor_app_id`, `platform` (meta/tiktok/apple_search_ads/google/pinterest), `ad_id`, `first_seen_at`, `last_seen_at`, `creative_url`, `copy`, `landing_url` |

**Market Intel** (NEW -- missing from original scope)
| Table | Key Columns |
|-------|-------------|
| `market_intel_daily` | `category`, `country`, `date`, `total_revenue_estimate`, `total_downloads_estimate`, `avg_arpu`, `avg_cac`, `top_apps` (jsonb), `seasonality_index` |
| `market_category_share` | `app_id`, `category`, `country`, `date`, `revenue_share_pct`, `download_share_pct` |

**CPPs (iOS only)**
| Table | Key Columns |
|-------|-------------|
| `custom_product_pages` | `app_id`, `cpp_id`, `name`, `status`, `screenshots` (jsonb), `short_description`, `cvr`, `impressions` |

**Agent Ready**
| Table | Key Columns |
|-------|-------------|
| `agent_readiness_scans` | `app_id`, `scanned_at`, `spec_version`, `score`, `checks` (jsonb) |
| `agent_manifests` | `app_id`, `version`, `manifest_json`, `published_at` |

**Alerts & Webhooks**
| Table | Key Columns |
|-------|-------------|
| `alerts` | `organization_id`, `app_id`, `severity` (info/warning/critical), `type`, `title`, `body`, `data` (jsonb), `read_at`, `resolved_at` |
| `webhook_endpoints` | `organization_id`, `url`, `events` (text[]), `secret`, `is_active` |
| `webhook_deliveries` | `endpoint_id`, `event_id`, `attempt`, `response_status`, `response_body`, `delivered_at` |

**Integrations**
| Table | Key Columns |
|-------|-------------|
| `integrations` | `organization_id`, `provider` (linear/jira/slack/segment/datadog/github), `config` (jsonb), `credentials_encrypted`, `is_active` |

**Billing & Usage**
| Table | Key Columns |
|-------|-------------|
| `usage_events` | `organization_id`, `event_type`, `metadata` (jsonb), `quantity`, `occurred_at` |
| `stripe_events` | `stripe_event_id` (unique), `type`, `payload` (jsonb), `processed_at` |

**NEW TABLES (missing from original scope)**

| Table | Key Columns | Why |
|-------|-------------|-----|
| `changelog_entries` | `id`, `title`, `body_markdown`, `category` (feature/improvement/fix), `published_at`, `author_id` | Referenced in page inventory (marketing /changelog) |
| `feature_flags` | `id`, `key` (unique), `description`, `value` (jsonb), `percentage` (0-100), `updated_by`, `updated_at` | Referenced in admin API (`POST /api/admin/feature-flags/:key`) |
| `worker_runs` | `id`, `function_name`, `started_at`, `ended_at`, `status` (running/success/failed), `error_message`, `records_processed`, `metadata` (jsonb) | Referenced in error policy section 6.6 |
| `audit_log` | `id`, `actor_id`, `actor_email`, `action`, `resource_type`, `resource_id`, `metadata` (jsonb), `ip_address`, `created_at` | Admin nav shows "Audit log" page; impersonation must be audit-logged |
| `notification_preferences` | `id`, `user_id`, `channel` (push/email/in_app), `event_type`, `is_enabled` | Push notification settings need per-user control |
| `scheduled_reports` | `id`, `organization_id`, `name`, `frequency` (daily/weekly/monthly), `recipients` (text[]), `config` (jsonb), `next_run_at`, `last_run_at` | Email digests (see additions section) |
| `onboarding_progress` | `id`, `user_id`, `organization_id`, `step` (enum), `completed_at`, `data` (jsonb) | Track onboarding funnel completion for admin analytics |

### 7.3 RLS Policy Template

Every user-scoped table:
```sql
-- SELECT: org member can read
CREATE POLICY "select_own_org" ON <table> FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- INSERT: non-viewer can write
CREATE POLICY "insert_own_org" ON <table> FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
  ));

-- UPDATE: non-viewer can update
CREATE POLICY "update_own_org" ON <table> FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
  ));

-- DELETE: owner/admin only
CREATE POLICY "delete_own_org" ON <table> FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));
```

### 7.4 Generated Types
Run `supabase gen types typescript --project-id=<id>` -> `packages/db/src/generated.ts`. Re-run on every migration.

---

## 8. Data Acquisition Pipeline

Lives in `apps/workers`. This is the highest-risk part of the system.

### 8.1 App Store Scraping (iOS)
- iTunes Search API (public, no auth) for basic info
- `ios-app-store-scraper` npm for rankings
- Keyword ranks: proxy-rotated rank-checker, country-specific
- Reviews: RSS feed poll every 6h
- Rate limit: min 1 req/IP/2s, residential proxy pool

### 8.2 Play Store Scraping
- `google-play-scraper` npm for app info, reviews, rankings
- Same proxy rotation + rate limit rules
- Poll every 6h

### 8.3 LLM Polling (the wedge)
Every 6 hours, poll each active prompt against each engine.

**Per (prompt, engine) tuple:**
1. Send prompt verbatim -- no system prompt manipulation
2. Parse out app recommendations (names, store links, bundle IDs)
3. Store raw response + parsed structure
4. Update `llm_visibility_daily` aggregates

**Engine adapters:**
| Engine | API | Model |
|--------|-----|-------|
| ChatGPT | OpenAI Responses API | gpt-5 (or current default), web-search tool |
| Claude | Anthropic Messages API | claude-opus-4-7, web-search tool |
| Gemini | Google Generative AI | gemini-2.5-pro, Google Search grounding |
| Perplexity | Perplexity API | sonar-pro |
| Copilot | N/A | Stub -- "coming soon" UI until API access |

**Parsing:** Use claude-sonnet-4-6 with JSON mode to extract `[{app_name, platform?, store_url?, bundle_id?, rank_in_response}]`. Log parsing cost.

### 8.4 Ad Intel
- Meta Ad Library Graph API (token required, daily per competitor)
- TikTok Creative Center (Playwright scrape)
- Apple Search Ads: "connect ASA account" integration only
- Pinterest: Playwright scrape of Pinterest Ads Library

### 8.5 Market Intel Data (NEW)
- SensorTower/data.ai public data where available
- App Annie alternatives (public category data)
- Aggregate from our own scraper data at scale

### 8.6 Queue Architecture (Inngest)
| Function | Schedule |
|----------|----------|
| `scrape.app_store.metadata` | Every 24h |
| `scrape.app_store.rankings` | Every 6h |
| `scrape.app_store.reviews` | Every 6h |
| `scrape.play_store.metadata` | Every 24h |
| `scrape.play_store.rankings` | Every 6h |
| `scrape.play_store.reviews` | Every 6h |
| `llm.poll_prompts` | Every 6h, fans out per (prompt, engine) |
| `attribution.run_mmm` | Weekly per org, or on-demand |
| `reviews.cluster_and_score` | Every 2h |
| `alerts.dispatch` | Every 5 min |
| `market_intel.aggregate` | Daily |
| `reports.send_scheduled` | Hourly (checks `next_run_at`) |

Each function is idempotent and safe to retry.

### 8.7 Error Policy
- Every run logs to `worker_runs` table
- Slack alert on 3 consecutive failures
- On 429/CAPTCHA: exponential backoff, proxy rotation, max 5 retries per job

---

## 9. API Surface

All routes: Zod validation, typed responses `{ ok: true, data } | { ok: false, error: { code, message } }`.

### 9.1 Resource Endpoints (`/api/apps/*`)
```
GET    /api/apps
POST   /api/apps                          { platform, store_id }
DELETE /api/apps/:id
GET    /api/apps/:id/overview
GET    /api/apps/:id/discovery-map
GET    /api/apps/:id/visibility
GET    /api/apps/:id/keywords
POST   /api/apps/:id/keywords             { keywords: string[] }
DELETE /api/apps/:id/keywords/:keywordId
GET    /api/apps/:id/reviews              ?cursor=&limit=&filter=
POST   /api/apps/:id/reviews/:reviewId/reply
GET    /api/apps/:id/competitors
POST   /api/apps/:id/competitors          { competitor_app_store_id }
GET    /api/apps/:id/metadata
POST   /api/apps/:id/metadata/suggest
GET    /api/apps/:id/localization
GET    /api/apps/:id/update-impact
GET    /api/apps/:id/recommendations
GET    /api/apps/:id/strategy
POST   /api/apps/:id/strategy             { goals, recommendations }
```

### 9.2 Global Module Endpoints
```
GET    /api/llm/prompts
POST   /api/llm/prompts                   { text, app_id? }
GET    /api/llm/visibility                 ?prompt_id=&engine=&from=&to=
POST   /api/llm/run-now                   (rate limited: 1/min/org)
GET    /api/intent/clusters
POST   /api/intent/cluster                 (trigger re-clustering)
GET    /api/creative/tests
POST   /api/creative/tests
GET    /api/ad-intel                       ?competitor_id=&platform=
GET    /api/market-intel                   ?category=&country=
GET    /api/attribution/runs
POST   /api/attribution/runs               (trigger MMM, returns job id)
GET    /api/agent/score                    ?app_id=
POST   /api/agent/manifest                 ?app_id=
GET    /api/reviews-plus/signals           ?app_id=
GET    /api/cpps                           ?app_id=
POST   /api/cpps
```

### 9.3 Account & Billing
```
GET    /api/org
POST   /api/org/invite                     { email, role }
PATCH  /api/org                            { name, slug }
DELETE /api/org/members/:userId
GET    /api/org/api-keys
POST   /api/org/api-keys                   { name }
DELETE /api/org/api-keys/:id
POST   /api/billing/checkout               { plan, cycle }
POST   /api/billing/portal
POST   /api/billing/webhook                (Stripe webhook)
GET    /api/notifications/preferences
PATCH  /api/notifications/preferences      { channel, event_type, is_enabled }
```

### 9.4 Webhook Endpoints (customer-facing)
```
GET    /api/webhooks/endpoints
POST   /api/webhooks/endpoints             { url, events: string[] }
DELETE /api/webhooks/endpoints/:id
GET    /api/webhooks/deliveries            ?endpoint_id=
POST   /api/webhooks/:id/resend/:deliveryId
```

### 9.5 Admin-Only (`apps/admin`)
```
GET    /api/admin/stats
GET    /api/admin/revenue                  ?range=
GET    /api/admin/growth                   ?range=
GET    /api/admin/retention                ?range=
GET    /api/admin/accounts                 ?filter=&cursor=
GET    /api/admin/accounts/:id
POST   /api/admin/accounts/:id/impersonate
GET    /api/admin/usage                    ?range=
GET    /api/admin/features
GET    /api/admin/modules
GET    /api/admin/infra
GET    /api/admin/costs
GET    /api/admin/team
GET    /api/admin/alerts
PATCH  /api/admin/alerts/:id               { resolved: true }
GET    /api/admin/audit-log                ?actor=&action=&from=&to=
POST   /api/admin/feature-flags/:key       { value, percentage }
GET    /api/admin/incidents
POST   /api/admin/incidents                { title, severity, description }
PATCH  /api/admin/incidents/:id            { status, resolution }
POST   /api/admin/changelog                { title, body, category }
```

---

## 10. Auth & Onboarding

### 10.1 Web
1. Marketing site -> "Start free trial" -> `/signup` on `app.aso.com`
2. Signup: email + password + full name -> Supabase `signUp`
3. Email verification (Supabase + Resend custom template)
4. `/onboarding` flow:
   - Step 1: Create org, pick plan (14-day trial, no card for Solo/Team)
   - Step 2: Add first app (paste App Store / Play Store URL)
   - Step 3: Add first keywords (auto-suggested from app metadata)
   - Step 4: Connect first LLM prompt (seeded suggestion based on category)
5. Redirect to `/app/:appSlug/overview`
6. Track completion in `onboarding_progress` table

### 10.2 Mobile
- Email/password via supabase-js + AsyncStorage
- Deep link for email verification (Expo Linking)
- After login -> Today/Home screen
- Subscription purchase via `expo-web-browser` -> Stripe Checkout -> redirect back -> re-fetch org

---

## 11. Billing -- Stripe

### 11.1 Products
| Plan | Monthly | Annual | Trial |
|------|---------|--------|-------|
| ASO Solo | $49/mo | $490/yr (save 17%) | 14 days, no card |
| ASO Team | $290/mo | $2,900/yr (save 17%) | 14 days, no card |
| ASO Enterprise | Custom | Starts at $18K/yr | Custom |

### 11.2 Plan Limits
| Limit | Solo | Team | Enterprise |
|-------|------|------|------------|
| Apps | 1 | 10 | Unlimited |
| Keywords | 500 | Unlimited | Unlimited |
| LLM prompts | 25 | 200 | Unlimited |
| Seats | 1 | 5 | Unlimited |
| API calls/mo | 10K | 250K | Unlimited |
| Scheduled reports | 1 | 10 | Unlimited |

### 11.3 Webhook Events
- `customer.subscription.created` -- set plan_tier, trial_ends_at, limits
- `customer.subscription.updated` -- update plan_tier
- `customer.subscription.deleted` -- downgrade, 7-day grace
- `invoice.payment_failed` -- flag org, email admin
- `invoice.payment_succeeded` -- reset flags

### 11.4 Enforcement
`enforceLimit(orgId, limitType)` server-side helper. Returns `{ code: 'LIMIT_REACHED', limit_type, current, max, upgrade_url }`. UI shows upgrade modal.

---

## 12. Web App -- Page Inventory

All pages render real data via TanStack Query. Loading = skeletons. Empty = illustration + CTA.

### 12.1 Marketing Site (`(marketing)` route group)
| Route | Source Mock |
|-------|-----------|
| `/` | `surface-home-bold.html` |
| `/compare/apptweak` | SEO compare page |
| `/compare/sensor-tower` | SEO compare page |
| `/compare/appfollow` | SEO compare page |
| `/use-cases/agencies` | Use case landing |
| `/use-cases/indie-devs` | Use case landing |
| `/use-cases/enterprise` | Use case landing |
| `/docs/*` | Fumadocs or Nextra |
| `/changelog` | Reads from `changelog_entries` |
| `/pricing` | Extract from homepage |
| `/about`, `/careers`, `/customers` | Static content |
| `/privacy`, `/terms`, `/security`, `/dpa` | Legal pages |

### 12.2 App (`(app)` route group -- auth required)
| Route | Source Mock (page in `surface-full.html`) |
|-------|-----------|
| `/app` | App picker / org overview |
| `/app/:slug/overview` | Overview page |
| `/app/:slug/discovery-map` | Discovery Map page |
| `/app/:slug/visibility` | Visibility page |
| `/app/:slug/keywords` | Keywords page |
| `/app/:slug/competitors` | Competitors page |
| `/app/:slug/reviews` | Reviews page |
| `/app/:slug/optimizer` | Optimizer page |
| `/app/:slug/store-intel` | Store Intel page |
| `/app/:slug/localization` | Localization page |
| `/app/:slug/update-impact` | Update Impact page |
| `/app/:slug/recommendations` | Recommendations page |
| `/app/:slug/strategy` | Strategy page |
| `/llm-tracker` | LLM Tracker page |
| `/intent-map` | Intent Map page |
| `/creative-lab` | Creative Lab page |
| `/ad-intel` | Ad Intel page |
| `/market-intel` | Market Intel page |
| `/attribution` | Attribution page |
| `/reviews-plus` | Reviews+ page |
| `/cpps` | CPPs page |
| `/agent-ready` | Agent Readiness page |
| `/settings/profile` | User profile |
| `/settings/organization` | Org settings |
| `/settings/members` | Team members + invites |
| `/settings/api-keys` | API key management |
| `/settings/webhooks` | Webhook endpoints |
| `/settings/integrations` | Linear, Jira, Slack, etc. |
| `/settings/billing` | Plan, invoices, portal |
| `/settings/notifications` | Push/email/in-app preferences |

### 12.3 Shared App Features (not in mock, need to add)
- **Command palette** (Cmd+K) -- search apps, keywords, pages, actions
- **Notification center** -- bell icon in header, dropdown with recent alerts
- **Upgrade modal** -- triggered when hitting plan limits
- **Empty states** -- illustration + CTA per page
- **Loading skeletons** -- match card/table shapes from mock
- **Error boundaries** -- per-page error state with retry

---

## 13. Admin Dashboard -- Page Inventory

All pages at `admin.aso.com`. Restricted to `profiles.is_superuser = true`.

Source mock: `surface-admin.html` (Overview built, rest need building).

### 13.1 Business
| Page | KPIs / Content |
|------|---------------|
| **Overview** (built) | 6 KPI cards, MRR movement, plan mix, cohort retention, acquisition, module adoption, infra, top accounts, churn risks |
| Revenue | MRR/ARR trends, revenue by plan over time, expansion/contraction detail, invoice history |
| Growth & Acquisition | Signup funnel (visit -> signup -> activate -> paid), channel breakdown, CAC trends, payback trends |
| Retention & Churn | Gross/net churn trends, cohort heatmaps (expanded), churn reasons, win-back campaigns |
| Customers | Searchable/filterable account list, account detail view, health scores, impersonation button, usage timeline |

### 13.2 Product
| Page | Content |
|------|---------|
| Usage & Engagement | DAU/WAU/MAU, session duration, pages per session, feature usage funnel |
| Feature Adoption | Per-module activation rates (8 modules), adoption curves, feature flag status |
| Module Health | Per-module error rates, latency p50/p95/p99, queue depths, scraper success rates |

### 13.3 Ops
| Page | Content |
|------|---------|
| Infra & API | Request volume heatmap (expanded), API endpoint latency, error rates by endpoint, rate limit hits |
| Costs & Unit Economics | COGS breakdown over time, LLM spend detail, per-customer cost, gross margin trend |
| Team | Internal team members, role assignments, activity |

### 13.4 System
| Page | Content |
|------|---------|
| Alerts | All system alerts (worker failures, error spikes, churn risks), resolve/snooze actions |
| Audit Log | All admin actions (impersonation, flag changes, account edits), filterable by actor/action/date |
| Settings | Admin-level config: Stripe product IDs, feature flags table, env var status, Inngest dashboard link |

### 13.5 Not in original mock but needed
| Page | Content |
|------|---------|
| Incidents | Incident management: create/update/resolve, timeline, status page sync |
| Changelog Manager | CRUD for `changelog_entries`, preview, publish/unpublish |

---

## 14. Mobile App -- Screen Inventory

Source mock: `surface-ios.html`. Expo Router structure.

### 14.1 File Structure
```
apps/mobile/src/app/
├── (auth)/
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   └── verify.tsx
├── (tabs)/
│   ├── _layout.tsx          # 5-tab layout
│   ├── index.tsx             # Today / Home
│   ├── search.tsx            # Search (global search)
│   ├── data.tsx              # Data hub (LLM + Keywords)
│   ├── reviews.tsx           # Reviews+
│   └── me.tsx                # Profile / Settings
├── app/[slug]/
│   ├── overview.tsx
│   ├── keywords.tsx
│   └── llm.tsx
├── upgrade.tsx               # Opens Stripe via expo-web-browser
├── notifications.tsx         # Notification preferences
└── _layout.tsx               # Root stack, auth redirect
```

### 14.2 Tab Bar (aligned to mock)
| Tab | Icon | Content |
|-----|------|---------|
| Today | Home | Visibility hero, ASO Score, LLM SoV, alert feed |
| Search | Magnifier | Global search: apps, keywords, prompts |
| Data | Bar chart | LLM Tracker SoV + Keywords list (swipe between) |
| Reviews | Chat | Reviews+ with trending themes, alert banner, review feed |
| Me | Person | Profile, org, plan, settings, notification prefs, sign out |

### 14.3 Push Notifications
| Type | Trigger |
|------|---------|
| `rating_risk_critical` | Review cluster crosses risk threshold |
| `creative_winner` | Creative Lab test concludes |
| `llm_visibility_drop` | SoV drops >20% day-over-day |
| `rank_movement` | Daily digest (opt-in) |
| `competitor_alert` | Competitor metadata change or ad launch |

---

## 15. Design System

### 15.1 Tokens (from mocks -- canonical)
```css
--paper: #f4f1ea
--paper-2: #ebe7dc
--paper-3: #e0dbce
--ink: #0e0e0c
--ink-2: #3a3a36
--ink-3: #72716a
--ink-4: #a8a69b
--line: #d8d3c4
--line-soft: #e4e0d3
--accent: #1d3fd9
--accent-2: #0a1f8a
--accent-wash: #e8ecfa
--warn: #c43b1e
--warn-wash: #f7e6df
--ok: #1f6a3a
--ok-wash: #e0efe3
--gold: #b58300
```

### 15.2 Typography
| Role | Font | Usage |
|------|------|-------|
| Display | Instrument Serif | Headlines, big numbers, italic accents |
| Sans | Inter Tight | Body text, UI labels, buttons |
| Mono | JetBrains Mono | Data labels, pill badges, timestamps, KPI units |

Load via `next/font` (web) and `@expo-google-fonts/*` (mobile).

### 15.3 Component Library (`packages/ui-web`)
Port these component patterns from the mocks:
- KPI cards (`.kpi-strip`)
- Data tables with hover states
- Pill badges (ok/warn/accent/dark/new variants)
- Bar charts (horizontal bars)
- Progress bars
- Sparkline charts
- Score rings (SVG)
- Card containers (`.card`)
- Section headers (`.section-head` with `section-num`)
- Chip rows (`.chip-row`)
- Flow lines (`.flow-line` for Attribution)
- Review items
- Alert rows
- Cohort heatmaps
- Stacked bars
- Empty states
- Loading skeletons
- Error states
- Command palette (cmdk)
- Notification dropdown
- Upgrade modal
- Sidebar navigation
- Breadcrumb trail
- Top bar with search

### 15.4 The Mock Is the Spec
The HTML mocks define the exact look and feel. When porting to React:
- Match pixel-perfect. Same fonts, same colors, same spacing.
- Same editorial/newspaper aesthetic: warm paper backgrounds, ink text, serif headlines with italic accents.
- Same information density and layout patterns.
- Do NOT add animations, gradients, or effects not in the mocks.
- Do NOT use generic component libraries that override the aesthetic.

---

## 16. Testing

- **Unit (Vitest):** Every utility, Zod schema, Stripe webhook handler
- **Integration (Vitest + Supabase local):** Every API route against seeded local Supabase
- **E2E (Playwright):** Critical flows: signup -> onboarding -> add app -> see data; subscription upgrade; webhook delivery
- **Coverage:** 70%+ on `packages/*`, 50%+ on `apps/web/app/api/*`
- `pnpm test` in CI on every PR. Block merge on failure.

---

## 17. Observability

- **Sentry** on web, admin, mobile, workers (auto source-map upload)
- **Axiom** or **Logtail** for structured logs
- **Better Stack** or **Uptime Robot** pinging `/api/health` every minute
- `/api/health` returns 200 if Supabase query + Redis ping succeed, else 503
- **Worker run logging** to `worker_runs` table with status, duration, records processed

---

## 18. CI/CD

- **GitHub Actions:** lint, typecheck, test, build on every PR
- **Vercel preview deploys** per PR for `apps/web` and `apps/admin`
- **EAS Update** for mobile OTA on merge to `main`
- **Railway auto-deploy** for `apps/workers` on merge to `main`
- **Supabase migrations:** `supabase db push` via GitHub Action on merge to `main`, gated on manual approval for prod
- **Preview databases:** Supabase branching per PR

---

## 19. Build Order -- Weeks 1-16

### Week 1 -- Foundation
- Monorepo scaffolding (pnpm + Turborepo)
- `packages/config` (tsconfig, eslint, prettier)
- `apps/web` Next.js 15 skeleton
- Port `surface-home-bold.html` to React components (marketing homepage)
- Vercel deploy on placeholder domain
- Supabase project: first migration (`profiles`, `organizations`, `organization_members`, `invitations`)
- Supabase Auth (email/password + magic link)
- Design system: `packages/ui-web/src/theme.ts` with all tokens

### Week 2 -- Apps + Keywords (core, no scraped data yet)
- Migrations: `apps`, `keywords`, `keyword_ranks_daily`, `reviews`, `competitors`, `onboarding_progress`
- API routes: apps CRUD, keywords CRUD
- Onboarding flow (paste App Store URL -> parse via iTunes Search API -> insert)
- App picker + Overview page + Keywords page with empty states
- TanStack Query wired up
- Command palette skeleton (cmdk)

### Week 3 -- First Scraper + Workers
- `apps/workers` on Railway
- Inngest wired up
- App Store scraper: metadata + rankings + reviews
- Play Store scraper: metadata + rankings + reviews
- `worker_runs` table + logging
- Data shows in Overview, Keywords, Reviews (no more empty states)

### Week 4 -- LLM Tracker (the wedge)
- Migrations: `llm_prompts`, `llm_poll_runs`, `llm_visibility_daily`, `llm_engines`
- Engine adapters: ChatGPT, Claude, Gemini, Perplexity (Copilot stub)
- LLM Tracker page (desktop)
- Discovery Map page
- Inngest cron every 6h per active prompt

### Week 5 -- Billing
- Stripe products setup
- Checkout + Customer Portal + Webhook handler
- `stripe_events` + `usage_events` tables
- Plan limits enforcement
- Settings -> Billing page
- Upgrade modals on limit errors

### Week 6 -- Core Tabs Batch 1 (Competitors, Optimizer, Store Intel, Visibility)
- Competitors page with matrix view + alerts & moves
- Optimizer with LLM suggestion endpoint
- Store Intel (editorial features from scraper)
- Visibility page (composite score, per-surface breakdown)
- `surface_visibility_daily` aggregation job

### Week 7 -- Core Tabs Batch 2 (Localization, Update Impact, Recommendations, Strategy)
- Localization with per-locale view + market-by-market table
- Update Impact with version history
- Recommendations engine (LLM-powered)
- Strategy canvas

### Week 8 -- Intent Map + Creative Lab
- pgvector + embedding via OpenAI/Voyage
- Intent Map visualization
- Creative Lab upload + synthetic test endpoints
- `creative_tests` + `creative_variants` tables

### Week 9 -- Ad Intel + Reviews+ + Market Intel
- Meta Ad Library integration
- TikTok Creative Center scraper
- Reviews+ prediction model
- Auto-routing to Linear/Jira
- Market Intel page + `market_intel_daily` aggregation
- `review_clusters` scoring job

### Week 10 -- Attribution (MMM)
- Bayesian MMM worker (Python FastAPI on Fly or Node equivalent)
- Attribution page with 7-channel flow
- Cross-surface causal paths
- CAC by channel table
- `attribution_mmm_runs` table

### Week 11 -- CPPs + Agent Readiness + Integrations
- CPPs management for iOS apps
- Agent Readiness scanner + manifest generator
- Integration config UI (Linear, Jira, Slack, Segment)
- Webhook endpoint management

### Week 12 -- Settings + Notifications
- All settings pages: profile, org, members, API keys, webhooks, integrations, billing, notifications
- Notification center (bell dropdown)
- `notification_preferences` table
- Scheduled reports setup (email digests)
- `scheduled_reports` table + Inngest job

### Week 13 -- Mobile App
- Expo SDK 55 setup, EAS configured
- Auth flow (email/password, deep link verification)
- 5 tab screens: Today, Search, Data, Reviews, Me
- Push notifications (expo-notifications)
- Upgrade flow via expo-web-browser -> Stripe Checkout

### Week 14 -- Admin Dashboard
- Port `surface-admin.html` Overview to React
- Build remaining 13+ admin pages with live data
- Impersonation + audit logging
- `audit_log` table
- Feature flag management
- Changelog manager
- Incident management

### Week 15 -- Polish
- E2E tests for critical flows (Playwright)
- Empty states for every page
- Loading skeletons for every page
- Error boundaries per page
- Full accessibility pass (WCAG AA)
- SEO compare pages + use case pages

### Week 16 -- Launch Prep
- Sentry + Axiom + uptime monitoring all green
- Load testing (LLM poller at 10K prompts)
- Security audit (OWASP Top 10 check)
- Legal pages (privacy, terms, DPA)
- Soft launch to 10 beta customers
- Public status page

---

## 20. What NOT to Build in v1

- White-labeling for agencies (phase 2)
- Android mobile app (iOS first)
- Native Stripe SDK (always web redirect from mobile)
- Browser extension
- Slack app (use webhook integration instead)
- Public API marketplace
- GraphQL (REST is sufficient)
- Real-time collaboration / multiplayer cursors
- Custom dashboard builder
- Self-hosted / on-prem
- SSO / SCIM (phase 2, Enterprise only)
- Dark mode (phase 2)
- Multi-language / i18n for the tool itself (English only v1)

---

## 21. Suggested Additions -- What's Missing

These are features/capabilities not in the current scope that would meaningfully improve the product. Organized by priority.

### 21.1 High Priority (should be in v1)

| Feature | Why | Effort |
|---------|-----|--------|
| **Command palette (Cmd+K)** | Power users need fast navigation across 23+ pages, search keywords/apps/prompts | 2-3 days |
| **Notification center** | Bell icon + dropdown for in-app alerts instead of only push/email | 2 days |
| **Scheduled email digests** | Weekly/monthly summary emails -- competitors all have this, it's table stakes for enterprise | 3-4 days |
| **Custom alert rules** | Let users define thresholds (e.g., "alert me if rank for X drops below 10") instead of only system-defined alerts | 3-4 days |
| **Data export beyond CSV** | PDF reports, JSON export, Excel -- agencies need branded PDF reports for clients | 3-4 days |
| **Onboarding progress tracking** | Track funnel (admin needs this for growth metrics), show checklist to user | 2 days |
| **Keyboard shortcuts** | Power users expect them in data-heavy SaaS (j/k navigation, / for search, etc.) | 2 days |
| **Public status page** | Build trust, reduce support load. Can use Better Stack's hosted page | 1 day |
| **Changelog** | Public-facing changelog at `/changelog` -- already in page inventory, needs admin CRUD | 2-3 days |

### 21.2 Medium Priority (v1.1 -- first month post-launch)

| Feature | Why | Effort |
|---------|-----|--------|
| **Chart annotations** | Mark events on time-series charts (app update, campaign launch, press mention) | 3-4 days |
| **Saved views / Filters** | Save keyword filter combos, competitor comparison views | 3 days |
| **Competitor metadata change alerts** | Auto-detect when a competitor changes their title/subtitle/screenshots | 2 days |
| **A/B test significance calculator** | Built-in calculator for Creative Lab -- many users will want to validate results | 1-2 days |
| **App Store screenshot preview** | Preview how metadata changes will look on device before publishing | 3-4 days |
| **Team activity feed** | "Sarah added 5 keywords", "Miguel ran an MMM" -- useful for Team/Enterprise plans | 2-3 days |
| **Zapier / Make integration** | "When alert fires, do X" -- extends platform without building Slack app | 3-4 days |
| **Two-factor authentication** | Enterprise customers will ask for this before SSO lands | 2-3 days |

### 21.3 Low Priority (v2 roadmap)

| Feature | Why |
|---------|-----|
| **Dark mode** | Common request, affects entire UI |
| **Multi-language support (i18n)** | Expand to non-English markets |
| **White-label PDF reports** | Agencies need branded reports for their clients |
| **Custom dashboards** | Build your own KPI combinations |
| **Slack bot** | Beyond webhooks -- interactive Slack commands |
| **Goal / OKR tracking** | Link strategy goals to measured outcomes |
| **Competitor intelligence dossiers** | Auto-generated competitor reports |
| **Browser extension** | Quick-lookup keyword ranks from App Store pages |
| **Bulk operations** | Bulk keyword add/remove, bulk competitor add |
| **API rate limit dashboard** | Let users see their API usage in settings |

### 21.4 Architecture Improvements

| Improvement | Why |
|-------------|-----|
| **Rate limiting middleware** | Not defined in scope -- need per-endpoint + per-org rate limits (use Upstash `@upstash/ratelimit`) |
| **Idempotency keys** | For all POST mutations -- prevent double-submits |
| **Request ID tracing** | Propagate request IDs through API -> worker -> Supabase for debugging |
| **Graceful degradation** | If LLM API is down, show cached data with "last updated" badge instead of error |
| **Database connection pooling** | Use Supabase's PgBouncer, configure pool sizes per service |
| **CDN for assets** | Creative Lab screenshots/icons should go through Supabase Storage + CDN |
| **Background job dashboard** | Inngest dashboard link in admin, but also a lightweight in-app view of recent job runs |

---

## 22. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| App Store scraping gets blocked | High | Critical | Residential proxy rotation, multiple proxy providers, exponential backoff, graceful degradation with cached data |
| LLM API costs spiral | High | High | Per-prompt cost tracking, usage caps per plan, batch prompts efficiently, cache responses for 6h |
| LLM API responses change format | Medium | High | Structured output parsing with fallback, alert on parse failure rate >5% |
| Supabase row limits on free/pro tier | Medium | Medium | Monitor row counts, plan for Supabase Enterprise or self-hosted Postgres |
| Stripe webhook delivery failures | Low | High | Idempotent handler, `stripe_events` dedup table, dead letter queue |
| CAPTCHA on scraping endpoints | High | High | Residential proxies, headless browser fingerprint randomization, fallback to public APIs where available |
| Expo SDK 55 breaking changes | Low | Medium | Pin exact versions, test on real devices weekly |
| Legal risk from scraping | Medium | Critical | Terms of service review, only scrape public data, respect robots.txt, consult legal counsel |
| LTV/CAC ratio worse than projected | Medium | High | Monitor in admin dashboard, adjust pricing/packaging early |
| Team burnout on 16-week sprint | Medium | High | Buffer weeks, prioritize ruthlessly, cut scope not quality |

---

## 23. Appendices

### Appendix A -- Name Rename Checklist
When final brand name is locked, replace:
- `ASO` -> final display name
- `aso` -> final lowercase slug
- `aso.com` -> final domain
- `@aso/*` package scopes
- Stripe product names
- Logo assets in `packages/ui-web/src/assets/logo/` and `packages/ui-mobile/src/assets/logo/`
- Push notification sender name
- Email templates (Resend)
- Legal pages

### Appendix B -- Domain Decision Log
Pending. Shortlist:
1. Overtly (`overtly.app` / `getovertly.com`)
2. Visibl (`visibl.app`)
3. Surface (`surfaceaso.com` / `getsurface.com`)
4. Beacon (`usebeacon.app`)

### Appendix C -- Environment Variables
(Same as SCOPE.md Section 4 -- update `surface` references to `aso`)

### Appendix D -- Mock File Reference
| File | What It Mocks | Status |
|------|---------------|--------|
| `surface-home-bold.html` | Marketing homepage | Complete, needs rename |
| `surface-full.html` | User dashboard (23+ pages) | Complete, renamed to ASO |
| `surface-admin.html` | Admin dashboard | Overview only, 13 pages need building |
| `surface-ios.html` | iOS companion app (5 screens) | Complete, needs rename |

---

*Generated from a full review of all project mocks and the original SCOPE.md.*
*Last updated: April 20, 2026*
