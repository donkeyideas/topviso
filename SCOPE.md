# SURFACE — v1 Product Scope

> **Working name: Surface.** Domain TBD — final name to be locked before package.json / app.json / Stripe product names are set. If the final name differs, do a global rename as the first commit before starting work.

**Claude Code:** This is the authoritative spec. If anything is ambiguous, STOP and ask. Do not invent features that aren't listed. Do not generate mock data, seed files, placeholder arrays, or hardcoded stubs **anywhere** in the runtime path — every piece of data the user sees must be read from Supabase, Stripe, or a live upstream API. If a table is empty, the UI must render a proper empty state, not fake rows.

---

## 0. Hard rules (non-negotiable, applies to every file you write)

1. **No mock data, ever, in runtime code.** No `const FAKE_KEYWORDS = [...]`, no seed arrays used by components, no "// TODO: replace with API" followed by hardcoded data. Empty database = empty state UI. The *only* exception is unit test fixtures under `__tests__/` or `.test.ts` files.
2. **Expo Go 55 compatibility is mandatory for the mobile app.** SDK 55 / React Native 0.83 / React 19.2 / New Architecture always on. Only use packages in the Expo SDK or pure-JS packages. **Banned in the Expo Go bundle:** `@stripe/stripe-react-native`, `react-native-mmkv`, any native Firebase module, any library requiring custom native code. Use Stripe Checkout via browser redirect (`expo-web-browser`) for payments inside the app.
3. **Supabase is the single source of truth.** Every query goes through a typed Supabase client. Row Level Security (RLS) is enabled on every table. No bypassing RLS from client code — if you need elevated access, it goes in an Edge Function with the service role key.
4. **Vercel hosts the web app and marketing site.** Next.js 15 App Router. Edge runtime where possible, Node runtime where Node-only libs are needed. `.env.local` for local, Vercel env vars for prod.
5. **TypeScript strict mode on both repos.** `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`. No `any` without a `// @ts-expect-error` comment explaining why.
6. **Secrets never reach the client.** Only `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` prefixed vars are safe. Supabase service role key, Stripe secret key, LLM API keys, scraper keys — all server-side only.
7. **Every API route validates input with Zod.** No trusting request bodies.
8. **Every mutation returns a typed result.** No `Promise<any>`.
9. **Errors must be caught and surfaced, never silently swallowed.** Use `try/catch` around every await at the component boundary. Show a toast or error state — do not `console.log` and move on.
10. **Accessibility matters.** All interactive elements have accessible labels. Color contrast passes WCAG AA.

---

## 1. Repo structure

Monorepo using pnpm workspaces. Turborepo for task running.

```
surface/
├── apps/
│   ├── web/              # Next.js 15 — marketing site + customer web app
│   ├── mobile/           # Expo SDK 55 — iOS / Android companion app
│   ├── admin/            # Next.js 15 — internal admin (separate subdomain)
│   └── workers/          # Node.js workers for scraping + LLM polling (Railway/Fly)
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
│   └── seed.sql          # Supabase Seed (dev only — role-based test users, NEVER app data)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Naming:** lowercase-kebab-case for files and folders. PascalCase for React components. camelCase for functions.

---

## 2. The product, structured

### 2.1 The 11 core ASO tabs (per app view)

Every user has N apps tracked. For each app, these 11 tabs exist:

1. **Overview** — KPI cards (visibility score, rank, rating, reviews count, installs estimate), 30d trend chart, top movers, active alerts
2. **Visibility** — composite visibility score across all 7 surfaces, historical chart, per-surface breakdown
3. **Keywords** — tracked keywords table with rank, volume, difficulty, SoV, trend sparklines; add/remove keywords; bulk import CSV
4. **Competitors** — matrix view of up to 10 competitors × all metrics, head-to-head per keyword, share of voice chart
5. **Reviews** — timeline feed, sentiment score, reply drafter, filter by rating/country/date, export CSV
6. **Optimizer** — current metadata snapshot (title, subtitle, description, keywords field), score, suggested edits, character counts with limits
7. **Store Intel** — editorial features, category rankings, featured placements history, competitor metadata changes
8. **Localization** — per-locale view (up to 40 locales), translation status, per-market rank diffs, gaps to competitors
9. **Update Impact** — version release history, rating/install/review velocity before/after each release
10. **Recommendations** — AI-generated prioritized action list per app, each with rationale + predicted lift
11. **Strategy** — quarterly planning canvas, goals, linked recommendations, progress tracking

### 2.2 The 8 additive modules (global, cross-app)

1. **LLM Tracker** ⭐ wedge — track prompts across ChatGPT, Claude, Gemini, Perplexity, Copilot. Rank, citation sources, SoV
2. **Intent Map** — semantic clustering of keywords into intent groups, gap analysis
3. **Creative Lab** — icon/screenshot/video A/B testing with synthetic + native store tests, auto-rollout
4. **Ad Intel** — competitor ad creatives from Meta Ad Library, TikTok, Apple Search Ads
5. **Attribution** — Bayesian MMM with geo holdouts, per-channel incrementality
6. **Reviews+** — predictive rating risk, auto-routing to Linear/Jira, sentiment cluster webhooks
7. **CPPs** — Custom Product Pages management (iOS only), AI drafting, performance tracking
8. **Agent Readiness** — score your app against OpenAI/Anthropic/Google agent specs, generate manifest files

---

## 3. Tech stack (locked)

### 3.1 Web (`apps/web` and `apps/admin`)
- **Next.js 15** (App Router, React 19)
- **Tailwind CSS v4** + **shadcn/ui** (extended with custom theme matching the "bold" homepage aesthetic — warm paper `#f4f1ea`, ink `#0e0e0c`, cobalt accent `#1d3fd9`, Instrument Serif + Inter Tight + JetBrains Mono)
- **TanStack Query** (React Query) for server state
- **Zustand** for client-only UI state (rare — only for things like command palette open/closed)
- **react-hook-form** + **Zod** for all forms
- **Recharts** for all charts (keeps SVG palette consistent with our design)
- **Lucide React** for icons
- **date-fns** for date handling (NOT dayjs/moment)
- **Stripe.js** loaded client-side for Checkout redirect

