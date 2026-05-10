import { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchGooglePlayData,
  fetchGooglePlayReviews,
  fetchAppleAppData,
  batchCheckKeywordRankings,
  batchCheckKeywordRankingsIOS,
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
import { getPositionWeight } from './aso-scoring'
import { getDeepSeekClient } from './deepseek'

interface AppRow {
  id: string
  organization_id: string
  platform: 'ios' | 'android'
  store_id: string
  name: string
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
  }>
  visibilityScore: number
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

  // Step 4: Generate + check keywords (platform-aware)
  const keywordSuggestions = await generateKeywordSuggestions(app, storeData)
  const rankings = app.platform === 'ios'
    ? await batchCheckKeywordRankingsIOS(keywordSuggestions, app.store_id, 'us', 400)
    : await batchCheckKeywordRankings(keywordSuggestions, app.store_id, 'us', 300)
  await persistKeywords(supabase, app, rankings)

  // Step 5: Discover competitors
  const competitors = await discoverCompetitors(app, rankings)

  // Step 6: Calculate scores (volume-weighted for accuracy)
  const visibilityScore = calculateVisibilityScore(
    rankings.map((r) => {
      const metrics = estimateKeywordMetrics(r.keyword)
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

async function generateKeywordSuggestions(
  app: AppRow,
  storeData: StoreAppData | null,
): Promise<string[]> {
  const deepseek = getDeepSeekClient()
  const context = storeData
    ? `App: ${storeData.title}\nCategory: ${storeData.genre}\nDescription: ${storeData.description.slice(0, 500)}`
    : `App: ${app.name}\nPlatform: ${app.platform}`

  const completion = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content:
          'You are an ASO keyword expert. Return ONLY a JSON array of 15 keyword strings (1-3 words each) that users would search to find this app. No explanations.',
      },
      { role: 'user', content: context },
    ],
    temperature: 0.7,
    max_tokens: 500,
  })

  try {
    const raw = completion.choices[0]?.message?.content ?? '[]'
    const cleaned = raw
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim()
    return JSON.parse(cleaned) as string[]
  } catch {
    return []
  }
}

