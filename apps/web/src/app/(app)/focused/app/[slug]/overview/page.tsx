'use client'

import { useMemo, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerateContext } from '@/contexts/GenerateContext'
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

export default function OverviewPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const base = `/focused/app/${slug}`

  // --- Data fetching (8 analysis types) ---
  const { data: visibilityData, refetch: refetchVis } = useAnalysis<VisibilityData>(slug, 'visibility')
  const { data: keywordsRaw, refetch: refetchKw } = useAnalysis<KeywordsData>(slug, 'keywords')
  const { data: overviewData, refetch: refetchOverview } = useAnalysis<OverviewData>(slug, 'overview')
  const { data: competitorsRaw, refetch: refetchComp } = useAnalysis<CompetitorsData>(slug, 'competitors')
  const { data: llmTrackRaw, refetch: refetchLlm } = useAnalysis<LlmTrackData>(slug, 'llm-track')
  const { data: recsRaw, refetch: refetchRecs } = useAnalysis<RecommendationsData>(slug, 'recommendations')
  const { data: storeIntelData, refetch: refetchIntel } = useAnalysis<StoreIntelData>(slug, 'store-intel')
  const { data: reviewsData, refetch: refetchReviews } = useAnalysis<ReviewsAnalysisData>(slug, 'reviews-analysis')

  // --- Sync All: fires all analysis types for every V2 page ---
  const [generating, setGenerating] = useState(false)
  const { startGeneration, endGeneration } = useGenerateContext()
  const syncInflight = useRef(false)

  const syncAll = useCallback(async () => {
    if (!slug || syncInflight.current) return
    syncInflight.current = true
    setGenerating(true)
    startGeneration('sync')

    const fire = (action: string) =>
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, appId: slug }),
      }).then(r => { if (!r.ok) throw new Error(`${action} failed`); return r.json().catch(() => null) })

    try {
      // Phase 1 (parallel): core sync + competitors + growth + update-impact
      await Promise.all([
        fire('sync'),
        fire('competitors'),
        fire('growth-insights'),
        fire('update-impact'),
      ])
      // Phase 2 (parallel): analyses that depend on competitors data
      await Promise.all([
        fire('market-intel'),
        fire('creative-lab'),
        fire('conversion'),
      ])

      endGeneration()
      await new Promise(r => setTimeout(r, 500))
      refetchVis(); refetchKw(); refetchRecs(); refetchOverview(); refetchComp(); refetchLlm(); refetchIntel(); refetchReviews()
    } catch (err) {
      endGeneration(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setGenerating(false)
      syncInflight.current = false
    }
  }, [slug, startGeneration, endGeneration, refetchVis, refetchKw, refetchRecs, refetchOverview, refetchComp, refetchLlm, refetchIntel, refetchReviews])

  // --- Data normalization ---
  const keywords = asArray(keywordsRaw) as KeywordItem[]
  const competitors: CompetitorItem[] = Array.isArray(competitorsRaw) ? competitorsRaw : ((competitorsRaw as { competitors?: CompetitorItem[] })?.competitors ?? [])
  const llmResults: LlmTrackItem[] = Array.isArray(llmTrackRaw) ? llmTrackRaw : ((llmTrackRaw as { results?: LlmTrackItem[] })?.results ?? [])
  const recommendations = asArray(recsRaw) as RecommendationItem[]

  // --- Computed KPIs ---
  const computed = useMemo(() => {
    // Prefer keyword rank data from keywords analysis; fall back to visibility analysis breakdown
    const kwRanked = keywords.filter(k => k.rank != null).length
    const visRanked = visibilityData?.rankingDistribution
      ? (visibilityData.rankingDistribution.top3 + visibilityData.rankingDistribution.top10 + visibilityData.rankingDistribution.top25 + visibilityData.rankingDistribution.top50)
      : 0
    const rankedCount = kwRanked || visRanked
    const totalTracked = keywords.length || (visibilityData?.keywordBreakdown?.length ?? 0)

    const asoScore = overviewData?.asoScore != null ? Math.round(overviewData.asoScore) : null
    const visScore = visibilityData?.overallScore ?? null
    const llmMentioned = llmResults.filter(r => r.mentioned).length
    const llmSov = llmResults.length > 0 ? Math.round((llmMentioned / llmResults.length) * 100) : null

    const allGaps = new Set<string>()
    const highThreats = competitors.filter(c => c.threatLevel === 'high')
    competitors.forEach(c => { c.keywordGaps?.forEach(g => allGaps.add(g)) })

    return { rankedCount, totalTracked, asoScore, visScore, llmMentioned, llmSov, llmTotal: llmResults.length, allGaps: Array.from(allGaps), highThreats }
  }, [keywords, overviewData, visibilityData, llmResults, competitors])

  // --- Recommendation sort + filter ---
  const recAccessors = useMemo(() => ({
    title: (r: RecommendationItem) => r.title,
    impact: (r: RecommendationItem) => r.impact === 'high' ? 3 : r.impact === 'medium' ? 2 : 1,
    effort: (r: RecommendationItem) => r.effort === 'high' ? 3 : r.effort === 'medium' ? 2 : 1,
    category: (r: RecommendationItem) => r.category,
  }), [])

  const [recFilter, setRecFilter] = useState<string | null>(null)
  const filteredRecs = recFilter ? recommendations.filter(r => r.impact === recFilter) : recommendations
  const { sorted: sortedRecs, sortKey: rSortKey, sortDir: rSortDir, toggle: rToggle } = useTableSort(filteredRecs, recAccessors)

  // --- Keyword sort ---
  const kwAccessors = useMemo(() => ({
    keyword: (k: KeywordItem) => k.keyword,
    rank: (k: KeywordItem) => k.rank ?? 9999,
    volume: (k: KeywordItem) => k.volume ?? 0,
    delta7d: (k: KeywordItem) => k.delta7d ?? 0,
  }), [])
  const { sorted: sortedKw, sortKey: kwSortKey, sortDir: kwSortDir, toggle: kwToggle } = useTableSort(keywords, kwAccessors)

  const avgRating = reviewsData?.averageRating != null ? reviewsData.averageRating.toFixed(1) : '—'

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Overview', isActive: true }]} />
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

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'Overview', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Sync All Data'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Every signal, one <em>command center</em>.</>}
        subtitle="Keywords, competitors, LLM presence, and recommendations — consolidated for fast decision-making."
        meta={
          <>
            ASO SCORE <strong>{computed.asoScore ?? '—'}</strong><br />
            VISIBILITY <strong>{computed.visScore ?? '—'}</strong><br />
            KEYWORDS <strong>{computed.totalTracked}</strong><br />
            RATING <strong>{avgRating}</strong>
          </>
        }
      />

      <div className="content">

        {/* KPI Strip */}
        <div className="kpi-strip">
          <div className="kpi hl" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ScoreRing score={computed.asoScore ?? 0} />
            <div>
              <div className="label">ASO Score</div>
              <div className="value">{computed.asoScore ?? '—'}</div>
            </div>
          </div>
          <div className="kpi">
            <div className="label">Visibility Score</div>
            <div className="value">{computed.visScore ?? '—'}</div>
            <div className="delta">{visibilityData?.scoreDelta ?? '—'}</div>
          </div>
          <div className="kpi">
            <div className="label">Keywords Ranked</div>
            <div className="value">{computed.rankedCount || '—'}</div>
            <div className="delta">of {computed.totalTracked} tracked</div>
          </div>
          <div className="kpi">
            <div className="label">LLM Share of Voice</div>
            <div className="value">{computed.llmSov != null ? `${computed.llmSov}%` : '—'}</div>
            <div className="delta">{computed.llmMentioned}/{computed.llmTotal} engines</div>
          </div>
          <div className="kpi">
            <div className="label">Avg Rating</div>
            <div className="value">{avgRating}</div>
            <div className="delta">{reviewsData?.realReviewCount ? `${reviewsData.realReviewCount} reviews` : '—'}</div>
          </div>
        </div>

        {/* §01 Keyword snapshot */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 01</span>
              <h2>Keyword <em>snapshot</em></h2>
            </div>
            <Link href={`${base}/keywords`} className="btn ghost" style={{ fontSize: 12 }}>See all &rarr;</Link>
          </div>

          <div className="grid-1-2">
            <div className="card">
              <div className="card-head"><h3>Visibility</h3></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 20px' }}>
                <ScoreRing score={computed.visScore ?? 0} />
                <div style={{ width: '100%' }}>
                  {[
                    { label: 'Category Rank', val: visibilityData?.categoryRank },
                    { label: 'Share of Search', val: visibilityData?.shareOfSearch },
                    { label: 'Keywords in Top 10', val: keywords.filter(k => k.rank != null && k.rank <= 10).length || ((visibilityData?.rankingDistribution?.top3 ?? 0) + (visibilityData?.rankingDistribution?.top10 ?? 0)) || 0 },
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
              <div className="card-head"><h3>Top Keywords</h3><span className="tag">{keywords.length} TRACKED</span></div>
              {keywords.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortHeader label="Keyword" sortKey="keyword" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} />
                      <SortHeader label="Rank" sortKey="rank" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                      <SortHeader label="Volume" sortKey="volume" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                      <SortHeader label="Δ 7d" sortKey="delta7d" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedKw.slice(0, 8).map((k, i) => {
                      const posColor = k.rank == null ? 'var(--color-ink-3)' : k.rank <= 10 ? 'var(--color-ok)' : k.rank <= 25 ? 'var(--color-accent)' : 'var(--color-ink)'
                      const deltaColor = (k.delta7d ?? 0) > 0 ? 'var(--color-ok)' : (k.delta7d ?? 0) < 0 ? '#c53030' : 'var(--color-ink-3)'
                      return (
                        <tr key={i}>
                          <td><strong>{k.keyword}</strong></td>
                          <td className="tn num-big" style={{ color: posColor, fontWeight: 600 }}>{k.rank != null ? `#${k.rank}` : '—'}</td>
                          <td className="tn num-big">{fmtNum(k.volume)}</td>
                          <td className="tn num-big" style={{ color: deltaColor }}>{k.delta7d != null ? (k.delta7d > 0 ? `+${k.delta7d}` : k.delta7d) : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No keyword data yet.</p>
                  <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* §02 Competitor threats */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 02</span>
              <h2>Competitor <em>threats</em></h2>
            </div>
            <Link href={`${base}/competitors`} className="btn ghost" style={{ fontSize: 12 }}>Full analysis &rarr;</Link>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-head"><h3>Top Competitors</h3><span className="tag">{competitors.length} TRACKED</span></div>
              <div className="card-body tight">
                {competitors.length > 0 ? (
                  competitors.slice(0, 5).map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < Math.min(competitors.length, 5) - 1 ? '1px solid var(--color-line)' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: 13 }}>{c.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>
                          {c.sharedKeywords?.length ? `${c.sharedKeywords.length} shared kw` : '—'}
                          {c.keywordGaps?.length ? ` · ${c.keywordGaps.length} gaps` : ''}
                        </div>
                      </div>
                      <span className={`pill ${c.threatLevel === 'high' ? 'warn' : c.threatLevel === 'medium' ? 'test' : 'ok'}`}>{c.threatLevel.toUpperCase()}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                    <p style={{ marginBottom: 12 }}>No competitor data yet.</p>
                    <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h3>Keyword Gaps</h3><span className="tag">{computed.allGaps.length} GAPS</span></div>
              <div className="card-body">
                {computed.allGaps.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                      {computed.allGaps.slice(0, 10).map((g, i) => (
                        <span key={i} className="pill warn" style={{ fontSize: 11 }}>{g}</span>
                      ))}
                      {computed.allGaps.length > 10 && <span className="pill" style={{ fontSize: 11 }}>+{computed.allGaps.length - 10}</span>}
                    </div>
                    {computed.highThreats.length > 0 && (
                      <div className="callout" style={{ margin: 0 }}>
                        <div className="callout-label">High threats</div>
                        <p>{computed.highThreats.map(c => c.name).join(', ')}</p>
                      </div>
                    )}
                  </>
                ) : competitors.length > 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-ink-3)' }}>
                    <p>No keyword gaps found — you&apos;re covering all competitor keywords!</p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                    <p>Run competitor analysis to see keyword gaps.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* §03 LLM Share of Voice */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 03</span>
              <h2>LLM <em>share of voice</em></h2>
            </div>
            <Link href={`${base}/llm-discovery`} className="btn ghost" style={{ fontSize: 12 }}>Full tracker &rarr;</Link>
          </div>

          <div className="card">
            <div className="card-body">
              {llmResults.length > 0 ? (
                <>
                  {llmResults.map((r, i) => {
                    const posPct = r.position === '1st' ? 100 : r.position === '2nd' ? 75 : r.position === '3rd' ? 50 : 10
                    return (
                      <div className="row-bar" key={i}>
                        <div className="rb-label" style={{ minWidth: 140 }}>{r.surface}</div>
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
                    <div>Share of Voice <strong style={{ color: 'var(--color-ink)' }}>{computed.llmSov != null ? `${computed.llmSov}%` : '—'}</strong></div>
                    <div>Cited In <strong style={{ color: 'var(--color-ink)' }}>{computed.llmMentioned}/{computed.llmTotal}</strong></div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No LLM tracking data yet.</p>
                  <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* §04 Top Recommendations */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">&sect; 04</span>
              <h2>Top <em>recommendations</em></h2>
            </div>
            <div className="chip-row">
              <span className={`chip${recFilter === null ? ' on' : ''}`} onClick={() => setRecFilter(null)}>All</span>
              <span className={`chip${recFilter === 'high' ? ' on' : ''}`} onClick={() => setRecFilter(recFilter === 'high' ? null : 'high')}>High</span>
              <span className={`chip${recFilter === 'medium' ? ' on' : ''}`} onClick={() => setRecFilter(recFilter === 'medium' ? null : 'medium')}>Medium</span>
              <span className={`chip${recFilter === 'low' ? ' on' : ''}`} onClick={() => setRecFilter(recFilter === 'low' ? null : 'low')}>Low</span>
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
                  {sortedRecs.slice(0, 10).map((r, i) => (
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
              {recommendations.length > 10 && (
                <div style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, color: 'var(--color-ink-3)' }}>
                  Showing top 10 of {recommendations.length} recommendations
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                <p style={{ marginBottom: 12 }}>No recommendations yet. Generate an analysis to get prioritized actions.</p>
                <button className="btn accent" onClick={() => syncAll()} disabled={generating}>{generating ? 'Syncing...' : 'Generate'}</button>
              </div>
            </div>
          )}
        </section>

      </div>
    </>
  )
}
