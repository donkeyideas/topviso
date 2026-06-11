import { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchGooglePlayData,
  fetchGooglePlayReviews,
  fetchAppleAppData,
  checkKeywordRanking,
  checkKeywordRankingIOS,
  searchApps,
  searchAppsIOS,
  fetchSimilarApps,
  fetchSimilarAppsIOS,
  fetchAppleAppReviews,
  fetchCategoryTopApps,
  fetchAppleCategoryTopApps,
  type StoreAppData,
  type StoreReview,
  type KeywordRankResult,
} from './store-scraper'
import {
  calculateVisibilityScore,
  calculateASOScore,
  computeVisibilityTrend,
  scoresToSvgPath,
  type ASOScoreResult,
} from './aso-scoring'
import { estimateKeywordMetrics } from './keyword-enrichment'
import { computeDifficultyFromSerp } from './keyword-intelligence'
import { getPositionWeight } from './aso-scoring'
import { getDeepSeekClient } from './deepseek'

interface AppRow {
  id: string
  organization_id: string
  platform: 'ios' | 'android'
  store_id: string
  name: string
  target_keywords?: string[] | null
  optimization_goal?: string | null
  category?: string | null
}

export interface SyncResult {
  storeData: StoreAppData | null
  keywords: Array<{ keyword: string; position: number | null }>
  reviews: StoreReview[]
  competitors: Array<{
    appId: string
    title: string
    score: number
    overlapCount: number
    sharedKeywords: string[]
  }>
  visibilityScore: number | null
  asoScore: ASOScoreResult | null
}

export async function runFullSync(
  supabase: SupabaseClient,
  app: AppRow,
): Promise<SyncResult> {
  // Step 1: Fetch real store data
  const storeData =
    app.platform === 'android'
      ? await fetchGooglePlayData(app.store_id)
      : await fetchAppleAppData(app.store_id)

  // Step 2: Persist metadata
  if (storeData) {
    await persistStoreMetadata(supabase, app, storeData)
  }

  // Step 3: Fetch reviews (platform-aware)
  let reviews: StoreReview[] = []
  if (app.platform === 'android') {
    reviews = await fetchGooglePlayReviews(app.store_id, 100)
  } else {
    reviews = await fetchAppleAppReviews(app.store_id, 'us')
  }
  if (reviews.length > 0) {
    await persistReviews(supabase, app.id, reviews)
  }

  // Step 4: Generate + check keywords (platform-aware, with SerpAPI primary on Android)
  const keywordSuggestions = await generateKeywordSuggestions(app, storeData)
  const rankings = await batchCheckKeywordRankingsUnified(
    keywordSuggestions,
    app.store_id,
    app.platform,
    'us',
  )
  await persistKeywords(supabase, app, rankings)

  // Step 5: Discover competitors
  const competitors = await discoverCompetitors(app, rankings)

  // Step 6: Calculate scores (volume-weighted for accuracy)
  const visibilityScore = calculateVisibilityScore(
    rankings.map((r) => {
      const metrics = estimateKeywordMetrics(r.keyword, app.platform)
      return { position: r.position, searchVolume: metrics.volume }
    }),
  )

  const asoScore = storeData
    ? calculateASOScore({
        title: storeData.title,
        subtitle: null,
        description: storeData.description,
        rating: storeData.score,
        ratingsCount: storeData.ratings,
        hasScreenshots: (storeData.screenshots?.length ?? 0) > 0,
        screenshotCount: storeData.screenshots?.length ?? 0,
        platform: app.platform,
      })
    : null

  // Step 7: Write analysis_results entries
  await writeAnalysisResults(supabase, app, {
    storeData,
    rankings,
    reviews,
    competitors,
    visibilityScore,
    asoScore,
  })

  return {
    storeData,
    keywords: rankings,
    reviews,
    competitors,
    visibilityScore,
    asoScore,
  }
}

// --- Private helpers ---

async function persistStoreMetadata(
  supabase: SupabaseClient,
  app: AppRow,
  data: StoreAppData,
) {
  // Update apps table
  await supabase
    .from('apps')
    .update({
      name: data.title,
      icon_url: data.icon,
      developer: data.developer,
      category: data.genre,
      current_version: data.version,
    })
    .eq('id', app.id)

  // Insert metadata snapshot with full store data
  await supabase.from('app_metadata_snapshots').insert({
    app_id: app.id,
    title: data.title,
    subtitle: data.summary ?? null,
    description: data.description,
    version: data.version,
    snapshot_at: new Date().toISOString(),
    metadata: {
      score: data.score,
      ratings: data.ratings,
      reviews: data.reviews,
      installs: data.installs,
      minInstalls: data.minInstalls,
      maxInstalls: data.maxInstalls,
      genre: data.genre,
      genreId: data.genreId,
      developer: data.developer,
      icon: data.icon,
      screenshots: data.screenshots,
      updated: data.updated,
      released: data.released,
      price: data.price,
      free: data.free,
    },
  })

  // Persist install estimates from store data
  if (data.minInstalls != null) {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('app_installs_estimate').upsert(
      {
        app_id: app.id,
        date: today,
        country: 'US',
        downloads_low: data.minInstalls,
        downloads_high: data.maxInstalls ?? data.minInstalls * 2,
      },
      { onConflict: 'app_id,date,country' },
    )
  }
}