### 3.2 Mobile (`apps/mobile`)
- **Expo SDK 55** (runs in Expo Go)
- **Expo Router v5** (file-based routing, mirrors web app structure where sensible)
- **expo-web-browser** for Stripe Checkout redirects (we will NOT use `@stripe/stripe-react-native` — breaks Expo Go)
- **expo-notifications** for push (rating-risk alerts, creative winners)
- **expo-secure-store** for storing Supabase session tokens
- **@supabase/supabase-js** v2 with AsyncStorage adapter
- **react-native-reanimated** v4 (SDK 55 default)
- **react-native-gesture-handler**
- **NativeWind** for styling (Tailwind for RN)
- **Victory Native** or **react-native-svg-charts** for charts (both pure-JS, Expo-compatible)

**Do NOT use:** `react-native-mmkv`, `@react-native-firebase/*`, `@stripe/stripe-react-native`, `react-native-fast-image` (not Expo Go compatible). If you think you need one of these, stop and ask.

### 3.3 Backend
- **Supabase** (Postgres + Auth + Storage + Edge Functions + Realtime)
- **Vercel** (web + admin hosting, API routes for things that can run Edge/Node)
- **Railway** or **Fly.io** (long-running Node workers — scrapers, LLM pollers, MMM jobs)
- **Upstash Redis** (queues, rate-limit counters, cron locks — connects over HTTPS, no TCP)
- **QStash** or **Inngest** (durable cron/jobs — Inngest preferred for DX)
- **Resend** (transactional email)

### 3.4 Worker services (`apps/workers`)
- Node 20, TypeScript
- **BullMQ** for queues, backed by Upstash Redis
- **playwright** for web scraping (headless Chromium)
- **p-queue** for rate-limited concurrent fetches
- **@anthropic-ai/sdk**, **openai**, **@google/generative-ai** for LLM polling
- **sentry** for error tracking

---

## 4. Environment variables

Every env var documented here. Use `@t3-oss/env-nextjs` and `@t3-oss/env-core` to validate at boot time.

### 4.1 Shared
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only
SUPABASE_JWT_SECRET=                 # server only

# Stripe
STRIPE_SECRET_KEY=                   # server only
STRIPE_WEBHOOK_SECRET=               # server only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=                      # server only
RESEND_FROM_EMAIL=

# App
NEXT_PUBLIC_APP_URL=                 # https://app.surface.io (or whatever final domain)
NEXT_PUBLIC_MARKETING_URL=           # https://surface.io
NEXT_PUBLIC_ADMIN_URL=               # https://admin.surface.io

# Upstash
UPSTASH_REDIS_REST_URL=              # server only
UPSTASH_REDIS_REST_TOKEN=            # server only

# Inngest
INNGEST_EVENT_KEY=                   # server only
INNGEST_SIGNING_KEY=                 # server only

# Sentry
SENTRY_DSN=
SENTRY_AUTH_TOKEN=                   # ci only
```

### 4.2 Worker-only
```
# LLM providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
PERPLEXITY_API_KEY=

# Scraping
SCRAPER_PROXY_URL=                   # residential proxy (Bright Data / Oxylabs)
SCRAPER_PROXY_USER=
SCRAPER_PROXY_PASS=

