'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useMultiAnalysis } from '@/hooks/useMultiAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { ScoreRing } from '@/components/dashboard/charts/ScoreRing'
import type {
  VisibilityData,
  KeywordsData,
  KeywordItem,
  OverviewData,
  CompetitorsData,
  CompetitorItem,
  LlmTrackData,
  LlmTrackItem,
  RecommendationsData,
  RecommendationItem,
  StoreIntelData,
  ReviewsAnalysisData,
} from '@/lib/analysis-types'
import { asArray } from '@/lib/analysis-types'

function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

type KwOpp = { keyword: string; description: string; volume: 'high' | 'medium' | 'low'; competition: 'high' | 'medium' | 'low'; score: number }
type Priority = { action: string; detail: string; surface: string; module: string; lift: string; liftUnit: string; effort: string; owner: string }

export default function Overview2Page() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''

  // --- Data fetching (single batched request for all 8 analysis types) ---
  type AllAnalysis = {
    visibility: VisibilityData
    keywords: KeywordsData
    overview: OverviewData
    competitors: CompetitorsData
    'llm-track': LlmTrackData
    recommendations: RecommendationsData
    'store-intel': StoreIntelData
    'reviews-analysis': ReviewsAnalysisData
  }
  const analysisTypes = ['visibility', 'keywords', 'overview', 'competitors', 'llm-track', 'recommendations', 'store-intel', 'reviews-analysis']
  const { data: allData, refetch: refetchAll, lastUpdated } = useMultiAnalysis<AllAnalysis>(slug, analysisTypes)

  const visibilityData = (allData.visibility ?? null) as VisibilityData | null
  const keywordsRaw = (allData.keywords ?? null) as KeywordsData | null
  const overviewData = (allData.overview ?? null) as OverviewData | null
  const competitorsRaw = (allData.competitors ?? null) as CompetitorsData | null
  const llmTrackRaw = (allData['llm-track'] ?? null) as LlmTrackData | null
  const recsRaw = (allData.recommendations ?? null) as RecommendationsData | null
  const storeIntelData = (allData['store-intel'] ?? null) as StoreIntelData | null
  const reviewsData = (allData['reviews-analysis'] ?? null) as ReviewsAnalysisData | null

  const { generate: syncAll, generating } = useGenerate(slug, 'sync', {
    onSuccess: () => { refetchAll() },
  })

  // --- Auto-sync if data is stale (>4 hours old) ---
  const autoSyncRan = useRef(false)
  useEffect(() => {
    if (autoSyncRan.current || generating || !lastUpdated) return
    const ageMs = Date.now() - new Date(lastUpdated).getTime()
    const FOUR_HOURS = 4 * 60 * 60 * 1000
    if (ageMs > FOUR_HOURS) {
      autoSyncRan.current = true
      syncAll()
    }
  }, [lastUpdated, generating, syncAll])

  // --- Data normalization ---
  const keywords = asArray(keywordsRaw) as KeywordItem[]
  const competitors: CompetitorItem[] = Array.isArray(competitorsRaw) ? competitorsRaw : ((competitorsRaw as { competitors?: CompetitorItem[] })?.competitors ?? [])
  const llmResults: LlmTrackItem[] = Array.isArray(llmTrackRaw) ? llmTrackRaw : ((llmTrackRaw as { results?: LlmTrackItem[] })?.results ?? [])
  const llmCitations = !Array.isArray(llmTrackRaw) ? (llmTrackRaw as { citations?: Array<{ source: string; quote: string; meta: string }> })?.citations ?? [] : []
  const recommendations = asArray(recsRaw) as RecommendationItem[]
  const kwOpps = (storeIntelData?.keywordOpportunities ?? []) as KwOpp[]

  // --- Computed KPIs ---
  const computed = useMemo(() => {
    const ranked = keywords.filter(k => k.rank != null)
    const rankedCount = ranked.length
    const avgPos = rankedCount > 0 ? ranked.reduce((s, k) => s + (k.rank ?? 0), 0) / rankedCount : null
    const totalVol = keywords.reduce((s, k) => s + (k.volume ?? 0), 0)
    const volCaptured = totalVol > 0
      ? (keywords.filter(k => k.rank != null && k.rank <= 10).reduce((s, k) => s + (k.volume ?? 0), 0) / totalVol) * 100
      : 0
    const asoScore = overviewData?.asoScore != null ? Math.round(overviewData.asoScore) : null
    const visScore = visibilityData?.overallScore ?? null

    // Growth momentum
    const kwWithDelta = keywords.filter(k => k.delta7d != null)
    const positiveDelta = kwWithDelta.filter(k => (k.delta7d ?? 0) > 0).length
    const kwMomentum = kwWithDelta.length > 0 ? (positiveDelta / kwWithDelta.length) * 100 : 50
    const visMomentum = visScore != null ? Math.min(visScore, 100) : 50
    const llmMentioned = llmResults.filter(r => r.mentioned).length
    const llmMomentum = llmResults.length > 0 ? (llmMentioned / llmResults.length) * 100 : 0
    const sentimentMomentum = reviewsData?.averageRating != null ? (reviewsData.averageRating / 5) * 100 : 50
    const growthMomentum = Math.round(kwMomentum * 0.4 + visMomentum * 0.3 + llmMomentum * 0.15 + sentimentMomentum * 0.15)

    // Competitive gaps
    const allGaps = new Set<string>()
    const allShared = new Set<string>()
    const highThreats = competitors.filter(c => c.threatLevel === 'high')
    competitors.forEach(c => {
      c.keywordGaps?.forEach(g => allGaps.add(g))
      c.sharedKeywords?.forEach(s => allShared.add(s))
    })

    // Metadata health
    const titleKw = keywords.filter(k => k.field?.toLowerCase() === 'title').length
    const subtitleKw = keywords.filter(k => k.field?.toLowerCase() === 'subtitle').length
    const kwFieldKw = keywords.filter(k => k.field?.toLowerCase() === 'keyword' || k.field?.toLowerCase() === 'keywords').length
    const missingKw = keywords.filter(k => !k.field || k.field === 'MISSING' || k.field === 'missing' || k.field === 'NOT SET').length
    const kwTotal = keywords.length || 1
    const metadataHealth = Math.round(((titleKw / kwTotal) * 40 + (subtitleKw / kwTotal) * 25 + (kwFieldKw / kwTotal) * 35) * 100)

    // Untapped keywords
    const trackedSet = new Set(keywords.map(k => k.keyword.toLowerCase()))
    const untapped = kwOpps.filter(o => !trackedSet.has(o.keyword.toLowerCase()))

    // Quick wins
    const quickWins = recommendations.filter(r => r.impact === 'high' && (r.effort === 'low' || r.effort === 'medium'))

    return {
      rankedCount, avgPos, totalVol, volCaptured, asoScore, visScore,
      growthMomentum, kwMomentum, visMomentum, llmMomentum, sentimentMomentum,
      allGaps: Array.from(allGaps), allShared: Array.from(allShared), highThreats,
      titleKw, subtitleKw, kwFieldKw, missingKw, metadataHealth,
      untapped, quickWins,
      llmMentioned, llmTotal: llmResults.length,
    }
  }, [keywords, overviewData, visibilityData, llmResults, reviewsData, competitors, kwOpps, recommendations])

  // --- Sort instances ---
  const prioAccessors = useMemo(() => ({
    action: (p: Priority) => p.action,
    surface: (p: Priority) => p.surface,
    module: (p: Priority) => p.module,
    effort: (p: Priority) => p.effort === 'small' ? 1 : p.effort === 'medium' ? 2 : 3,
  }), [])
  const priorities = (overviewData?.priorities ?? []) as Priority[]
  const { sorted: sortedPrios, sortKey: pSortKey, sortDir: pSortDir, toggle: pToggle } = useTableSort(priorities, prioAccessors)

  const kwAccessors = useMemo(() => ({
    keyword: (k: KeywordItem) => k.keyword,
    rank: (k: KeywordItem) => k.rank ?? 9999,
    volume: (k: KeywordItem) => k.volume ?? 0,
    difficulty: (k: KeywordItem) => k.difficulty,
    delta7d: (k: KeywordItem) => k.delta7d ?? 0,
    relevance: (k: KeywordItem) => k.relevance,
    cpc: (k: KeywordItem) => k.cpc ?? 0,
  }), [])
  const { sorted: sortedKw, sortKey: kwSortKey, sortDir: kwSortDir, toggle: kwToggle } = useTableSort(keywords, kwAccessors)

  const oppAccessors = useMemo(() => ({
    keyword: (o: KwOpp) => o.keyword,
    score: (o: KwOpp) => o.score,
    volume: (o: KwOpp) => o.volume === 'high' ? 3 : o.volume === 'medium' ? 2 : 1,
    competition: (o: KwOpp) => o.competition === 'high' ? 3 : o.competition === 'medium' ? 2 : 1,
  }), [])
  const { sorted: sortedOpps, sortKey: oSortKey, sortDir: oSortDir, toggle: oToggle } = useTableSort(kwOpps, oppAccessors)

  const recAccessors = useMemo(() => ({
    title: (r: RecommendationItem) => r.title,
    impact: (r: RecommendationItem) => r.impact === 'high' ? 3 : r.impact === 'medium' ? 2 : 1,
    effort: (r: RecommendationItem) => r.effort === 'high' ? 3 : r.effort === 'medium' ? 2 : 1,
    category: (r: RecommendationItem) => r.category,
  }), [])

  const [recFilter, setRecFilter] = useState<string | null>(null)
  const filteredRecs = recFilter ? recommendations.filter(r => r.impact === recFilter) : recommendations
  const { sorted: sortedRecs, sortKey: rSortKey, sortDir: rSortDir, toggle: rToggle } = useTableSort(filteredRecs, recAccessors)

  const [showAllKw, setShowAllKw] = useState(false)

  // --- Loading ---
  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Overview 2', isActive: true }]} />
        <div className="content">
          <div className="kpi-strip">
            {[1, 2, 3, 4, 5].map(i => (
              <div className="kpi" key={i}>
                <div className="animate-pulse" style={{ height: 14, width: 80, background: 'var(--color-line)', borderRadius: 3, marginBottom: 10 }} />
                <div className="animate-pulse" style={{ height: 34, width: 60, background: 'var(--color-line)', borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  const avgRating = reviewsData?.averageRating != null ? reviewsData.averageRating.toFixed(1) : '—'

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'Overview 2', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn ghost">Export</button>
          <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Sync Real Data'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Every signal, one <em>command center</em>.</>}
        subtitle="Visibility, keywords, competitors, LLM presence, and recommendations — consolidated for fast decision-making."
        meta={
          <>
            ASO SCORE <strong>{computed.asoScore ?? '—'}</strong><br />
            VISIBILITY <strong>{computed.visScore ?? '—'}</strong><br />
            KEYWORDS <strong>{keywords.length}</strong><br />
            RATING <strong>{avgRating}</strong>
          </>
        }
      />

      <div className="content">

        {/* KPI Strip */}
        <div className="kpi-strip">
          <div className="kpi hl">
            <div className="label">ASO Score</div>
            <div className="value">{computed.asoScore ?? '—'}</div>
          </div>
          <div className="kpi">
            <div className="label">Keywords Ranked</div>
            <div className="value">{computed.rankedCount || '—'}</div>
            <div className="delta">of {keywords.length} tracked</div>
          </div>
          <div className="kpi">
            <div className="label">Avg Position</div>
            <div className="value">{computed.avgPos != null ? computed.avgPos.toFixed(1) : '—'}</div>
          </div>
          <div className="kpi">
            <div className="label">Total Search Volume</div>
            <div className="value sm">{fmtNum(computed.totalVol || null)}</div>
          </div>
          <div className="kpi">
            <div className="label">Vol. Captured (Top 10)</div>
            <div className="value">{computed.totalVol > 0 ? `${computed.volCaptured.toFixed(1)}%` : '—'}</div>
          </div>
        </div>

        {/* § 01 Visibility & Distribution */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">§ 01</span>
              <h2>Visibility & <em>distribution</em></h2>
            </div>
          </div>

          <div className="grid-1-2">
            <div className="card">
              <div className="card-head">
                <h3>Visibility Score</h3>
                <span className="tag">{visibilityData?.scoreDelta ?? ''}</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '24px 20px' }}>
                <ScoreRing score={visibilityData?.overallScore ?? 0} />
                <div style={{ width: '100%' }}>
                  {[
                    { label: appData?.platform === 'ios' ? 'iOS Score' : 'Android Score', val: appData?.platform === 'ios' ? visibilityData?.iosScore : visibilityData?.androidScore },
                    { label: 'Category Rank', val: visibilityData?.categoryRank },
                    { label: 'Share of Search', val: visibilityData?.shareOfSearch },
                  ].map((row, i) => (
                    <div className="row-bar" key={i}>
                      <div className="rb-label">{row.label}</div>
                      <div className="rb-val">{row.val ?? '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h3>Ranking Distribution</h3>
                <span className="tag">{visibilityData?.rankingDistribution ? `${keywords.length} keywords` : '—'}</span>
              </div>
              <div className="card-body">
                {visibilityData?.rankingDistribution ? (() => {
                  const d = visibilityData.rankingDistribution
                  const total = d.top3 + (d.top10 - d.top3) + (d.top25 - d.top10) + (d.top50 - d.top25) + d.notRanked
                  const tiers = [
                    { label: 'Top 3', count: d.top3, color: 'var(--color-ok)' },
                    { label: 'Top 10', count: d.top10 - d.top3, color: 'var(--color-accent)' },
                    { label: 'Top 25', count: d.top25 - d.top10, color: '#c9a227' },
                    { label: 'Top 50', count: d.top50 - d.top25, color: 'var(--color-ink-3)' },
                    { label: 'Not Ranked', count: d.notRanked, color: 'var(--color-line)' },
                  ]
                  return (
                    <>
                      <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
                        {tiers.map((t, i) => t.count > 0 ? (
                          <div key={i} style={{ width: `${(t.count / total) * 100}%`, background: t.color, minWidth: 2 }} title={`${t.label}: ${t.count}`} />
                        ) : null)}
                      </div>
                      {tiers.map((t, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < tiers.length - 1 ? '1px solid var(--color-line)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
                            <span style={{ fontSize: 13 }}>{t.label}</span>
                          </div>
                          <strong style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{t.count}</strong>
                        </div>
                      ))}
                    </>
                  )
                })() : (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No ranking distribution data yet.</p>
                    <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* § 02 Visibility Trend */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">§ 02</span>
              <h2>Visibility trend <em>— 90 days</em></h2>
            </div>
          </div>
          {visibilityData?.trendData ? (
            <div className="card">
              <div className="chart-frame">
                <svg viewBox="0 0 800 220" preserveAspectRatio="none">
                  <g stroke="#e4e0d3" strokeWidth={1}>
                    <line x1={0} y1={40} x2={800} y2={40} />
                    <line x1={0} y1={90} x2={800} y2={90} />
                    <line x1={0} y1={140} x2={800} y2={140} />
                    <line x1={0} y1={190} x2={800} y2={190} />
                  </g>
                  <g fontFamily="JetBrains Mono" fontSize={10} fill="#a8a69b">
                    <text x={6} y={36}>100</text>
                    <text x={6} y={86}>75</text>
                    <text x={6} y={136}>50</text>
                    <text x={6} y={186}>25</text>
                  </g>
                  {visibilityData.trendData.iosPath && (
                    <path d={visibilityData.trendData.iosPath} fill="none" stroke="#1d3fd9" strokeWidth={2.5} />
                  )}
                  {visibilityData.trendData.androidPath && (
                    <path d={visibilityData.trendData.androidPath} fill="none" stroke="#1f6a3a" strokeWidth={2} strokeDasharray="4 3" />
                  )}
                  {visibilityData.trendData.medianPath && (
                    <path d={visibilityData.trendData.medianPath} fill="none" stroke="#a8a69b" strokeWidth={1.5} strokeDasharray="2 3" />
                  )}
                </svg>
              </div>
              <div style={{ padding: 20, display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-ink-3)' }}>
                <div><span style={{ display: 'inline-block', width: 12, height: 2, background: 'var(--color-accent)', verticalAlign: 'middle', marginRight: 6 }} />{appData?.platform === 'ios' ? 'App Store' : 'Play Store'} visibility</div>
                <div><span style={{ display: 'inline-block', width: 12, height: 2, background: 'var(--color-ink-3)', verticalAlign: 'middle', marginRight: 6 }} />Category median</div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No trend data yet.</p>
                <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
              </div>
            </div>
          )}
        </section>

        {/* § 03 This week's priorities */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 03</span>
              <h2>This week&apos;s <em>priorities</em></h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, letterSpacing: 1, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>Strategic actions generated from real metrics.</div>
            </div>
          </div>
          <div className="card">
            {priorities.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <SortHeader label="Action" sortKey="action" activeSortKey={pSortKey} sortDir={pSortDir} onSort={pToggle} />
                    <SortHeader label="Surface" sortKey="surface" activeSortKey={pSortKey} sortDir={pSortDir} onSort={pToggle} />
                    <SortHeader label="Module" sortKey="module" activeSortKey={pSortKey} sortDir={pSortDir} onSort={pToggle} />
                    <th className="tn">Est. lift</th>
                    <SortHeader label="Effort" sortKey="effort" activeSortKey={pSortKey} sortDir={pSortDir} onSort={pToggle} />
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPrios.map((p, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'normal' }}>
                        <strong>{p.action}</strong><br />
                        <small style={{ color: 'var(--color-ink-3)' }}>{p.detail}</small>
                      </td>
                      <td>{p.surface}</td>
                      <td>{p.module}</td>
                      <td className="tn num-big">{p.lift}<br /><small>{p.liftUnit}</small></td>
                      <td><span className={`pill ${p.effort === 'small' ? 'ok' : p.effort === 'medium' ? 'test' : 'warn'}`}>{p.effort.toUpperCase()}</span></td>
                      <td>{p.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="card-body" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-ink-3)' }}>
                <p style={{ marginBottom: 12 }}>No priorities generated yet.</p>
                <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
              </div>
            )}
          </div>
        </section>

        {/* § 04 What's happening across surfaces */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 04</span>
              <h2>What&apos;s happening <em>across surfaces</em></h2>
            </div>
            <span style={{ fontSize: 9, letterSpacing: 1, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-ok)' }}>REAL DATA</span>
          </div>
          {overviewData?.surfaces ? (() => {
            const storeKey = appData?.platform === 'ios' ? 'appStore' : 'playStore'
            const storeName = appData?.platform === 'ios' ? 'App Store' : 'Google Play'
            const storeTag = appData?.platform === 'ios' ? 'iOS · US' : 'Android · US'
            const storeData = overviewData.surfaces[storeKey] as { top10?: number; categoryRank?: string; cvr?: string } | undefined
            return (
              <div className="grid-1-2">
                <div className="card">
                  <div className="card-head"><h3>{storeName}</h3><span className="tag">{storeTag}</span></div>
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Keywords ranking top 10</span>
                      <span className="num-big">{storeData?.top10 ?? '—'}</span>
                    </div>
                    <div className="bar" style={{ marginBottom: 14 }}><div className="fill" style={{ width: `${Math.min((storeData?.top10 ?? 0) * 10, 100)}%` }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Category rank</span>
                      <span className="num-big">{storeData?.categoryRank ?? '—'}</span>
                    </div>
                    <div className="bar" style={{ marginBottom: 14 }}><div className="fill accent" style={{ width: '50%' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Page CVR</span>
                      <span className="num-big">{storeData?.cvr ?? '—'}</span>
                    </div>
                    <div className="bar"><div className="fill ok" style={{ width: '50%' }} /></div>
                  </div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(180deg, var(--color-accent-wash) 0%, var(--color-card) 60%)' }}>
                  <div className="card-head"><h3>AI Assistants</h3><span className="tag">GPT · CLA · GEM · PPX</span></div>
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recommended in</span>
                      <span className="num-big">{overviewData.surfaces.ai?.recommended ?? '—'}</span>
                    </div>
                    <div className="bar" style={{ marginBottom: 14 }}><div className="fill accent" style={{ width: '23%' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Citation sources</span>
                      <span className="num-big">{overviewData.surfaces.ai?.citations ?? '—'}</span>
                    </div>
                    <div className="bar" style={{ marginBottom: 14 }}><div className="fill" style={{ width: '47%' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Referral installs</span>
                      <span className="num-big">{overviewData.surfaces.ai?.referralInstalls ?? '—'}</span>
                    </div>
                    <div className="bar"><div className="fill accent" style={{ width: '54%' }} /></div>
                  </div>
                </div>
              </div>
            )
          })() : (
            <div className="card">
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No surface data yet.</p>
                <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
              </div>
            </div>
          )}
        </section>

        {/* § 05 Keyword Rankings */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 05</span>
              <h2>Keyword <em>rankings</em></h2>
            </div>
            <span className="tag">{keywords.length} KEYWORDS</span>
          </div>
          {keywords.length > 0 ? (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortHeader label="Keyword" sortKey="keyword" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} />
                    <SortHeader label="Rank" sortKey="rank" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                    <SortHeader label="Volume" sortKey="volume" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                    <SortHeader label="Difficulty" sortKey="difficulty" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                    <SortHeader label="Δ 7d" sortKey="delta7d" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                    <th className="tn">KEI</th>
                    <th>Top Competitor</th>
                    <SortHeader label="CPC" sortKey="cpc" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                    <SortHeader label="Relevance" sortKey="relevance" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                    <th>Intent</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllKw ? sortedKw : sortedKw.slice(0, 25)).map((k, i) => {
                    const posColor = k.rank == null ? 'var(--color-ink-3)' : k.rank <= 10 ? 'var(--color-ok)' : k.rank <= 25 ? 'var(--color-accent)' : k.rank > 50 ? '#c53030' : 'var(--color-ink)'
                    const deltaColor = (k.delta7d ?? 0) > 0 ? 'var(--color-ok)' : (k.delta7d ?? 0) < 0 ? '#c53030' : 'var(--color-ink-3)'
                    return (
                      <tr key={i}>
                        <td><strong>{k.keyword}</strong></td>
                        <td className="tn num-big" style={{ color: posColor, fontWeight: 600 }}>{k.rank != null ? `#${k.rank}` : '—'}</td>
                        <td className="tn num-big">{fmtNum(k.volume)}</td>
                        <td className="tn num-big">
                          <div className="bar" style={{ height: 6, width: 50, display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }}>
                            <div className="fill" style={{ width: `${k.difficulty}%`, background: k.difficulty > 70 ? '#c53030' : k.difficulty > 40 ? '#c9a227' : 'var(--color-ok)' }} />
                          </div>
                          {k.difficulty}
                        </td>
                        <td className="tn num-big" style={{ color: deltaColor }}>{k.delta7d != null ? (k.delta7d > 0 ? `+${k.delta7d}` : k.delta7d) : '—'}</td>
                        <td className="tn num-big">{k.kei ?? '—'}</td>
                        <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.topCompetitor ?? '—'}</td>
                        <td className="tn num-big">{k.cpc != null ? `$${k.cpc.toFixed(2)}` : '—'}</td>
                        <td className="tn num-big">{k.relevance}</td>
                        <td><span className={`pill ${k.intent === 'transactional' ? 'ok' : k.intent === 'commercial' ? 'test' : ''}`}>{k.intent}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {sortedKw.length > 25 && (
                <div style={{ padding: '12px 20px', textAlign: 'center' }}>
                  <button className="btn ghost" onClick={() => setShowAllKw(!showAllKw)}>
                    {showAllKw ? 'Show top 25' : `Show all ${sortedKw.length} keywords`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No keyword data yet.</p>
                <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
              </div>
            </div>
          )}
        </section>

        {/* § 06 Keyword Opportunities */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 06</span>
              <h2>Keyword <em>opportunities</em></h2>
            </div>
          </div>
          {kwOpps.length > 0 ? (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortHeader label="Keyword" sortKey="keyword" activeSortKey={oSortKey} sortDir={oSortDir} onSort={oToggle} />
                    <th>Description</th>
                    <SortHeader label="Volume" sortKey="volume" activeSortKey={oSortKey} sortDir={oSortDir} onSort={oToggle} className="tn" />
                    <SortHeader label="Competition" sortKey="competition" activeSortKey={oSortKey} sortDir={oSortDir} onSort={oToggle} className="tn" />
                    <SortHeader label="Score" sortKey="score" activeSortKey={oSortKey} sortDir={oSortDir} onSort={oToggle} className="tn" />
                  </tr>
                </thead>
                <tbody>
                  {sortedOpps.map((o, i) => (
                    <tr key={i}>
                      <td><strong>{o.keyword}</strong></td>
                      <td style={{ whiteSpace: 'normal', color: 'var(--color-ink-3)', fontSize: 13 }}>{o.description}</td>
                      <td className="tn"><span className={`pill ${o.volume === 'high' ? 'ok' : o.volume === 'medium' ? 'test' : ''}`}>{o.volume}</span></td>
                      <td className="tn"><span className={`pill ${o.competition === 'low' ? 'ok' : o.competition === 'medium' ? 'test' : 'warn'}`}>{o.competition}</span></td>
                      <td className="tn num-big" style={{ fontWeight: 600, color: o.score >= 70 ? 'var(--color-ok)' : o.score >= 40 ? 'var(--color-accent)' : 'var(--color-ink-3)' }}>{o.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No keyword opportunity data yet. Run Store Intel first.</p>
                <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
              </div>
            </div>
          )}
        </section>

        {/* § 07 Top Recommendations */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 07</span>
              <h2>Top <em>recommendations</em></h2>
            </div>
            <div className="chip-row">
              <span className={`chip${recFilter === null ? ' on' : ''}`} onClick={() => setRecFilter(null)}>All</span>
              <span className={`chip${recFilter === 'high' ? ' on' : ''}`} onClick={() => setRecFilter('high')}>High</span>
              <span className={`chip${recFilter === 'medium' ? ' on' : ''}`} onClick={() => setRecFilter('medium')}>Medium</span>
              <span className={`chip${recFilter === 'low' ? ' on' : ''}`} onClick={() => setRecFilter('low')}>Low</span>
            </div>
          </div>
          {recommendations.length > 0 ? (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="data-table wrap-cells" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: 90 }} />
                  <col style={{ width: '35%' }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 80 }} />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <SortHeader label="Impact" sortKey="impact" activeSortKey={rSortKey} sortDir={rSortDir} onSort={rToggle} className="tn" />
                    <SortHeader label="Action" sortKey="title" activeSortKey={rSortKey} sortDir={rSortDir} onSort={rToggle} />
                    <SortHeader label="Category" sortKey="category" activeSortKey={rSortKey} sortDir={rSortDir} onSort={rToggle} />
                    <SortHeader label="Effort" sortKey="effort" activeSortKey={rSortKey} sortDir={rSortDir} onSort={rToggle} className="tn" />
                    <th>Est. Lift</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecs.map((r, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap' }}><span className={`pill ${r.impact === 'high' ? 'ok' : r.impact === 'medium' ? 'test' : ''}`}>{r.impact.toUpperCase()}</span></td>
                      <td>
                        <strong>{r.title}</strong><br />
                        <small style={{ color: 'var(--color-ink-3)' }}>{r.description}</small>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{r.category}</td>
                      <td style={{ whiteSpace: 'nowrap' }}><span className={`pill ${r.effort === 'low' ? 'ok' : r.effort === 'medium' ? 'test' : 'warn'}`}>{r.effort.toUpperCase()}</span></td>
                      <td style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--color-ink-2)' }}>{r.lift ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No recommendations yet.</p>
                <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
              </div>
            </div>
          )}
        </section>

        {/* § 08 LLM Impact */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 08</span>
              <h2>LLM <em>impact</em></h2>
            </div>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="card-head">
                <h3>AI Engine Results</h3>
                <span className="tag">{computed.llmTotal} ENGINES</span>
              </div>
              <div className="card-body">
                {llmResults.length > 0 ? (
                  <>
                    {llmResults.map((r, i) => {
                      const posPct = r.position === '1st' ? 100 : r.position === '2nd' ? 75 : r.position === '3rd' ? 50 : 10
                      return (
                        <div className="row-bar" key={i}>
                          <div className="rb-label">{r.surface}</div>
                          <div className="bar"><div className={`fill${r.mentioned ? ' accent' : ''}`} style={{ width: `${r.mentioned ? posPct : 5}%` }} /></div>
                          <div className="rb-val">
                            {r.mentioned ? (
                              <span className="pill ok">{r.position}</span>
                            ) : (
                              <span className="pill">NOT LISTED</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div style={{ display: 'flex', gap: 24, marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--color-line)', fontSize: 12, color: 'var(--color-ink-3)' }}>
                      <div>Share of Voice <strong style={{ color: 'var(--color-ink)' }}>{computed.llmTotal > 0 ? `${Math.round((computed.llmMentioned / computed.llmTotal) * 100)}%` : '—'}</strong></div>
                      <div>Cited In <strong style={{ color: 'var(--color-ink)' }}>{computed.llmMentioned}/{computed.llmTotal}</strong></div>
                    </div>
                  </>
                ) : (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No LLM tracking data yet.</p>
                    <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h3>{llmCitations.length > 0 ? 'Citations' : 'Competitor LLM Presence'}</h3>
              </div>
              <div className="card-body tight">
                {llmCitations.length > 0 ? (
                  llmCitations.map((c, i) => (
                    <div className="review-item" key={i}>
                      <div className="rv-meta"><span>{c.source}</span></div>
                      <div className="rv-text">{c.quote}</div>
                      <div className="rv-action">{c.meta}</div>
                    </div>
                  ))
                ) : competitors.length > 0 ? (
                  competitors.slice(0, 5).map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < 4 ? '1px solid var(--color-line)' : 'none' }}>
                      <div>
                        <strong style={{ fontSize: 13 }}>{c.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{c.llmSov ?? 'No LLM data'}</div>
                      </div>
                      <span className={`pill ${c.threatLevel === 'high' ? 'warn' : c.threatLevel === 'medium' ? 'test' : 'ok'}`}>{c.threatLevel.toUpperCase()}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <p style={{ color: 'var(--color-ink-3)' }}>No competitor data available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* § 09 Decision Intelligence */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 09</span>
              <h2>Decision <em>intelligence</em></h2>
            </div>
            <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>CROSS-SIGNAL</span>
          </div>
          <div className="grid-3">
            {/* Growth Momentum */}
            <div className="card">
              <div className="card-head">
                <h3>Growth Momentum</h3>
                <span className="tag">COMPOSITE</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px' }}>
                <ScoreRing score={computed.growthMomentum} />
                <div style={{ width: '100%' }}>
                  {[
                    { label: 'Keyword trajectory', val: `${Math.round(computed.kwMomentum)}%`, color: computed.kwMomentum >= 50 ? 'var(--color-ok)' : '#c53030' },
                    { label: 'Visibility', val: `${Math.round(computed.visMomentum)}`, color: 'var(--color-accent)' },
                    { label: 'LLM penetration', val: `${Math.round(computed.llmMomentum)}%`, color: computed.llmMomentum > 0 ? 'var(--color-ok)' : 'var(--color-ink-3)' },
                    { label: 'Sentiment', val: `${Math.round(computed.sentimentMomentum)}%`, color: computed.sentimentMomentum >= 80 ? 'var(--color-ok)' : 'var(--color-ink-3)' },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? '1px solid var(--color-line)' : 'none', fontSize: 12 }}>
                      <span style={{ color: 'var(--color-ink-3)' }}>{row.label}</span>
                      <strong style={{ color: row.color, fontFamily: 'var(--font-mono)' }}>{row.val}</strong>
                    </div>
                  ))}
                </div>
                <div style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: computed.growthMomentum > 65 ? 'rgba(34,139,34,0.08)' : computed.growthMomentum > 40 ? 'var(--color-accent-wash)' : 'rgba(197,48,48,0.08)', textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: computed.growthMomentum > 65 ? 'var(--color-ok)' : computed.growthMomentum > 40 ? 'var(--color-accent)' : '#c53030' }}>
                  {computed.growthMomentum > 65 ? 'ACCELERATING' : computed.growthMomentum > 40 ? 'STABLE' : 'DECLINING'}
                </div>
              </div>
            </div>

            {/* Competitive Gap */}
            <div className="card">
              <div className="card-head">
                <h3>Competitive Gaps</h3>
                <span className="tag">{competitors.length} COMPETITORS</span>
              </div>
              <div className="card-body" style={{ padding: '16px 20px' }}>
                {competitors.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>Keyword gaps</div>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: 18 }}>{computed.allGaps.length}</strong>
                    </div>
                    {computed.allGaps.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                        {computed.allGaps.slice(0, 5).map((g, i) => (
                          <span key={i} className="pill warn" style={{ fontSize: 10 }}>{g}</span>
                        ))}
                        {computed.allGaps.length > 5 && <span className="pill" style={{ fontSize: 10 }}>+{computed.allGaps.length - 5}</span>}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>High-threat competitors</div>
                      <span className={`pill ${computed.highThreats.length > 0 ? 'warn' : 'ok'}`}>{computed.highThreats.length}</span>
                    </div>
                    {computed.allShared.length > 0 && (
                      <>
                        <div style={{ fontSize: 12, color: 'var(--color-ink-3)', marginBottom: 6, marginTop: 12 }}>Shared keywords</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {computed.allShared.slice(0, 5).map((s, i) => (
                            <span key={i} className="pill ok" style={{ fontSize: 10 }}>{s}</span>
                          ))}
                          {computed.allShared.length > 5 && <span className="pill" style={{ fontSize: 10 }}>+{computed.allShared.length - 5}</span>}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <p style={{ color: 'var(--color-ink-3)' }}>No competitor data yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Health */}
            <div className="card">
              <div className="card-head">
                <h3>Metadata Health</h3>
                <span className="tag">COVERAGE</span>
              </div>
              <div className="card-body" style={{ padding: '16px 20px' }}>
                {keywords.length > 0 ? (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color: computed.metadataHealth >= 60 ? 'var(--color-ok)' : computed.metadataHealth >= 30 ? 'var(--color-accent)' : '#c53030' }}>{computed.metadataHealth}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-ink-3)', letterSpacing: '0.06em' }}>HEALTH SCORE</div>
                    </div>
                    {[
                      { label: 'Title keywords', count: computed.titleKw, color: 'var(--color-ok)' },
                      { label: 'Subtitle keywords', count: computed.subtitleKw, color: 'var(--color-accent)' },
                      { label: 'Keyword field', count: computed.kwFieldKw, color: '#c9a227' },
                      { label: 'Missing from metadata', count: computed.missingKw, color: '#c53030' },
                    ].map((row, i) => (
                      <div className="row-bar" key={i} style={{ marginBottom: 4 }}>
                        <div className="rb-label" style={{ fontSize: 12 }}>{row.label}</div>
                        <div className="bar" style={{ height: 6, flex: 1 }}>
                          <div className="fill" style={{ width: `${(row.count / (keywords.length || 1)) * 100}%`, background: row.color }} />
                        </div>
                        <div className="rb-val" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{row.count}</div>
                      </div>
                    ))}
                    {computed.missingKw > 0 && (
                      <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(197,48,48,0.06)', fontSize: 12, color: '#c53030' }}>
                        {computed.missingKw} keyword{computed.missingKw !== 1 ? 's' : ''} not in any metadata field
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <p style={{ color: 'var(--color-ink-3)' }}>No keyword data yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* § 10 Quick Wins Matrix */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 10</span>
              <h2>Quick wins <em>matrix</em></h2>
            </div>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="card-head">
                <h3>High-Impact, Low-Effort Actions</h3>
                <span className="tag">{computed.quickWins.length} ACTIONS</span>
              </div>
              <div className="card-body tight">
                {computed.quickWins.length > 0 ? (
                  computed.quickWins.slice(0, 8).map((r, i) => (
                    <div className="review-item" key={i}>
                      <div className="rv-meta">
                        <span style={{ color: 'var(--color-ok)' }}>HIGH IMPACT</span>
                        <span>{r.effort.toUpperCase()} EFFORT</span>
                      </div>
                      <div className="rv-text">{r.title}</div>
                      <div className="rv-action">{r.description}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <p style={{ color: 'var(--color-ink-3)' }}>No quick wins identified yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h3>Untapped Keywords</h3>
                <span className="tag">{computed.untapped.length} OPPORTUNITIES</span>
              </div>
              <div className="card-body tight">
                {computed.untapped.length > 0 ? (
                  computed.untapped.slice(0, 8).map((o, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < Math.min(computed.untapped.length, 8) - 1 ? '1px solid var(--color-line)' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: 13 }}>{o.keyword}</strong>
                        <div style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{o.description}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                        <span className={`pill ${o.volume === 'high' ? 'ok' : o.volume === 'medium' ? 'test' : ''}`} style={{ fontSize: 9 }}>{o.volume} VOL</span>
                        <span className={`pill ${o.competition === 'low' ? 'ok' : o.competition === 'medium' ? 'test' : 'warn'}`} style={{ fontSize: 9 }}>{o.competition} COMP</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: o.score >= 70 ? 'var(--color-ok)' : 'var(--color-accent)' }}>{o.score}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <p style={{ color: 'var(--color-ink-3)' }}>No untapped keyword opportunities found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