async function persistKeywords(
  supabase: SupabaseClient,
  app: AppRow,
  rankings: KeywordRankResult[],
) {
  for (const r of rankings) {
    // Upsert keyword
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

    if (kw) {
      // Insert daily rank
      await supabase.from('keyword_ranks_daily').upsert(
        {
          keyword_id: kw.id,
          date: new Date().toISOString().split('T')[0],
          rank: r.position,
        },
        { onConflict: 'keyword_id,date' },
      )
    }
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
  }>
> {
  const isIOS = app.platform === 'ios'
  const search = isIOS ? searchAppsIOS : searchApps
  const similar = isIOS ? fetchSimilarAppsIOS : fetchSimilarApps

  // Search for the top-ranking keywords, count which apps appear most
  const rankedKeywords = rankings
    .filter((r) => r.position !== null && r.position <= 50)
    .slice(0, 5)

  const appFrequency = new Map<
    string,
    { title: string; score: number; count: number }
  >()

  for (const kw of rankedKeywords) {
    const results = await search(kw.keyword, 20)
    for (const result of results) {
      if (result.appId === app.store_id) continue
      const existing = appFrequency.get(result.appId)
      if (existing) {
        existing.count++
      } else {
        appFrequency.set(result.appId, {
          title: result.title,
          score: result.score,
          count: 1,
        })
      }
    }
    await new Promise((r) => setTimeout(r, 300))
  }

  // Fallback to similar apps if no keyword-based competitors found
  if (appFrequency.size === 0) {
    const similarApps = await similar(app.store_id)
    for (const s of similarApps.slice(0, 10)) {
      appFrequency.set(s.appId, { title: s.title, score: s.score, count: 1 })
    }
  }

  return Array.from(appFrequency.entries())
    .map(([appId, data]) => ({
      appId,
      title: data.title,
      score: data.score,
      overlapCount: data.count,
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
    }>
    visibilityScore: number
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

  // Build fresh entries from sync rankings
  const syncKeywordsMap = new Map<string, Record<string, unknown>>()
  for (const r of data.rankings) {
    const metrics = estimateKeywordMetrics(r.keyword)
    const kwId = kwIdMap.get(r.keyword.toLowerCase())
    const oldRank = kwId ? oldRanks.get(kwId) : undefined
    const delta7d = (oldRank != null && r.position != null)
      ? oldRank - r.position
      : 0
    syncKeywordsMap.set(r.keyword.toLowerCase(), {
      keyword: r.keyword,
      intent: metrics.intent,
      difficulty: metrics.difficulty,
      relevance: r.position ? Math.max(10, 100 - r.position) : 30,
      volume: metrics.volume,
      cpc: metrics.cpc,
      rank: r.position,
      country: r.country,
      delta7d,
      isEstimate: { volume: true, cpc: true, difficulty: true },
    })
  }

  // Merge: update existing keywords with fresh rank data, keep ones not in this sync
  const mergedMap = new Map<string, Record<string, unknown>>()
  for (const kw of existingKeywords) {
    const key = String(kw.keyword ?? '').toLowerCase()
    if (key) mergedMap.set(key, kw)
  }
  for (const [key, freshKw] of syncKeywordsMap) {
    mergedMap.set(key, freshKw) // overwrite with fresh data
  }
  const keywordsResult = Array.from(mergedMap.values())
  await upsertAnalysis(supabase, app.id, orgId, 'keywords', keywordsResult)

  // competitors → analysis_results (enriched with real store data)
  const competitorsResult = await Promise.all(data.competitors.map(async (c) => {
    // Fetch real store data for each competitor
    let compStore: { score?: number | null; installs?: string | null; developer?: string | null; version?: string | null } = {}
    try {
      const fetched = app.platform === 'android'
        ? await fetchGooglePlayData(c.appId)
        : await fetchAppleAppData(c.appId)
      if (fetched) compStore = fetched
    } catch { /* use basic discovery data */ }

    return {
      name: c.title,
      reason: `Appears in ${c.overlapCount} keyword search${c.overlapCount > 1 ? 'es' : ''}`,
      strengths: [`Rating: ${(compStore.score ?? c.score ?? 0).toFixed(1)}`],
      weaknesses: [],
      threatLevel:
        c.overlapCount >= 3 ? 'high' as const : c.overlapCount >= 2 ? 'medium' as const : 'low' as const,
      storeId: c.appId,
      overlapCount: c.overlapCount,
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

  // visibility → analysis_results (with ranking distribution + keyword breakdown)
  const rankedCount = data.rankings.filter((r) => r.position !== null).length
  const top3Count = data.rankings.filter(
    (r) => r.position !== null && r.position <= 3,
  ).length
  const top10Count = data.rankings.filter(
    (r) => r.position !== null && r.position <= 10,
  ).length
  const top25Count = data.rankings.filter(
    (r) => r.position !== null && r.position <= 25,
  ).length
  const top50Count = data.rankings.filter(
    (r) => r.position !== null && r.position <= 50,
  ).length
  const notRankedCount = data.rankings.filter(
    (r) => r.position === null,
  ).length

  // Build per-keyword breakdown with volume-weighted contribution
  const kwBreakdown = data.rankings.map((r) => {
    const metrics = estimateKeywordMetrics(r.keyword)
    const weight = r.position ? getPositionWeight(r.position) : 0
    return {
      keyword: r.keyword,
      position: r.position,
      volume: metrics.volume,
      weight,
      contribution: weight * metrics.volume,
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

  // Platform scores
  const isAndroid = app.platform === 'android'
  const platformScore = data.visibilityScore
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
    overallScore: data.visibilityScore,
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
        score: data.visibilityScore,
        status:
          data.visibilityScore > 60
            ? 'strong'
            : data.visibilityScore > 30
              ? 'moderate'
              : 'weak',
        recommendation: `${rankedCount} of ${data.rankings.length} keywords ranked`,
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
    summary: `Visibility score ${data.visibilityScore}/100 based on ${data.rankings.length} tracked keywords. ${top10Count} in top 10, ${top3Count} in top 3.`,
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
    const bestRank = data.rankings
      .filter((r) => r.position !== null)
      .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))[0]
    if (bestRank) {
      autoPriorities.push({
        action: `Push "${bestRank.keyword}" into Top 10`,
        detail: `Currently #${bestRank.position} — optimize title/description to move up.`,
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
      detail: `${notRankedCount} of ${data.rankings.length} keywords not ranking — establish baseline tracking.`,
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
      ? `${data.storeData.title} — ${(data.storeData.ratings ?? 0).toLocaleString()} ratings (${(data.storeData.score ?? 0).toFixed(1)}★), ${data.storeData.installs ?? '0'} installs. ASO score: ${data.asoScore?.overall ?? '—'}/100. Visibility: ${data.visibilityScore}/100.`
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