# Optional paid data
APP_STORE_CONNECT_KEY_ID=            # optional — only if you get ASC API access
APP_STORE_CONNECT_ISSUER_ID=
APP_STORE_CONNECT_PRIVATE_KEY=
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=    # optional

# Meta Ad Library
META_GRAPH_API_TOKEN=
```

### 4.3 Mobile-only (EAS secrets for `EXPO_PUBLIC_*`)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=                 # https://app.surface.io
EXPO_PUBLIC_SENTRY_DSN=
```

---

## 5. Supabase — database schema

### 5.1 Core principles
- Every table has `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, and `updated_at timestamptz default now()` with a trigger to auto-update.
- Every table with user data has an `organization_id uuid references organizations(id) on delete cascade`.
- RLS enabled on every table. Policies enforce organization-scoping.
- Foreign keys everywhere. No string-references-id-from-another-table without a proper FK constraint.
- Indexes on every foreign key and every column used in `WHERE` or `ORDER BY` at scale.
- Use Postgres `enum` types for fixed vocabularies (plan tier, alert severity, surface type, etc).

### 5.2 Tables

**Auth & accounts**
- `profiles` — extends `auth.users`, columns: `id (=auth.users.id)`, `full_name`, `avatar_url`, `default_organization_id`
- `organizations` — `id`, `name`, `slug`, `plan_tier` (enum: `solo`, `team`, `enterprise`), `stripe_customer_id`, `stripe_subscription_id`, `trial_ends_at`, `seat_limit`, `app_limit`
- `organization_members` — `id`, `organization_id`, `user_id`, `role` (enum: `owner`, `admin`, `member`, `viewer`)
- `invitations` — `id`, `organization_id`, `email`, `role`, `token`, `expires_at`, `accepted_at`
- `api_keys` — `id`, `organization_id`, `name`, `prefix`, `hashed_key`, `last_used_at`, `created_by`, `revoked_at`

**Apps**
- `apps` — `id`, `organization_id`, `platform` (enum: `ios`, `android`), `store_id` (the App Store or Play Store ID), `name`, `icon_url`, `developer`, `category`, `current_version`, `added_at`, `is_active`
- `app_metadata_snapshots` — `id`, `app_id`, `locale`, `title`, `subtitle`, `description`, `keywords_field`, `promotional_text`, `version`, `snapshot_at`
- `app_rankings_daily` — `id`, `app_id`, `date`, `country`, `category`, `rank_overall`, `rank_category`
- `app_installs_estimate` — `id`, `app_id`, `date`, `country`, `downloads_low`, `downloads_high`

**Keywords**
- `keywords` — `id`, `organization_id`, `app_id`, `text`, `country`, `is_tracked`, `added_at`
- `keyword_ranks_daily` — `id`, `keyword_id`, `date`, `rank`, `impressions_estimate`, `search_volume`, `difficulty`
- `intent_clusters` — `id`, `organization_id`, `name`, `description`, `embedding` (pgvector), `created_at`
- `keyword_cluster_assignments` — `keyword_id`, `cluster_id`, `similarity`

**Competitors**
- `competitors` — `id`, `app_id`, `competitor_app_id`, `added_at`

**Reviews**
- `reviews` — `id`, `app_id`, `store_review_id` (unique per app+platform), `rating`, `title`, `body`, `author`, `country`, `version`, `reviewed_at`, `reply_body`, `reply_at`, `sentiment_score`, `cluster_id`
- `review_clusters` — `id`, `app_id`, `label`, `description`, `volume_7d`, `velocity`, `risk_score`, `predicted_rating_delta`

**LLM Tracker**
- `llm_prompts` — `id`, `organization_id`, `app_id` (nullable — org-level prompts allowed), `text`, `is_active`, `created_at`
- `llm_engines` — static lookup: `chatgpt`, `claude`, `gemini`, `perplexity`, `copilot`
- `llm_poll_runs` — `id`, `prompt_id`, `engine`, `polled_at`, `model_version`, `response_raw`, `response_parsed`, `cited_apps` (jsonb), `sources` (jsonb), `error`
- `llm_visibility_daily` — `id`, `app_id`, `engine`, `date`, `share_of_voice`, `avg_rank`, `prompts_cited`, `prompts_total`

**Surfaces — composite visibility**
- `surface_visibility_daily` — `id`, `app_id`, `surface` (enum: `app_store`, `play_store`, `chatgpt`, `claude`, `gemini`, `perplexity`, `copilot`), `date`, `visibility_score` (0-100), `rank_avg`, `share_of_voice`

**Creative Lab**
- `creative_tests` — `id`, `app_id`, `name`, `asset_type` (enum: `icon`, `screenshot`, `video`, `subtitle`), `status` (enum: `draft`, `synthetic`, `live`, `completed`, `rolled_out`), `started_at`, `ended_at`
- `creative_variants` — `id`, `test_id`, `name`, `asset_url`, `is_control`, `cvr`, `impressions`, `conversions`, `is_winner`

**Attribution**
- `attribution_channels` — `id`, `organization_id`, `name`, `type` (enum: `organic`, `paid_asa`, `paid_meta`, `paid_google`, `paid_tiktok`, `paid_linkedin`, `referral`, `llm_referral`, `content`)
- `attribution_spend_daily` — `channel_id`, `date`, `spend_usd`, `impressions`, `clicks`
- `attribution_installs_daily` — `channel_id`, `app_id`, `date`, `installs`, `attributed_model` (enum: `last_touch`, `mmm`)
- `attribution_mmm_runs` — `id`, `organization_id`, `ran_at`, `config_json`, `results_json`, `holdout_rmse`

**Ad Intel**
- `competitor_ads` — `id`, `competitor_app_id`, `platform` (enum: `meta`, `tiktok`, `apple_search_ads`, `google`), `ad_id`, `first_seen_at`, `last_seen_at`, `creative_url`, `copy`, `landing_url`

**CPPs (iOS only)**
- `custom_product_pages` — `id`, `app_id`, `cpp_id`, `name`, `status`, `screenshots` (jsonb), `short_description`, `cvr`, `impressions`

**Agent Ready**
- `agent_readiness_scans` — `id`, `app_id`, `scanned_at`, `spec_version`, `score`, `checks` (jsonb array of {check, passed, reason})
- `agent_manifests` — `id`, `app_id`, `version`, `manifest_json`, `published_at`

**Alerts & webhooks**
- `alerts` — `id`, `organization_id`, `app_id`, `severity` (enum: `info`, `warning`, `critical`), `type`, `title`, `body`, `data` (jsonb), `created_at`, `read_at`, `resolved_at`
- `webhook_endpoints` — `id`, `organization_id`, `url`, `events` (text array), `secret`, `is_active`, `created_at`, `last_delivery_at`
- `webhook_deliveries` — `id`, `endpoint_id`, `event_id`, `attempt`, `response_status`, `response_body`, `delivered_at`

**Integrations**
- `integrations` — `id`, `organization_id`, `provider` (enum: `linear`, `jira`, `slack`, `segment`, `datadog`, `github`), `config` (jsonb), `credentials_encrypted`, `is_active`

**Billing & usage**
- `usage_events` — `id`, `organization_id`, `event_type`, `metadata` (jsonb), `quantity`, `occurred_at` (used for both analytics and metered billing)
- `stripe_events` — `id`, `stripe_event_id` (unique), `type`, `payload` (jsonb), `processed_at` (idempotency log for webhook handler)

### 5.3 RLS policy template

Every user-scoped table gets this policy pattern:

```sql
-- SELECT: member of org can read
CREATE POLICY "select_own_org" ON <table> FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: member of org can write
CREATE POLICY "insert_own_org" ON <table> FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
    )
  );

