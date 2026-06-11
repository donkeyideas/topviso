/**
 * Build-our-own volume + difficulty signals (Phase 6).
 *
 * Replaces the pure heuristics in keyword-enrichment.ts with calculations
 * derived from data we either already scrape (top SERP) or can scrape
 * cheaply (auto-complete, Trends).
 *
 * Volume confidence tiers:
 *   real      — Apple Search Ads (iOS), official Apple-reported volume bucket
 *   modeled   — Android blend of auto-complete position + Google Trends +
 *               our own corpus co-occurrence
 *   estimated — pure heuristic from word count + niche. Fallback only.
 *
 * Difficulty is always 'modeled' or better — we have enough SERP data to
 * skip the heuristic. The 'estimated' tier exists only as a defensive
 * fallback for the moment when topResults is empty.
 */

import gplay from 'google-play-scraper'

// ============================================================
// DIFFICULTY — derived from top-50 SERP data we already scrape
// ============================================================

interface TopResultLite {
  appId: string
  title: string
  developer?: string
  score?: number       // rating 0-5
  installs?: string    // raw Play string like "10,000,000+"
}

/**
 * Compute a 0-100 difficulty score from the actual top SERP.
 *
 * Rationale:
 *   - More serious apps in the top 10 → harder to break in
 *   - Higher average install count of the top 10 → harder
 *   - Higher average rating of the top 10 → harder (good comps win)
 *   - Big brand names present → much harder
 *
 * The output is intentionally bucketed (5/15/30/45/60/75/90) so users see
 * round numbers instead of false precision. Anything more granular than
 * that pretends we measured what we didn't.
 */
export function computeDifficultyFromSerp(
  topResults: TopResultLite[] | undefined,
): { difficulty: number; confidence: 'modeled' | 'estimated' } {
  if (!topResults || topResults.length === 0) {
    return { difficulty: 30, confidence: 'estimated' }
  }

  const top10 = topResults.slice(0, 10)
  const seriousCount = top10.filter((r) => parseInstalls(r.installs) >= 10000 || (r.score ?? 0) >= 4.0).length
  const avgInstalls = avg(top10.map((r) => parseInstalls(r.installs)))
  const avgRating = avg(top10.map((r) => r.score ?? 0).filter((v) => v > 0))

  // Brand presence — well-known apps in the top 10 means we're competing
  // against budgets and back-catalogues we can't match.
  const brandTokens = ['netflix', 'spotify', 'youtube', 'tiktok', 'instagram', 'facebook', 'whatsapp', 'amazon', 'google', 'apple', 'microsoft', 'espn', 'nba', 'nfl', 'mlb', 'disney']
  const brandHits = top10.filter((r) => brandTokens.some((t) => r.title.toLowerCase().includes(t) || (r.developer ?? '').toLowerCase().includes(t))).length

  // Composite — weights chosen to keep difficulty centered around 30-60 for
  // typical SERPs and let extreme cases (FAANG-dominated) push into 80-90.
  let raw = 0
  raw += (seriousCount / 10) * 35          // 0-35 from "how many serious apps"
  raw += Math.min(avgInstalls / 1_000_000, 25)  // 0-25 from install scale, log-ish
  raw += Math.min((avgRating - 3.5) * 10, 15)   // 0-15 from rating
  raw += brandHits * 5                          // +5 per brand, uncapped (rare)

  const bucketed = bucketDifficulty(Math.max(5, Math.min(95, Math.round(raw))))
  return { difficulty: bucketed, confidence: 'modeled' }
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function parseInstalls(raw?: string): number {
  if (!raw) return 0
  const cleaned = raw.replace(/[,+]/g, '').trim().toLowerCase()
  const m = cleaned.match(/^([\d.]+)\s*([kmb])?$/)
  if (!m) return parseInt(cleaned, 10) || 0
  const n = parseFloat(m[1] ?? '0')
  const unit = m[2]
  if (unit === 'k') return n * 1_000
  if (unit === 'm') return n * 1_000_000
  if (unit === 'b') return n * 1_000_000_000
  return n
}

function bucketDifficulty(d: number): number {
  if (d < 10) return 5
  if (d < 22) return 15
  if (d < 37) return 30
  if (d < 52) return 45
  if (d < 67) return 60
  if (d < 82) return 75
  return 90
}

// ============================================================
// iOS VOLUME — Apple Search Ads API
// ============================================================

/**
 * Apple Search Ads exposes per-keyword search popularity buckets (1-5) via
 * the Keyword Boost / Recommendations endpoints. The full integration needs
 * OAuth with a private key + JWT signing.
 *
 * For now this is a stub that returns 'estimated' when ASA env vars are
 * missing. Once env vars are set, the stub's body should:
 *   1. Sign a JWT with the team's private key
 *   2. POST /api/v5/keywords/searchVolume with the keyword + country
 *   3. Parse `searchVolume` (1=lowest, 5=highest) and map to numeric range
 *
 * Mapping (Apple's internal calibration approximation):
 *   1 → ~500       2 → ~2000      3 → ~7000
 *   4 → ~25000     5 → ~80000
 */
export async function fetchAppleSearchVolume(
  keyword: string,
  country: string = 'us',
): Promise<{ volume: number; confidence: 'real' | 'estimated' } | null> {
  const clientId = process.env.ASA_CLIENT_ID
  const teamId = process.env.ASA_TEAM_ID
  const keyId = process.env.ASA_KEY_ID
  const privateKey = process.env.ASA_PRIVATE_KEY
  if (!clientId || !teamId || !keyId || !privateKey) {
    // Not configured — caller should fall back to heuristic.
    return null
  }

  // TODO: implement JWT + API call. Stubbed here so deployment never breaks.
  // When implementing:
  //   - Use 'jsonwebtoken' to sign ES256 JWT with privateKey
  //   - claim: { aud: 'https://appleid.apple.com', iss: teamId, sub: clientId }
  //   - exchange JWT for access token at https://appleid.apple.com/auth/oauth2/token
  //   - call https://api.searchads.apple.com/api/v5/keyword-boost/searchVolume
  console.warn('[keyword-intelligence] ASA configured but stub not yet implemented:', { keyword, country })
  return null
}

const ASA_BUCKET_TO_VOLUME: Record<number, number> = {
  1: 500,
  2: 2_000,
  3: 7_000,
  4: 25_000,
  5: 80_000,
}

export function mapAsaBucketToVolume(bucket: number): number {
  return ASA_BUCKET_TO_VOLUME[bucket] ?? 0
}

// ============================================================
// ANDROID VOLUME — auto-complete + Trends + corpus blend
// ============================================================

/**
 * Google Play auto-complete signal.
 *
 * If "social debating" appears in the suggestions for "social deb", that's
 * real evidence the term has search volume. Position 1 = highest signal.
 * Returns the keyword's position in suggestions, or -1 if absent.
 */
export async function autocompleteRank(
  keyword: string,
  country: string = 'us',
): Promise<number> {
  try {
    // gplay.suggest only takes a prefix. We send progressively longer prefixes
    // so the auto-complete list returned is the one a real user typing the
    // keyword would see.
    const prefix = keyword.slice(0, Math.max(3, Math.floor(keyword.length * 0.6)))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = await (gplay as any).suggest({ term: prefix, lang: 'en', country })
    if (!Array.isArray(out)) return -1
    const idx = out.findIndex((s: unknown) => String(s).toLowerCase().includes(keyword.toLowerCase()))
    return idx
  } catch {
    return -1
  }
}

/**
 * Google Trends relative interest 0-100 for a keyword over the last 90 days.
 *
 * Trends data is NOT app-store-specific — it's web search — but mobile-app
 * search intent on Play tends to track web search intent for the same
 * keyword closely enough to be a useful blend input.
 *
 * Uses dynamic import so the dependency stays optional. If
 * google-trends-api isn't installed, this returns null and the blend
 * gracefully degrades.
 */
export async function trendsInterest(
  keyword: string,
  country: string = 'US',
): Promise<number | null> {
  try {
    // Dynamic import keeps google-trends-api an optional dependency. If it's
    // not installed, the blend silently degrades to autocomplete-only.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await (Function('m', 'return import(m)') as (s: string) => Promise<unknown>)('google-trends-api').catch(() => null)
    if (!mod) return null
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const raw = await mod.default.interestOverTime({
      keyword,
      startTime: ninetyDaysAgo,
      geo: country.toUpperCase(),
    })
    const parsed = JSON.parse(raw)
    const series = parsed?.default?.timelineData ?? []
    if (!series.length) return null
    const vals = series.map((p: { value?: number[] }) => p.value?.[0] ?? 0)
    return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length)
  } catch {
    return null
  }
}