async function persistReviews(
  supabase: SupabaseClient,
  appId: string,
  reviews: StoreReview[],
) {
  const rows = reviews.map((r) => ({
    app_id: appId,
    store_review_id: r.id,
    rating: r.score,
    title: null,
    body: r.text,
    author: r.userName,
    country: 'US',
    version: r.version ?? null,
    reviewed_at: r.date || null,
    reply_body: r.replyText ?? null,
    reply_at: r.replyDate ?? null,
  }))

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50)
    await supabase
      .from('reviews')
      .upsert(batch, { onConflict: 'app_id,store_review_id' })
  }
}

function buildKeywordSystemPrompt(platform: 'ios' | 'android'): string {
  if (platform === 'android') {
    return [
      'You are a Google Play ASO keyword expert.',
      'Google Play has NO dedicated keywords field — ranking is driven by the title, short description, and long description.',
      'Google Play queries skew more conversational and long-tail than the App Store ("how to track sleep" vs "sleep tracker").',
      'Mix short head terms (1 word) and long-tail phrases (3-5 words). Prefer natural-language phrases over comma-separated tokens.',
      'Include intent variants (what users TYPE on Android), not iOS jargon like "shortcuts" or "siri".',
      'Return ONLY a JSON array of 18 keyword strings. No explanations, no preamble, no markdown.',
    ].join(' ')
  }
  return [
    'You are an Apple App Store ASO keyword expert.',
    'The App Store has a hidden 100-character keywords field plus the title and subtitle. Ranking favors short, comma-separated tokens.',
    'Bias toward 1-2 word head terms over long-tail phrases.',
    'Avoid generic descriptive verbs; favor nouns and category-defining terms that pack into 100 chars.',
    'Return ONLY a JSON array of 18 keyword strings. No explanations, no preamble, no markdown.',
  ].join(' ')
}

function normalizeKeyword(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function dedupeKeywords(list: string[], limit = 25): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const k = normalizeKeyword(raw)
    if (!k || k.length > 64 || seen.has(k)) continue
    seen.add(k)
    out.push(k)
    if (out.length >= limit) break
  }
  return out
}