-- UPDATE/DELETE: role gate
CREATE POLICY "update_own_org" ON <table> FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin','member')
    )
  );

CREATE POLICY "delete_own_org" ON <table> FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  );
```

### 5.4 Generated types

Use `supabase gen types typescript --project-id=<id>` in a pnpm script. Output to `packages/db/src/generated.ts`. Re-run on every migration.

---

## 6. Data acquisition — the scraping + LLM polling pipeline

This is the part with the most risk. Everything here lives in `apps/workers`.

### 6.1 App Store scraping (iOS)
- Use iTunes Search API (public, no auth) for basic app info
- Use scraped rankings from `ios-app-store-scraper` (npm) where possible
- Keyword ranks: run rank-checker on proxy, rotated IPs, country-specific
- Reviews: RSS feed from `itunes.apple.com/<country>/rss/customerreviews/id=<id>/json` — poll every 6h
- Respect rate limits. Minimum 1 request per IP per 2 seconds. Use residential proxy pool.

### 6.2 Play Store scraping
- Use `google-play-scraper` npm package for app info, reviews, rankings
- Same proxy rotation rules
- Poll every 6h

### 6.3 LLM polling — the wedge
This is the most important worker. It runs every 6 hours and polls each active prompt against each engine.

**For each (prompt, engine) tuple:**
1. Send the prompt verbatim — no system prompt manipulation
2. For each response, parse out app recommendations (app names, store links, bundle IDs)
3. Store raw response + parsed structure
4. Update `llm_visibility_daily` aggregates

**Engine adapters:**
- `chatgpt` — use OpenAI Responses API, `gpt-5` or current default, with web-search tool enabled
- `claude` — Anthropic Messages API with web-search tool, model `claude-opus-4-7`
- `gemini` — Google Generative AI, `gemini-2.5-pro` with Google Search grounding
- `perplexity` — Perplexity API (`sonar-pro` or current model)
- `copilot` — no official API yet. Mark as "coming soon" in the UI until we get access. Create the table and adapter stub but don't poll.

**Parsing app recommendations:** use a structured-output LLM call (claude-sonnet-4-6, JSON mode) to convert free-text responses into `[{app_name, platform?, store_url?, bundle_id?, rank_in_response}]`. Log the parsing cost.

### 6.4 Ad intel
- Meta Ad Library Graph API: requires token, poll daily per competitor
- TikTok Creative Center: scrape with playwright
- Apple Search Ads: no public data — mark as "connect ASA account" integration only

### 6.5 Queue architecture
Inngest functions, each triggered by a schedule:
- `scrape.app_store.metadata` — every 24h
- `scrape.app_store.rankings` — every 6h
- `scrape.app_store.reviews` — every 6h
- `scrape.play_store.metadata` — every 24h
- `scrape.play_store.rankings` — every 6h
- `scrape.play_store.reviews` — every 6h
- `llm.poll_prompts` — every 6h, fans out per (prompt, engine)
- `attribution.run_mmm` — weekly per organization, or on-demand
- `reviews.cluster_and_score` — every 2h (runs sentiment + clustering over new reviews)
- `alerts.dispatch` — every 5 min, checks for new alert conditions, sends webhooks + push

Each worker function must be idempotent and safe to retry.

### 6.6 Error policy
- Every scraper run logs to `worker_runs` table: `started_at`, `ended_at`, `status`, `error_message`, `records_processed`
- Slack alert on any run that fails 3 times in a row
- On 429 / CAPTCHA: back off exponentially, rotate proxy, never retry more than 5 times per job

---

## 7. API surface (`apps/web/app/api/*` on Vercel)

All API routes use Zod for validation and return `{ ok: true, data } | { ok: false, error: { code, message } }`.

### 7.1 Resource endpoints
- `GET /api/apps` — list user's apps
- `POST /api/apps` — add a new app (body: `{ platform, store_id }`), triggers initial scrape
- `DELETE /api/apps/:id`
- `GET /api/apps/:id/overview` — hydrated overview payload
- `GET /api/apps/:id/keywords`
- `POST /api/apps/:id/keywords` — body: `{ keywords: string[] }`
- `DELETE /api/apps/:id/keywords/:keywordId`
- `GET /api/apps/:id/reviews?cursor=&limit=&filter=`
- `POST /api/apps/:id/reviews/:reviewId/reply` — drafts a reply via LLM, user edits, submits
- `GET /api/apps/:id/competitors`
- `POST /api/apps/:id/competitors` — body: `{ competitor_app_store_id }`
- `GET /api/apps/:id/metadata` — current metadata snapshot
- `POST /api/apps/:id/metadata/suggest` — Optimizer: LLM-suggested edits based on low-ranking keywords

### 7.2 Global modules
- `GET /api/llm/prompts`
- `POST /api/llm/prompts` — body: `{ text, app_id? }`
- `GET /api/llm/visibility?prompt_id=&engine=&from=&to=`
- `POST /api/llm/run-now` — trigger immediate re-poll (rate limited: 1/min per org)
- `GET /api/intent/clusters`
- `POST /api/intent/cluster` — trigger re-clustering job
- `GET /api/creative/tests`
- `POST /api/creative/tests`
- `GET /api/attribution/runs`
- `POST /api/attribution/runs` — trigger MMM (long-running, returns job id)
- `GET /api/agent/score?app_id=`
- `POST /api/agent/manifest?app_id=` — generates and returns manifest JSON

### 7.3 Account / billing
- `GET /api/org` — current org + member list + plan
- `POST /api/org/invite` — body: `{ email, role }`
- `POST /api/billing/checkout` — body: `{ plan: 'solo' | 'team' | 'enterprise', cycle: 'monthly' | 'annual' }` → returns Stripe Checkout URL
- `POST /api/billing/portal` → returns Stripe Customer Portal URL
- `POST /api/billing/webhook` — Stripe webhook handler (verify signature, idempotent via `stripe_events` table)

### 7.4 Webhooks (for customers to consume our events)
- `GET /api/webhooks/endpoints`
- `POST /api/webhooks/endpoints` — body: `{ url, events: string[] }`
- `DELETE /api/webhooks/endpoints/:id`
- `GET /api/webhooks/deliveries?endpoint_id=`
- `POST /api/webhooks/:id/resend/:deliveryId`

### 7.5 Admin-only (`apps/admin`)
- `GET /api/admin/stats` — MRR, ARR, churn, funnel counts
- `GET /api/admin/accounts?filter=&cursor=`
- `POST /api/admin/accounts/:id/impersonate` — generates short-lived JWT, audit-logged
- `GET /api/admin/incidents`
- `POST /api/admin/feature-flags/:key` — body: `{ value, percentage }`

---

## 8. Auth flow

### 8.1 Web
1. User hits marketing site, clicks "Start free trial"
2. Routes to `/signup` on `app.surface.io` (same Next app, different route)
3. Signup form: email + password + full name → Supabase `signUp`
4. On success, email verification link goes out (Supabase default + custom Resend template)
5. After verify, user hits `/onboarding` — create first org, pick plan (14-day trial, no card required for Solo/Team)
6. Onboarding step 2: add first app (App Store URL or Play Store URL paste)
7. Onboarding step 3: add first keywords (suggested keywords from app metadata)
8. Onboarding step 4: connect first LLM prompt (seeded suggestion based on app category)
9. Redirect to `/app/:appSlug/overview`

### 8.2 Mobile
- Email/password sign in via `supabase-js` with `AsyncStorage` session persistence
- Deep link support for email verification (Expo Linking)
- After login, users land on the Today/Home screen
- Subscription purchase must redirect to web via `expo-web-browser` (no native Stripe) — after redirect back, re-fetch org state

---

## 9. Billing — Stripe integration

### 9.1 Product setup (do this manually in Stripe Dashboard OR via script)
- Product: "Surface Solo" — monthly $49, annual $490
- Product: "Surface Team" — monthly $290, annual $2900
- Product: "Surface Enterprise" — custom, created per contract by admin

### 9.2 Checkout flow
- `POST /api/billing/checkout` creates a Stripe Checkout Session with `mode: 'subscription'`, `trial_period_days: 14` for Solo/Team
- Success URL: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `${APP_URL}/billing/cancel`
- Success page verifies the session, updates `organizations.stripe_subscription_id`

### 9.3 Webhook events to handle (always idempotent)
- `customer.subscription.created` — set plan_tier, trial_ends_at, seat_limit, app_limit
- `customer.subscription.updated` — update plan_tier on change
- `customer.subscription.deleted` — downgrade to `cancelled` state, grace period 7 days
- `invoice.payment_failed` — flag org as `payment_failed`, email admin
- `invoice.payment_succeeded` — reset payment flags

### 9.4 Plan limits enforcement
A server-side helper `enforceLimit(orgId, limitType)` that checks current counts against `plan_tier` limits. Called before inserting into `apps`, `keywords`, `llm_prompts`, etc. Returns structured error `{ code: 'LIMIT_REACHED', limit_type, current, max, upgrade_url }` — UI surfaces this as an upgrade modal.

**Limits per plan:**
| Limit | Solo | Team | Enterprise |
|-------|------|------|------------|
| Apps | 1 | 10 | unlimited |
| Keywords | 500 | unlimited | unlimited |
| LLM prompts | 25 | 200 | unlimited |
| Seats | 1 | 5 | unlimited |
| API calls/mo | 10K | 250K | unlimited |

---

## 10. Web app — page inventory

Every page rendered with real data from Supabase via TanStack Query. Loading states are skeletons, not spinners. Empty states have illustrations + CTA.

### 10.1 Marketing site (`apps/web` at root route group `(marketing)`)
- `/` — the "bold" homepage we just built
- `/compare/apptweak`, `/compare/sensor-tower`, `/compare/appfollow` — SEO compare pages
- `/use-cases/agencies`, `/use-cases/indie-devs`, `/use-cases/enterprise`
- `/docs/*` — docs site (use Fumadocs or Nextra)
- `/changelog` — reads from a Supabase `changelog_entries` table edited via admin
- `/pricing`
- `/about`, `/careers`, `/customers`
- `/privacy`, `/terms`, `/security`, `/dpa`

### 10.2 App (`apps/web` route group `(app)` — requires auth, hostname `app.surface.io`)
- `/app` — app picker / org overview
- `/app/:appSlug/overview`
- `/app/:appSlug/visibility`
- `/app/:appSlug/keywords`
- `/app/:appSlug/competitors`
- `/app/:appSlug/reviews`
- `/app/:appSlug/optimizer`
- `/app/:appSlug/store-intel`
- `/app/:appSlug/localization`
- `/app/:appSlug/update-impact`
- `/app/:appSlug/recommendations`
- `/app/:appSlug/strategy`
- `/llm-tracker` (global)
- `/intent-map` (global)
- `/creative-lab` (global)
- `/ad-intel` (global)
- `/attribution` (global)
- `/reviews-plus` (global)
- `/cpps` (global, iOS apps only)
- `/agent-ready` (global)
- `/settings/profile`
- `/settings/organization`
- `/settings/members`
- `/settings/api-keys`
- `/settings/webhooks`
- `/settings/integrations`
- `/settings/billing`

### 10.3 Admin (`apps/admin` at `admin.surface.io` — restricted to users with `is_superuser=true` in profiles)
10 pages from the admin dashboard I built — Overview, Revenue, Cohorts, Funnel, Churn, Usage, Features, Accounts, Infra, Incidents, Activity. All reading live from Supabase + Stripe + Upstash.

---

## 11. Mobile app — screen inventory

Mirrors the 5 screens from the iOS mockup. Expo Router structure:

```
apps/mobile/src/app/
├── (auth)/
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   └── verify.tsx
├── (tabs)/
│   ├── _layout.tsx              # Native Tabs API
│   ├── today.tsx                # 01 · Today / Home
│   ├── llm.tsx                  # 02 · LLM Tracker
│   ├── keywords.tsx             # 03 · Keywords
│   └── reviews.tsx              # 04 · Reviews+
├── settings.tsx
├── upgrade.tsx                  # opens Stripe via expo-web-browser
└── _layout.tsx                  # root stack, handles auth redirect
```

Push notifications (expo-notifications):
- `rating_risk_critical` — when a review cluster crosses risk threshold
- `creative_winner` — when a Creative Lab test concludes
- `llm_visibility_drop` — when share of voice drops >20% day-over-day
- `rank_movement` — daily digest (opt-in)

---

## 12. Design system

Colors, typography, spacing — use exactly what's in the homepage / dashboard mockups. Create `packages/ui-web/src/theme.ts` with all tokens.

**Critical:** the CSS variables from the mockups (`--paper`, `--ink`, `--accent`, etc.) are the canonical tokens. Put them in a Tailwind theme extension. Do NOT invent new colors.

Fonts: load Instrument Serif, Inter Tight, JetBrains Mono via `next/font` (web) and `expo-font` (mobile, bundled from `@expo-google-fonts/*`).

---

## 13. Testing policy

- **Unit tests (Vitest):** every utility function, every Zod schema, every Stripe webhook handler case
- **Integration tests (Vitest + Supabase local):** every API route against a seeded local Supabase
- **E2E (Playwright):** the critical flows — signup → onboarding → add app → see data; subscription upgrade; webhook delivery
- **Coverage target:** 70%+ on `packages/*`, 50%+ on `apps/web/app/api/*`

Run `pnpm test` in CI on every PR. Block merge on failure.

---

## 14. Observability

- **Sentry** on web, admin, mobile, workers — auto source-map upload in CI
- **Axiom** or **Logtail** for structured logs — `logger.info({ orgId, userId, event }, 'message')` pattern
- **Uptime Robot** or **Better Stack** pinging `/api/health` every minute
- `/api/health` returns 200 if Supabase query succeeds + Redis ping succeeds, else 503

---

## 15. CI/CD

- **GitHub Actions:** lint, typecheck, test, build on every PR
- **Vercel preview deploys** for every PR branch on `apps/web` and `apps/admin`
- **EAS Update** for mobile OTA updates on merge to `main` (`eas update --branch production`)
- **Worker deploys:** auto-deploy `apps/workers` to Railway on merge to `main`
- **Supabase migrations:** `supabase db push` in a dedicated GitHub Action, runs only on merge to `main`, gated on manual approval for prod
- **Preview databases:** every PR gets a branched Supabase database (Supabase branching, GA)

---

## 16. Build order — weeks 1-14

This is the **order you must build in**. Do not jump ahead. Each milestone is demoable at the end.

### Week 1 — Foundation
- Monorepo scaffolding, Turborepo, pnpm workspaces
- `packages/config` with shared tsconfig/eslint/prettier
- `apps/web` Next.js 15 skeleton with the marketing site from `surface-home-bold.html` ported to React
- Vercel deploy working on a placeholder domain
- Supabase project created, first migration: `profiles`, `organizations`, `organization_members`, `invitations`
- Supabase Auth working on web (email/password + magic link)

### Week 2 — Apps + Keywords (core ASO, local data only)
- Migrations for `apps`, `keywords`, `keyword_ranks_daily`, `reviews`, `competitors`
- API routes for apps CRUD, keywords CRUD
- Onboarding flow (add first app by pasting App Store URL → parse with iTunes Search API → insert row)
- App picker + Overview page + Keywords page with empty states (no scraped data yet)
- TanStack Query wired up

### Week 3 — First scraper + workers
- `apps/workers` Node service on Railway
- Inngest wired up
- App Store scraper: metadata + rankings + reviews
- Play Store scraper: metadata + rankings + reviews
- Data shows up in Overview, Keywords, Reviews pages (no more empty states!)

### Week 4 — LLM Tracker (the wedge) ⭐
- Migrations for `llm_prompts`, `llm_poll_runs`, `llm_visibility_daily`
- Engine adapters: ChatGPT, Claude, Gemini, Perplexity (Copilot stub)
- LLM Tracker page (desktop) — prompts list, per-engine SoV, citation sources
- Inngest cron running every 6h per active prompt

### Week 5 — Billing
- Stripe products set up
- Checkout + Customer Portal + Webhook handler
- Plan limits enforcement helper
- Settings → Billing page
- Upgrade modals triggered by `LIMIT_REACHED` errors

### Week 6 — Remaining core tabs (Competitors, Optimizer, Store Intel)
- Competitors page with matrix view
- Optimizer with LLM suggestion endpoint
- Store Intel (editorial features from scraper enrichment)

### Week 7 — Localization, Update Impact, Recommendations, Strategy
- All 4 remaining core tabs complete
- Recommendations engine (LLM-powered)

### Week 8 — Intent Map + Creative Lab skeleton
- Keyword clustering (pgvector + embedding via Voyage or OpenAI)
- Intent Map visualization (force-directed with recharts or d3)
- Creative Lab upload + synthetic test endpoints (real native store experiments phase 2)

### Week 9 — Ad Intel + Reviews+ (prediction)
- Meta Ad Library integration
- TikTok Creative Center scraper
- Reviews+ prediction model (simple logistic regression on cluster features, or Claude API)
- Auto-routing to Linear/Jira (integration config in Settings)

### Week 10 — Attribution (MMM)
- Bayesian MMM worker (use `lightweight_mmm` Python or a Node equivalent — if Python, spin up a small FastAPI service on Fly)
- Attribution page with charts

### Week 11 — CPPs + Agent Readiness
- CPPs management for iOS apps
- Agent Readiness scanner + manifest generator

### Week 12 — Mobile app
- Expo SDK 55 setup, EAS configured
- Auth flow in mobile (email/password, deep link)
- 5 screens: Today, LLM, Keywords, Reviews+, Settings
- Push notifications
- Upgrade flow via `expo-web-browser` → Stripe Checkout

### Week 13 — Admin dashboard
- All 10 admin pages wired to live data
- Impersonation + audit logging
- Incident management

### Week 14 — Polish + launch prep
- E2E tests for critical flows
- Sentry + Axiom + uptime monitoring all green
- Full accessibility pass
- Load testing on LLM poller (can we handle 10K prompts?)
- Soft launch to 10 beta customers

---

## 17. What NOT to build in v1

Explicitly out of scope — do not pre-build these even if tempting:

- White-labeling for agencies (phase 2)
- Mobile app for Android (iOS first, Android next quarter)
- Native Stripe SDK integration (always use web redirect from mobile)
- Browser extension
- Slack app (use webhook integration instead)
- Public API marketplace / app
- GraphQL (REST is enough for v1)
- Real-time collaboration (Liveblocks, Yjs) — no multiplayer cursors
- Custom dashboard builder
- Self-hosted / on-prem deployment
- SSO (phase 2, Enterprise tier only anyway)

---

## 18. Before you start coding — ACK this checklist

Claude Code, before you touch any file, confirm out loud:

1. ☐ You understand no hardcoded/mock data in runtime paths
2. ☐ You will install Expo SDK 55 exactly and no native-only packages in `apps/mobile`
3. ☐ You will use Stripe Checkout via browser redirect from mobile (not native Stripe SDK)
4. ☐ You will generate TypeScript types from Supabase after every migration
5. ☐ You will enable RLS on every user-scoped table
6. ☐ You will follow the 14-week build order and not jump ahead
7. ☐ You will ask clarifying questions before making architectural decisions not in this doc

---

## Appendix A — File/package name to update when final brand lands

When the name is finalized, global-replace these tokens:

- `Surface` → final display name
- `surface` → final lowercase slug
- `surface.io` → final domain
- `@surface/*` package scopes → new scope
- Stripe product names → new brand
- Logo assets in `packages/ui-web/src/assets/logo/` and `packages/ui-mobile/src/assets/logo/`

## Appendix B — Domain & name decision log

Pending. Current shortlist under review:
1. Overtly (`overtly.app` / `getovertly.com`)
2. Visibl (`visibl.app`)
3. Surface (`surfaceaso.com` / `getsurface.com`)
4. Beacon (`usebeacon.app`)

Once locked, update `package.json` names, app.json slugs, all env vars, all brand strings.