/**
 * Blended Android volume estimate.
 *
 *   final = base × autocompleteMult × trendsMult × corpusMult
 *
 * base — the heuristic (word count + niche). Provides shape when other
 *        signals are missing.
 * autocompleteMult — 1.5× if keyword shows up in top 3 suggestions, 1.2×
 *        if top 10, 1× otherwise. Strong "this is a real search" signal.
 * trendsMult — derived from 0-100 Trends interest. 1.5× at 100, 1× at 50,
 *        0.5× at 0.
 * corpusMult — 1.2× if this keyword appears in N≥3 competitors' tracked
 *        set on our platform (more competitors = more demand).
 *
 * Confidence tier:
 *   'modeled' when autocomplete OR trends returned signal
 *   'estimated' when both failed (pure heuristic)
 */
export async function modelAndroidVolume(
  keyword: string,
  baseHeuristic: number,
  country: string = 'us',
  corpusCompetitorCount: number = 0,
): Promise<{ volume: number; confidence: 'modeled' | 'estimated' }> {
  const [acIdx, trends] = await Promise.all([
    autocompleteRank(keyword, country),
    trendsInterest(keyword, country),
  ])

  let mult = 1
  let signals = 0

  if (acIdx >= 0) {
    if (acIdx < 3) mult *= 1.5
    else if (acIdx < 10) mult *= 1.2
    signals++
  }

  if (trends != null) {
    // 1.5x at 100, 1x at 50, 0.5x at 0 — linear
    mult *= 0.5 + (trends / 100)
    signals++
  }

  if (corpusCompetitorCount >= 3) mult *= 1.2

  const volume = Math.max(50, Math.round((baseHeuristic * mult) / 10) * 10)
  return {
    volume,
    confidence: signals > 0 ? 'modeled' : 'estimated',
  }
}