async function generateKeywordSuggestions(
  app: AppRow,
  storeData: StoreAppData | null,
): Promise<string[]> {
  // 1. Seed from the user's target_keywords — these are the user's stated priorities,
  //    not a prompt decoration. They go through ranking even if the LLM never returns them.
  const seeds = (app.target_keywords ?? [])
    .map((k) => String(k ?? '').trim())
    .filter((k) => k.length > 0)

  // 2. Expand via LLM with a platform-specific system prompt.
  const deepseek = getDeepSeekClient()
  const platformContext = app.platform === 'android'
    ? `Platform: Google Play (Android)`
    : `Platform: App Store (iOS)`

  const goalLine = app.optimization_goal
    ? `Optimization goal: ${app.optimization_goal}`
    : ''

  const seedLine = seeds.length > 0
    ? `User target keywords (MUST keep these and expand around them): ${seeds.join(', ')}`
    : ''

  const baseContext = storeData
    ? `App: ${storeData.title}\nCategory: ${storeData.genre}\nDescription: ${storeData.description.slice(0, 500)}`
    : `App: ${app.name}`

  const userContent = [platformContext, baseContext, goalLine, seedLine]
    .filter(Boolean)
    .join('\n')

  let llmKeywords: string[] = []
  try {
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: buildKeywordSystemPrompt(app.platform) },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 700,
    })
    const raw = completion.choices[0]?.message?.content ?? '[]'
    const cleaned = raw
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      llmKeywords = parsed.filter((s): s is string => typeof s === 'string')
    }
  } catch (err) {
    console.error('[sync-pipeline] keyword LLM expansion failed', {
      app_id: app.id,
      platform: app.platform,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  // 3. Merge: seeds first (preserve user intent), then LLM expansion, dedup, cap.
  return dedupeKeywords([...seeds, ...llmKeywords], 25)
}

// Sequential rank check across all keywords.
//   Android: google-play-scraper
//   iOS:     iTunes Search API
//
// We use the retry-with-backoff inside each scraper call (store-scraper.ts)
// as the primary defense against rate limits. If a check still errors after
// retries, the cron at /api/cron/rank-check is the safety net — it picks
// up errored rows on its 8-minute cadence and retries them outside the
// burst window.
async function batchCheckKeywordRankingsUnified(
  keywords: string[],
  targetAppId: string,
  platform: 'ios' | 'android',
  country: string = 'us',
): Promise<KeywordRankResult[]> {
  const results: KeywordRankResult[] = []
  // Shorter inter-keyword delay than before because the cron mops up errors
  // anyway — better to finish in time than to be polite and time out.
  const delayMs = platform === 'ios' ? 250 : 200

  for (const keyword of keywords) {
    const r = platform === 'ios'
      ? await checkKeywordRankingIOS(keyword, targetAppId, country)
      : await checkKeywordRanking(keyword, targetAppId, country)
    results.push(r)
    if (delayMs > 0) await new Promise((res) => setTimeout(res, delayMs))
  }
  return results
}

async function persistKeywords(
  supabase: SupabaseClient,
  app: AppRow,
  rankings: KeywordRankResult[],
) {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  for (const r of rankings) {
    const { data: kw } = await supabase
      .from('keywords')
      .upsert(
        {
          app_id: app.id,
          organization_id: app.organization_id,
          text: r.keyword,
          country: r.country.toUpperCase(),
          is_tracked: true,
        },
        { onConflict: 'app_id,text,country' },
      )
      .select('id')
      .single()

    if (!kw) continue

    // Phase 1 honesty: if today's row exists with a known-good rank, do NOT
    // overwrite that rank with an error result — we'd lose real data. Update
    // metadata (last_checked_at, error_reason) only.
    if (r.status === 'error') {
      const { data: existing } = await supabase
        .from('keyword_ranks_daily')
        .select('rank, status')
        .eq('keyword_id', kw.id)
        .eq('date', today)
        .maybeSingle()

      if (existing && existing.status === 'ranked') {
        await supabase
          .from('keyword_ranks_daily')
          .update({
            last_checked_at: now,
            error_reason: r.errorReason ?? 'unknown',
          })
          .eq('keyword_id', kw.id)
          .eq('date', today)
        continue
      }
    }

    await supabase.from('keyword_ranks_daily').upsert(
      {
        keyword_id: kw.id,
        date: today,
        rank: r.position,
        status: r.status,
        last_checked_at: now,
        error_reason: r.errorReason ?? null,
        source: r.source,
      },
      { onConflict: 'keyword_id,date' },
    )
  }
}

async function discoverCompetitors(
  app: AppRow,
  rankings: KeywordRankResult[],
): Promise<
  Array<{
    appId: string
    title: string
    score: number
    overlapCount: number
    sharedKeywords: string[]
  }>
> {
  const isIOS = app.platform === 'ios'
  const search = isIOS ? searchAppsIOS : searchApps
  const similar = isIOS ? fetchSimilarAppsIOS : fetchSimilarApps

  // Search for the top-ranking keywords, count which apps appear most.
  // Track the ACTUAL keyword strings each competitor showed up for — this
  // populates the "N shared kw" line on the overview competitor card. Before
  // this change we only tracked the count, so the UI fell back to "—".
  const rankedKeywords = rankings
    .filter((r) => r.position !== null && r.position <= 50)
    .slice(0, 5)

  const appFrequency = new Map<
    string,
    { title: string; score: number; keywords: Set<string> }
  >()

  for (const kw of rankedKeywords) {
    const results = await search(kw.keyword, 20)
    for (const result of results) {
      if (result.appId === app.store_id) continue
      const existing = appFrequency.get(result.appId)
      if (existing) {
        existing.keywords.add(kw.keyword)
      } else {
        appFrequency.set(result.appId, {
          title: result.title,
          score: result.score,
          keywords: new Set([kw.keyword]),
        })
      }
    }
    await new Promise((r) => setTimeout(r, 300))
  }

  // Fallback to similar apps if no keyword-based competitors found
  if (appFrequency.size === 0) {
    const similarApps = await similar(app.store_id)
    for (const s of similarApps.slice(0, 10)) {
      appFrequency.set(s.appId, { title: s.title, score: s.score, keywords: new Set() })
    }
  }

  return Array.from(appFrequency.entries())
    .map(([appId, data]) => ({
      appId,
      title: data.title,
      score: data.score,
      overlapCount: data.keywords.size,
      sharedKeywords: Array.from(data.keywords),
    }))
    .sort((a, b) => b.overlapCount - a.overlapCount)
    .slice(0, 10)
}

async function writeAnalysisResults(
  supabase: SupabaseClient,
  app: AppRow,
  data: {
    storeData: StoreAppData | null
    rankings: KeywordRankResult[]
    reviews: StoreReview[]
    competitors: Array<{
      appId: string
      title: string
      score: number
      overlapCount: number
      sharedKeywords: string[]
    }>
    visibilityScore: number | null
    asoScore: ASOScoreResult | null
  },
) {
  const orgId = app.organization_id
  const now = new Date().toISOString()

  // keywords → analysis_results (enriched with volume, CPC, difficulty from heuristics)
  // IMPORTANT: Merge with existing keywords so sync doesn't destroy data from Generate Keywords
  const { data: existingKwAnalysis } = await supabase
    .from('analysis_results')
    .select('result')
    .eq('app_id', app.id)
    .eq('analysis_type', 'keywords')
    .maybeSingle()
  const existingKeywords: Array<Record<string, unknown>> = Array.isArray(existingKwAnalysis?.result) ? existingKwAnalysis.result : []

  // Compute real delta7d from keyword_ranks_daily history
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  // Fetch all keyword IDs for this app to query historical ranks in batch
  const { data: appKeywords } = await supabase
    .from('keywords')
    .select('id, text')
    .eq('app_id', app.id)

  // Batch-fetch ranks from 7 days ago
  const kwIdMap = new Map<string, string>() // text -> id
  if (appKeywords) {
    for (const kw of appKeywords) kwIdMap.set(kw.text.toLowerCase(), kw.id)
  }
  const kwIds = Array.from(kwIdMap.values())
  let oldRanks = new Map<string, number>() // keyword_id -> rank
  if (kwIds.length > 0) {
    const { data: oldRankData } = await supabase
      .from('keyword_ranks_daily')
      .select('keyword_id, rank')
      .in('keyword_id', kwIds)
      .eq('date', sevenDaysAgoStr)
    if (oldRankData) {
      oldRanks = new Map(oldRankData.filter(r => r.rank != null).map(r => [r.keyword_id, r.rank]))
    }
  }

  // Build fresh entries from sync rankings.
  //
  // Phase 6 — INLINE path keeps only the *cheap* enrichment:
  //   computeDifficultyFromSerp() reads from r.topResults that we ALREADY
  //   scraped during the rank check. Zero extra HTTP. Real difficulty.
  //
  // The expensive Phase 6 calls (Apple Search Ads, Android autocomplete +
  // Trends blend) are NOT run here — they would multiply the sync time by
  // 3-5x and blow past Vercel's 300s function ceiling. Those run in the
  // background cron at /api/cron/keyword-enrichment instead, which can take
  // its time without blocking the user.
  const syncKeywordsMap = new Map<string, Record<string, unknown>>()
  for (const r of data.rankings) {
    const metrics = estimateKeywordMetrics(r.keyword, app.platform)
    const kwId = kwIdMap.get(r.keyword.toLowerCase())
    const oldRank = kwId ? oldRanks.get(kwId) : undefined
    const delta7d = (oldRank != null && r.position != null)
      ? oldRank - r.position
      : 0

    const diffComputed = computeDifficultyFromSerp(r.topResults)
    const difficulty = diffComputed.confidence === 'modeled' ? diffComputed.difficulty : metrics.difficulty
    const diffConfidence: 'real' | 'modeled' | 'estimated' = diffComputed.confidence

    syncKeywordsMap.set(r.keyword.toLowerCase(), {
      keyword: r.keyword,
      intent: metrics.intent,
      difficulty,
      relevance: r.position ? Math.max(10, 100 - r.position) : 30,
      volume: metrics.volume,
      cpc: metrics.cpc,
      rank: r.position,
      country: r.country,
      delta7d,
      status: r.status,
      source: r.source,
      errorReason: r.errorReason ?? null,
      lastCheckedAt: now,
      isEstimate: {
        volume: true,
        cpc: true,
        difficulty: diffConfidence === 'estimated',
      },
      confidence: { volume: 'estimated' as const, difficulty: diffConfidence },
    })
  }

  // Merge: update existing keywords with fresh rank data, keep ones not in this sync.
  // Phase 1 honesty: if THIS sync errored for a keyword but the prior cached
  // entry had a real rank, keep the rank but stamp lastCheckedAt + status so
  // the UI can show "errored — last good rank: #N (3d ago)" instead of "—".
  const mergedMap = new Map<string, Record<string, unknown>>()
  for (const kw of existingKeywords) {
    const key = String(kw.keyword ?? '').toLowerCase()
    if (key) mergedMap.set(key, kw)
  }
  for (const [key, freshKw] of syncKeywordsMap) {
    const prior = mergedMap.get(key)
    if (
      freshKw.status === 'error' &&
      prior &&
      prior.status === 'ranked' &&
      prior.rank != null
    ) {
      mergedMap.set(key, {
        ...prior,
        status: 'error',
        errorReason: freshKw.errorReason,
        lastCheckedAt: freshKw.lastCheckedAt,
        // rank stays the old value — that's the honest behavior
      })
    } else {
      mergedMap.set(key, freshKw)
    }
  }
  const keywordsResult = Array.from(mergedMap.values())
  await upsertAnalysis(supabase, app.id, orgId, 'keywords', keywordsResult)

  // competitors → analysis_results (enriched with real store data)
  const competitorsResult = await Promise.all(data.competitors.map(async (c) => {
    // Fetch real store data for each competitor.
    // We use compStore.title as the display name because the new direct
    // Play Store scraper (playStoreSearch) only returns appIds — no titles —
    // so `c.title` falls back to the package ID (e.g. "com.dev367.RhetoricGame").
    // gplay.app() still works for the app-detail endpoint, so we pull the
    // real name from there. Falls back to c.title only if the fetch failed.
    let compStore: { title?: string; score?: number | null; installs?: string | null; developer?: string | null; version?: string | null } = {}
    try {
      const fetched = app.platform === 'android'
        ? await fetchGooglePlayData(c.appId)
        : await fetchAppleAppData(c.appId)
      if (fetched) compStore = fetched
    } catch { /* use basic discovery data */ }

    return {
      name: compStore.title ?? c.title,
      reason: `Appears in ${c.overlapCount} keyword search${c.overlapCount > 1 ? 'es' : ''}`,
      strengths: [`Rating: ${(compStore.score ?? c.score ?? 0).toFixed(1)}`],
      weaknesses: [],
      threatLevel:
        c.overlapCount >= 3 ? 'high' as const : c.overlapCount >= 2 ? 'medium' as const : 'low' as const,
      storeId: c.appId,
      overlapCount: c.overlapCount,
      sharedKeywords: c.sharedKeywords,
      rating: compStore.score ?? c.score ?? null,
      installs: compStore.installs ?? null,
      developer: compStore.developer ?? null,
      monthlyDownloads: compStore.installs ?? null,
      estimatedMRR: null,
      activeAds: null,
      llmSov: null,
      trend30d: null,
    }
  }))
  await upsertAnalysis(
    supabase,
    app.id,
    orgId,
    'competitors',
    competitorsResult,
  )

  // visibility → analysis_results
  //
  // BUG FIX: previously every count + the visibility score were computed from
  // `data.rankings` (the ~30 keywords from the *current* sync only), while the
  // keywords table the UI shows is cumulative across all syncs. Result: apps
  // with 45 top-10 rankings in the table would still show visibility=0 because
  // the current batch happened to be new long-tail keywords with no ranks yet.
  //
  // Fix: pull from `keywordsResult` (the merged cumulative set we just wrote
  // to analysis_results). The score now reflects the same data the user sees
  // in the table.
  const rankedCount = keywordsResult.filter((k) => (k.rank as number | null) != null).length
  const top3Count = keywordsResult.filter((k) => (k.rank as number | null) != null && (k.rank as number) <= 3).length
  const top10Count = keywordsResult.filter((k) => (k.rank as number | null) != null && (k.rank as number) <= 10).length
  const top25Count = keywordsResult.filter((k) => (k.rank as number | null) != null && (k.rank as number) <= 25).length
  const top50Count = keywordsResult.filter((k) => (k.rank as number | null) != null && (k.rank as number) <= 50).length
  const notRankedCount = keywordsResult.filter((k) => (k.rank as number | null) == null).length

  // Cumulative visibility score — computed from the same set the UI shows.
  // data.visibilityScore (from runFullSync) only saw the current batch and is
  // kept on the return value for backwards compat, but the score persisted to
  // the UI now uses the merged data.
  const cumulativeVisibilityScore = calculateVisibilityScore(
    keywordsResult.map((k) => ({
      position: (k.rank as number | null) ?? null,
      searchVolume: (k.volume as number | undefined) ?? estimateKeywordMetrics(String(k.keyword ?? ''), app.platform).volume,
    })),
  )

  // Per-keyword breakdown from cumulative data (matches the table)
  const kwBreakdown = keywordsResult.map((k) => {
    const position = (k.rank as number | null) ?? null
    const volume = (k.volume as number | undefined) ?? estimateKeywordMetrics(String(k.keyword ?? ''), app.platform).volume
    const weight = position ? getPositionWeight(position) : 0
    return {
      keyword: String(k.keyword ?? ''),
      position,
      volume,
      weight,
      contribution: weight * volume,
    }
  })
  const totalContribution = kwBreakdown.reduce((s, k) => s + k.contribution, 0)
  const keywordBreakdown = kwBreakdown
    .map((k) => ({
      keyword: k.keyword,
      position: k.position,
      volume: k.volume,
      weight: k.weight,
      contributionPct:
        totalContribution > 0
          ? Math.round((k.contribution / totalContribution) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.contributionPct - a.contributionPct)

  // Compute real visibility trend from historical rank data
  const visTrend = await computeVisibilityTrend(supabase, app.id, 13)

  // Platform scores — use cumulative score so the headline number matches
  // what's in the keywords table.
  const isAndroid = app.platform === 'android'
  const platformScore = cumulativeVisibilityScore
  const iosScore = !isAndroid ? platformScore : null
  const androidScore = isAndroid ? platformScore : null

  // Category rank (from store data genre)
  let categoryRank: string | null = null
  let categoryPercentile: string | null = null
  try {
    const genreId = data.storeData?.genreId
    if (genreId) {
      const topApps = isAndroid
        ? await fetchCategoryTopApps(genreId, 50, 'us')
        : await fetchAppleCategoryTopApps(genreId, 50, 'us')
      const catPos = topApps.findIndex(a => a.appId === app.store_id)
      if (catPos >= 0) {
        categoryRank = `#${catPos + 1} in ${data.storeData?.genre ?? 'category'}`
        categoryPercentile = `top ${Math.round(((catPos + 1) / Math.max(topApps.length, 1)) * 100)}%`
      } else if (topApps.length > 0) {
        categoryRank = `Not in top ${topApps.length}`
      }
    }
  } catch { /* skip */ }

  // Share of search
  const totalVol = kwBreakdown.reduce((s, k) => s + k.volume, 0)
  const capturedVol = kwBreakdown
    .filter(k => k.position != null && k.position <= 10)
    .reduce((s, k) => s + k.contribution, 0)
  const shareOfSearch = totalVol > 0 ? `${((capturedVol / totalVol) * 100).toFixed(1)}%` : '0.0%'

  const visibilityResult = {
    overallScore: cumulativeVisibilityScore,
    iosScore,
    androidScore,
    categoryRank,
    categoryPercentile,
    shareOfSearch,
    trendData: visTrend.dates.length > 0 ? {
      dates: visTrend.dates,
      scores: visTrend.scores,
      ...(isAndroid
        ? { androidPath: scoresToSvgPath(visTrend.scores) }
        : { iosPath: scoresToSvgPath(visTrend.scores) }),
    } : undefined,
    surfaces: [
      {
        surface: isAndroid ? 'Play Store Search' : 'App Store Search',
        score: cumulativeVisibilityScore,
        status:
          cumulativeVisibilityScore === null
            ? 'pending'
            : cumulativeVisibilityScore > 60
              ? 'strong'
              : cumulativeVisibilityScore > 30
                ? 'moderate'
                : 'weak',
        recommendation:
          cumulativeVisibilityScore === null
            ? 'Awaiting rank data — first daily sweep pending'
            : `${rankedCount} of ${keywordsResult.length} keywords ranked`,
      },
      {
        surface: 'Category Rankings',
        score: data.asoScore?.overall ?? 0,
        status: 'moderate' as const,
        recommendation: 'Based on ASO metadata score',
      },
    ],
    quickWins: [] as Array<{ action: string; expectedImpact: string }>,
    rankingDistribution: {
      top3: top3Count,
      top10: top10Count,
      top25: top25Count,
      top50: top50Count,
      notRanked: notRankedCount,
    },
    keywordBreakdown,
    summary:
      cumulativeVisibilityScore === null
        ? `Awaiting first rank sweep across ${keywordsResult.length} tracked keywords.`
        : `Visibility score ${cumulativeVisibilityScore}/100 based on ${keywordsResult.length} tracked keywords. ${top10Count} in top 10, ${top3Count} in top 3.`,
    refreshedAt: now,
  }
  await upsertAnalysis(
    supabase,
    app.id,
    orgId,
    'visibility',
    visibilityResult,
  )

  // reviews-analysis → from real reviews
  if (data.reviews.length > 0) {
    const avgRating =
      data.reviews.reduce((s, r) => s + r.score, 0) / data.reviews.length
    const reviewsResult = {
      sentimentSummary: `Based on ${data.reviews.length} real reviews. Average rating: ${avgRating.toFixed(1)}/5.`,
      praiseThemes: [],
      complaintThemes: [],
      replyTemplates: [],
      keywordsFromReviews: [],
      realReviewCount: data.reviews.length,
      averageRating: avgRating,
    }
    await upsertAnalysis(
      supabase,
      app.id,
      orgId,
      'reviews-analysis',
      reviewsResult,
    )
  }

  // overview → aggregate (preserve existing AI-generated priorities)
  const { data: existingOverview } = await supabase
    .from('analysis_results')
    .select('result')
    .eq('app_id', app.id)
    .eq('analysis_type', 'overview')
    .maybeSingle()

  const existingPriorities =
    (existingOverview?.result as Record<string, unknown>)?.priorities ?? []
  const hasPriorities = Array.isArray(existingPriorities) && existingPriorities.length > 0

  // Auto-generate priorities from real sync data
  const autoPriorities: Array<{
    action: string; detail: string; surface: string;
    module: string; lift: string; liftUnit: string;
    effort: 'small' | 'medium' | 'large'; owner: string;
  }> = []

  if (data.storeData && (data.storeData.ratings ?? 0) < 10) {
    autoPriorities.push({
      action: 'Get Early Reviews',
      detail: `Only ${data.storeData.ratings ?? 0} ratings — aim for 10+ to unlock trust signals.`,
      surface: data.storeData.genre === 'SPORTS' ? 'Play Store' : 'App Store',
      module: 'Reviews',
      lift: '+10',
      liftUnit: 'Reviews',
      effort: 'small',
      owner: 'Marketing',
    })
  }

  if (top10Count === 0 && rankedCount > 0) {
    // Pick best keyword from cumulative data — top10Count was computed from
    // keywordsResult, so picking from data.rankings (current sync only) would
    // surface the wrong keyword when historical ranks exist.
    const bestRank = keywordsResult
      .filter((k) => (k.rank as number | null) != null)
      .sort((a, b) => ((a.rank as number | null) ?? 999) - ((b.rank as number | null) ?? 999))[0]
    if (bestRank) {
      autoPriorities.push({
        action: `Push "${bestRank.keyword}" into Top 10`,
        detail: `Currently #${bestRank.rank} — optimize title/description to move up.`,
        surface: 'Play Store',
        module: 'Keywords',
        lift: '+5',
        liftUnit: 'Positions',
        effort: 'medium',
        owner: 'ASO Strategist',
      })
    }
  }

  if (data.asoScore && data.asoScore.overall < 70) {
    const weakest = Object.entries(data.asoScore.breakdown)
      .filter(([, v]) => typeof v === 'number' && v < 50)
      .sort(([, a], [, b]) => (a as number) - (b as number))
    if (weakest.length > 0) {
      const [field, score] = weakest[0]!
      const fieldName = field.replace('Score', '').replace(/([A-Z])/g, ' $1').trim()
      autoPriorities.push({
        action: `Improve ${fieldName}`,
        detail: `${fieldName} scores ${score}/100 — biggest ASO improvement opportunity.`,
        surface: 'Play Store',
        module: 'Optimizer',
        lift: `+${Math.round((100 - (score as number)) * 0.3)}`,
        liftUnit: 'ASO Points',
        effort: 'small',
        owner: 'ASO Strategist',
      })
    }
  }

  if (data.competitors.length > 0) {
    autoPriorities.push({
      action: 'Analyze Top Competitor',
      detail: `${data.competitors[0]!.title} appears in ${data.competitors[0]!.overlapCount} keyword searches.`,
      surface: 'Play Store',
      module: 'Competitors',
      lift: '+2',
      liftUnit: 'Keyword Gaps',
      effort: 'small',
      owner: 'ASO Strategist',
    })
  }

  if (notRankedCount > 0) {
    autoPriorities.push({
      action: 'Set Up Keyword Tracking',
      // notRankedCount is cumulative — denominator must match.
      detail: `${notRankedCount} of ${keywordsResult.length} keywords not ranking — establish baseline tracking.`,
      surface: 'Play Store',
      module: 'Keywords',
      lift: `+${notRankedCount}`,
      liftUnit: 'Baseline',
      effort: 'small',
      owner: 'ASO Strategist',
    })
  }

  const overviewResult = {
    priorities: hasPriorities ? existingPriorities : autoPriorities,
    surfaces: {
      appStore: { top10: 0, categoryRank: '—', cvr: '—' },
      playStore: {
        top10: top10Count,
        categoryRank: data.storeData?.genre ?? '—',
        cvr: '—',
      },
      ai: { recommended: '—', citations: 0, referralInstalls: '—' },
    },
    summary: data.storeData
      ? `${data.storeData.title} — ${(data.storeData.ratings ?? 0).toLocaleString()} ratings (${(data.storeData.score ?? 0).toFixed(1)}★), ${data.storeData.installs ?? '0'} installs. ASO score: ${data.asoScore?.overall ?? '—'}/100. Visibility: ${data.visibilityScore ?? '—'}/100.`
      : `${app.name} — real data sync completed.`,
    asoScore: data.asoScore?.overall ?? null,
    realData: true,
    storeRating: data.storeData?.score ?? null,
    storeRatings: data.storeData?.ratings ?? null,
    storeInstalls: data.storeData?.installs ?? null,
    storeReviewCount: data.reviews.length > 0 ? data.reviews.length : null,
  }
  await upsertAnalysis(supabase, app.id, orgId, 'overview', overviewResult)

  // store-intel → from real metadata + real category leaderboard (preserve AI fields)
  if (data.storeData) {
    // Fetch existing store-intel to preserve AI-generated fields (keywordOpportunities, marketTrends, etc.)
    const { data: existingStoreIntel } = await supabase
      .from('analysis_results')
      .select('result')
      .eq('app_id', app.id)
      .eq('analysis_type', 'store-intel')
      .maybeSingle()
    const existingIntel = (existingStoreIntel?.result ?? {}) as Record<string, unknown>

    // Fetch real category leaderboard from store
    const categoryLeaderboard = await (async () => {
      try {
        if (app.platform === 'android') {
          return await fetchCategoryTopApps(data.storeData!.genreId, 12)
        } else {
          return await fetchAppleCategoryTopApps(data.storeData!.genreId, 12)
        }
      } catch {
        return []
      }
    })()

    // Compute real algorithm factors from actual app data
    const daysSinceUpdate = Math.round((Date.now() - (data.storeData.updated ?? Date.now())) / (1000 * 60 * 60 * 24))
    const descLen = data.storeData.description?.length ?? 0
    const screenshotCount = data.storeData.screenshots?.length ?? 0

    const algorithmFactors = [
      {
        factor: 'Rating',
        weight: 'high' as const,
        currentStatus: `${(data.storeData.score ?? 0).toFixed(1)}/5 (${(data.storeData.ratings ?? 0).toLocaleString()} ratings)`,
      },
      {
        factor: 'Install Volume',
        weight: 'high' as const,
        currentStatus: data.storeData.installs || '0',
      },
      {
        factor: 'Ratings Count',
        weight: 'high' as const,
        currentStatus: `${(data.storeData.ratings ?? 0).toLocaleString()} total ratings`,
      },
      {
        factor: 'Update Recency',
        weight: 'medium' as const,
        currentStatus: daysSinceUpdate <= 30 ? `${daysSinceUpdate}d ago (good)` : `${daysSinceUpdate}d ago (stale)`,
      },
      {
        factor: 'Description Length',
        weight: 'medium' as const,
        currentStatus: descLen > 2000 ? `${descLen} chars (good)` : descLen > 500 ? `${descLen} chars (ok)` : `${descLen} chars (short)`,
      },
      {
        factor: 'Screenshots',
        weight: 'medium' as const,
        currentStatus: screenshotCount >= 8 ? `${screenshotCount} (good)` : screenshotCount >= 4 ? `${screenshotCount} (ok)` : `${screenshotCount} (needs more)`,
      },
      {
        factor: 'Keyword Relevance',
        weight: 'high' as const,
        currentStatus: `${data.rankings.filter(r => r.position !== null).length}/${data.rankings.length} keywords ranking`,
      },
    ]

    // Find app's position in leaderboard if present
    const appInLeaderboard = categoryLeaderboard.findIndex(
      a => a.appId === app.store_id || a.name.toLowerCase() === app.name.toLowerCase()
    )

    const storeIntelResult = {
      // Preserve existing AI-generated fields if they exist
      categoryTrends: Array.isArray(existingIntel.categoryTrends) && (existingIntel.categoryTrends as unknown[]).length > 0
        ? existingIntel.categoryTrends
        : [],
      marketTrends: Array.isArray(existingIntel.marketTrends) && (existingIntel.marketTrends as unknown[]).length > 0
        ? existingIntel.marketTrends
        : [],
      featuringTips: Array.isArray(existingIntel.featuringTips) && (existingIntel.featuringTips as unknown[]).length > 0
        ? existingIntel.featuringTips
        : [],
      keywordOpportunities: Array.isArray(existingIntel.keywordOpportunities) && (existingIntel.keywordOpportunities as unknown[]).length > 0
        ? existingIntel.keywordOpportunities
        : [],
      // Real data (always overwritten with fresh values)
      algorithmFactors,
      competitiveDensity:
        data.competitors.length > 8
          ? 'high'
          : data.competitors.length > 4
            ? 'medium'
            : ('low' as const),
      summary: `${data.storeData.genre ?? 'Unknown'} category. ${(data.storeData.score ?? 0).toFixed(1)}/5 rating across ${(data.storeData.ratings ?? 0).toLocaleString()} reviews. ${data.storeData.installs ?? '0'} installs.${appInLeaderboard >= 0 ? ` Ranked #${appInLeaderboard + 1} in category.` : ''}`,
      categoryLeaderboard,
      realData: true,
    }
    await upsertAnalysis(
      supabase,
      app.id,
      orgId,
      'store-intel',
      storeIntelResult,
    )
  }

  // conversion → deterministic scoring from store data (no AI call)
  if (data.storeData) {
    const sd = data.storeData
    const title = sd.title ?? ''
    const subtitle = sd.summary ?? ''
    const rating = sd.score ?? 0
    const ratingsCount = sd.ratings ?? 0
    let screenshots = sd.screenshots ?? []

    // Preserve previously cached screenshots if the API now returns empty
    if (screenshots.length === 0) {
      const { data: existingConv } = await supabase
        .from('analysis_results')
        .select('result')
        .eq('app_id', app.id)
        .eq('analysis_type', 'conversion')
        .maybeSingle()
      const existingScreenshots = (existingConv?.result as Record<string, unknown>)?.screenshotUrls
      if (Array.isArray(existingScreenshots) && existingScreenshots.length > 0) {
        screenshots = existingScreenshots as string[]
      }
    }

    const kwTexts = data.rankings.map(r => r.keyword.toLowerCase())
    const titleLower = title.toLowerCase()
    const subLower = subtitle.toLowerCase()

    let iconScore = sd.icon ? 50 : 0
    if (sd.icon && !sd.icon.includes('default')) iconScore += 30
    if (rating >= 4.0) iconScore += 20
    iconScore = Math.min(100, iconScore)

    let titleScore = title.length > 0 ? 20 : 0
    if (title.length >= 15 && title.length <= 30) titleScore += 30
    else if (title.length > 0 && title.length < 50) titleScore += 15
    titleScore += Math.min(30, kwTexts.filter(kw => titleLower.includes(kw)).length * 15)
    if (title.includes(':') || title.includes('-') || title.includes('|')) titleScore += 20
    titleScore = Math.min(100, titleScore)

    let subtitleScore = subtitle.length > 0 ? 30 : 0
    if (subtitle.length >= 10 && subtitle.length <= 30) subtitleScore += 25
    else if (subtitle.length > 0) subtitleScore += 10
    subtitleScore += Math.min(25, kwTexts.filter(kw => subLower.includes(kw)).length * 12)
    if (subtitle.length > 0) subtitleScore += 20
    subtitleScore = Math.min(100, subtitleScore)

    let ratingScore = 0
    if (rating >= 4.5) ratingScore += 40
    else if (rating >= 4.0) ratingScore += 25
    else if (rating >= 3.5) ratingScore += 15
    else if (rating > 0) ratingScore += 5
    if (ratingsCount >= 10000) ratingScore += 40
    else if (ratingsCount >= 1000) ratingScore += 30
    else if (ratingsCount >= 100) ratingScore += 20
    else if (ratingsCount >= 10) ratingScore += 10
    else ratingScore += 5
    if (ratingsCount >= 5) ratingScore += 20
    ratingScore = Math.min(100, ratingScore)

    let screenshotScore = 0
    if (screenshots.length >= 8) screenshotScore += 30
    else if (screenshots.length >= 5) screenshotScore += 20
    else if (screenshots.length >= 3) screenshotScore += 10
    if (screenshots.length >= 3) screenshotScore += 30
    screenshotScore += Math.min(40, screenshots.length * 5)
    screenshotScore = Math.min(100, screenshotScore)

    const conversionScore = Math.round(
      iconScore * 0.15 + titleScore * 0.25 + subtitleScore * 0.20 + ratingScore * 0.25 + screenshotScore * 0.15
    )

    const conversionResult = {
      conversionScore,
      searchCardAudit: { iconScore, titleScore, subtitleScore, ratingScore, screenshotScore, issues: [] },
      competitorComparison: [],
      recommendations: [],
      appIcon: sd.icon,
      appTitle: title,
      appSubtitle: subtitle,
      appRating: rating,
      appRatingsCount: ratingsCount,
      screenshotUrls: screenshots,
      summary: `Conversion score ${conversionScore}/100. ${screenshots.length} screenshots, ${rating.toFixed(1)}/5 rating with ${ratingsCount.toLocaleString()} ratings. Generate for AI recommendations.`,
      realData: true,
    }
    await upsertAnalysis(supabase, app.id, orgId, 'conversion', conversionResult)
  }
}

async function upsertAnalysis(
  supabase: SupabaseClient,
  appId: string,
  orgId: string,
  analysisType: string,
  result: unknown,
) {
  await supabase.from('analysis_results').upsert(
    {
      app_id: appId,
      organization_id: orgId,
      analysis_type: analysisType,
      result,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'app_id,analysis_type' },
  )
}
