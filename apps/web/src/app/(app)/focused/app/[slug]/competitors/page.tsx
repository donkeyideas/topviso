'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { CompetitorsData, OverviewData, KeywordsData, CompetitorAlert, MarketIntelData } from '@/lib/analysis-types'
import { asArray } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo, useState, useCallback, useRef } from 'react'
import { useGenerateContext } from '@/contexts/GenerateContext'

/* ── Helper functions from market-intel ── */

const nameColor = (rank: number) =>
  rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--color-ink)'

const iconColors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6']

function LeaderboardIcon({ name, iconUrl, rank }: { name: string; iconUrl?: string; rank: number }) {
  const [imgError, setImgError] = useState(false)

  if (iconUrl && !imgError) {
    return (
      <img
        src={iconUrl}
        alt={name}
        style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
        onError={() => setImgError(true)}
      />
    )
  }

  const bg = iconColors[(rank - 1) % iconColors.length]
  const initial = name.charAt(0).toUpperCase()
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 6, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
    }}>
      {initial}
    </div>
  )
}

const ArrowIcon = ({ direction }: { direction: 'up' | 'down' | 'stable' }) =>
  direction === 'up' ? <span style={{ color: 'var(--color-ok)' }}>&#9650;</span>
    : direction === 'down' ? <span style={{ color: 'var(--color-warn)' }}>&#9660;</span>
    : <span style={{ color: 'var(--color-ink-3)' }}>&#8226;</span>

const directionBg = (d: string) =>
  d === 'up' ? 'rgba(34,197,94,0.08)' : d === 'down' ? 'rgba(239,68,68,0.08)' : 'transparent'

/* ── Main page component ── */

export default function CompetitorsV2Page() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''

  // Analysis hooks — competitors + market-intel + overview + keywords
  const { data: compData, refetch: refetchComp } = useAnalysis<CompetitorsData>(slug, 'competitors')
  const { data: miData, refetch: refetchMi } = useAnalysis<MarketIntelData>(slug, 'market-intel')
  const { data: overviewData } = useAnalysis<OverviewData>(slug, 'overview')
  const { data: keywordsData } = useAnalysis<KeywordsData>(slug, 'keywords')

  // Generate hooks — one per analysis type
  const { generate: generateComp, generating: generatingComp } = useGenerate(slug, 'competitors', { onSuccess: refetchComp })
  const { generate: generateMi, generating: generatingMi } = useGenerate(slug, 'market-intel', { onSuccess: refetchMi })

  // Sync All: competitors → market-intel (sequential because MI depends on comp data)
  const [syncingAll, setSyncingAll] = useState(false)
  const { startGeneration, endGeneration } = useGenerateContext()
  const syncRef = useRef(false)

  const syncAll = useCallback(async () => {
    if (!slug || syncRef.current) return
    syncRef.current = true
    setSyncingAll(true)
    startGeneration('competitors')
    const fire = (action: string) =>
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, appId: slug }),
      }).then(r => { if (!r.ok) throw new Error(`${action} failed`); return r.json().catch(() => null) })
    try {
      await fire('competitors')
      await fire('market-intel')
      endGeneration()
      await new Promise(r => setTimeout(r, 500))
      refetchComp(); refetchMi()
    } catch (err) {
      endGeneration(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncingAll(false)
      syncRef.current = false
    }
  }, [slug, startGeneration, endGeneration, refetchComp, refetchMi])

  // Normalize competitors data (can be raw array or { competitors, alerts })
  const competitors = useMemo(() => {
    if (!compData) return []
    if (Array.isArray(compData)) return compData
    return compData.competitors ?? []
  }, [compData])

  const alerts: CompetitorAlert[] = useMemo(() => {
    if (!compData) return []
    if (Array.isArray(compData)) return []
    return compData.alerts ?? []
  }, [compData])

  // Competitor table sort
  const compAccessors = useMemo(() => ({
    name: (c: typeof competitors[number]) => c.name,
    threatLevel: (c: typeof competitors[number]) => c.threatLevel === 'high' ? 3 : c.threatLevel === 'medium' ? 2 : 1,
    overlapCount: (c: typeof competitors[number]) => c.overlapCount ?? 0,
    rating: (c: typeof competitors[number]) => c.rating ?? 0,
  }), [])
  const { sorted: sortedCompetitors, sortKey: cSortKey, sortDir: cSortDir, toggle: cToggle } = useTableSort(competitors, compAccessors)

  // Keyword gap analysis — aggregate from all competitors
  const allKeywordGaps = useMemo(() => {
    const set = new Set<string>()
    competitors.forEach(c => (c.keywordGaps ?? []).forEach(k => set.add(k)))
    return Array.from(set)
  }, [competitors])

  const allSharedKeywords = useMemo(() => {
    const set = new Set<string>()
    competitors.forEach(c => (c.sharedKeywords ?? []).forEach(k => set.add(k)))
    return Array.from(set)
  }, [competitors])

  // Market intel data
  const leaderboard = miData?.categoryLeaderboard ?? []
  const trends = miData?.trends ?? []
  const miCompetitors = miData?.competitors ?? []
  const whitespace = miData?.whitespace ?? []
  const marketOverview = miData?.marketOverview

  // KPI computations
  const competitorsTracked = competitors.length || miData?.competitorsTracked || 0
  const highThreats = competitors.filter(c => c.threatLevel === 'high').length
  const keywordGapsCount = allKeywordGaps.length
  const categoryPosition = miData?.categoryPosition ?? null
  const avgRating = miData?.categoryRatingAvg ??
    (competitors.length > 0
      ? Number((competitors.reduce((s, c) => s + (c.rating ?? 0), 0) / competitors.filter(c => c.rating != null).length).toFixed(1))
      : null)

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Competitors', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '\u2014' },
          { label: 'Competitors', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn ghost" onClick={() => generateComp()} disabled={generatingComp || syncingAll}>
            {generatingComp ? 'Discovering...' : 'Auto-discover'}
          </button>
          <button className="btn ghost" onClick={() => generateMi()} disabled={generatingMi || syncingAll}>
            {generatingMi ? 'Analyzing...' : 'Analyze market'}
          </button>
          <button className="btn accent" onClick={() => syncAll()} disabled={syncingAll || generatingComp || generatingMi}>
            {syncingAll ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Know your <em>market</em>.</>}
        subtitle="Head-to-head competitor matrix, keyword gap analysis, category leaderboard, market trends, and whitespace opportunities — all in one view."
        meta={
          competitors.length || miData ? (
            <>
              COMPETITORS &middot; <strong>{competitorsTracked}</strong><br />
              HIGH THREATS &middot; <strong>{highThreats}</strong><br />
              KEYWORD GAPS &middot; <strong>{keywordGapsCount}</strong>
            </>
          ) : undefined
        }
      />

      <div className="content">
        {/* KPI strip */}
        <div className="kpi-strip cols-5">
          <div className="kpi hl">
            <div className="label">Competitors tracked</div>
            <div className="value">{competitorsTracked || '\u2014'}</div>
            {competitors.length > 0 && <div className="delta">{competitors.filter(c => c.threatLevel === 'high').length} high threat</div>}
          </div>
          <div className="kpi">
            <div className="label">High threats</div>
            <div className="value" style={{ color: highThreats > 0 ? 'var(--color-warn)' : undefined }}>{highThreats || '\u2014'}</div>
            {highThreats > 0 && <div className="delta">requires attention</div>}
          </div>
          <div className="kpi">
            <div className="label">Keyword gaps</div>
            <div className="value">{keywordGapsCount || '\u2014'}</div>
            {keywordGapsCount > 0 && <div className="delta">{allSharedKeywords.length} shared</div>}
          </div>
          <div className="kpi">
            <div className="label">Category position</div>
            <div className="value">{categoryPosition != null ? `#${categoryPosition}` : '\u2014'}</div>
            {leaderboard.length > 0 && <div className="delta">of {leaderboard.length} tracked</div>}
          </div>
          <div className="kpi">
            <div className="label">Avg rating</div>
            <div className="value">{avgRating != null && !isNaN(avgRating) ? avgRating.toFixed(1) : '\u2014'}</div>
            {avgRating != null && !isNaN(avgRating) && <div className="delta">category average</div>}
          </div>
        </div>

        {/* ── § 01 Head-to-head matrix ── */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 01</span><h2>Head-to-head <em>matrix</em></h2></div>
            <div className="section-sub">Sortable competitor comparison with threat levels, keyword overlap, and key metrics.</div>
          </div>
          {competitors.length > 0 ? (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortHeader label="Competitor" sortKey="name" activeSortKey={cSortKey} sortDir={cSortDir} onSort={cToggle} />
                    <SortHeader label="Threat" sortKey="threatLevel" activeSortKey={cSortKey} sortDir={cSortDir} onSort={cToggle} />
                    <SortHeader label="Overlap" sortKey="overlapCount" activeSortKey={cSortKey} sortDir={cSortDir} onSort={cToggle} className="tn" />
                    <SortHeader label="Rating" sortKey="rating" activeSortKey={cSortKey} sortDir={cSortDir} onSort={cToggle} className="tn" />
                    <th>Installs</th>
                    <th>Strengths</th>
                    <th>Weaknesses</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCompetitors.map((comp, i) => (
                    <tr key={i}>
                      <td><strong>{comp.name}</strong>{comp.developer && <div style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{comp.developer}</div>}</td>
                      <td>
                        <span className={`pill ${comp.threatLevel === 'high' ? 'warn' : comp.threatLevel === 'medium' ? 'test' : 'ok'}`}>
                          {comp.threatLevel}
                        </span>
                      </td>
                      <td className="tn num-big">{comp.overlapCount ?? '\u2014'}</td>
                      <td className="tn num-big">{comp.rating != null ? comp.rating.toFixed(1) : '\u2014'}</td>
                      <td className="tn num-big">{comp.installs ?? comp.monthlyDownloads ?? '\u2014'}</td>
                      <td style={{ fontSize: 12, whiteSpace: 'normal', lineHeight: 1.4 }}>
                        {comp.strengths.length > 0 ? comp.strengths.slice(0, 2).join(', ') : '\u2014'}
                      </td>
                      <td style={{ fontSize: 12, whiteSpace: 'normal', lineHeight: 1.4 }}>
                        {comp.weaknesses.length > 0 ? comp.weaknesses.slice(0, 2).join(', ') : '\u2014'}
                      </td>
                      <td style={{ fontSize: 12, whiteSpace: 'normal', lineHeight: 1.4 }}>{comp.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No competitor data yet. Run auto-discover to find your top competitors.</p>
              <button className="btn accent" onClick={() => generateComp()} disabled={generatingComp}>{generatingComp ? 'Discovering...' : 'Auto-discover competitors'}</button>
            </div></div>
          )}
        </section>

        {/* ── § 02 Alerts & moves ── */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 02</span><h2>Alerts &amp; <em>moves</em></h2></div>
            <div className="section-sub">Recent competitor activity, keyword shifts, and opportunities detected.</div>
          </div>
          <div className="card">
            <div className="card-body tight">
              {alerts.length > 0 ? (
                alerts.map((alert, i) => (
                  <div key={i} className="review-item">
                    <div className="rv-meta">
                      <span className="theme" style={{
                        color: alert.type === 'competitor-move' ? 'var(--color-warn)'
                          : alert.type === 'opportunity' ? 'var(--color-ok)'
                          : alert.type === 'ad-move' ? '#d97706'
                          : 'var(--color-accent)',
                      }}>
                        {alert.type.toUpperCase().replace(/-/g, ' ')}
                      </span>
                      <span className="tag">{alert.competitor}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{alert.timeAgo}</span>
                    </div>
                    <div className="rv-text">{alert.text}</div>
                    <div className="rv-action">{alert.action}</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  {competitors.length > 0 ? (
                    <p>No recent alerts. Competitor activity will appear here as changes are detected.</p>
                  ) : (
                    <>
                      <p style={{ marginBottom: '1rem' }}>No alerts yet. Discover competitors first to start tracking their moves.</p>
                      <button className="btn accent" onClick={() => generateComp()} disabled={generatingComp}>{generatingComp ? 'Discovering...' : 'Auto-discover'}</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── § 03 Category leaderboard ── */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 03</span><h2>Category <em>leaderboard</em></h2></div>
            <div className="section-sub">Top apps in your category ranked by position, with ratings and developer info.</div>
          </div>
          {leaderboard.length > 0 ? (
            <div className="card">
              <div className="card-body tight">
                {leaderboard.map((entry, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                    borderBottom: i < leaderboard.length - 1 ? '1px solid var(--color-line)' : 'none',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                      color: nameColor(entry.rank), minWidth: 20, textAlign: 'right',
                    }}>
                      #{entry.rank}
                    </span>
                    <LeaderboardIcon name={entry.name} {...(entry.iconUrl ? { iconUrl: entry.iconUrl } : {})} rank={entry.rank} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: nameColor(entry.rank), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</div>
                      {entry.developer && <div style={{ fontSize: 11, color: 'var(--color-ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.developer}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>
                        {entry.rating != null ? entry.rating.toFixed(1) : '\u2014'}
                      </span>
                      <span style={{ color: '#eab308', fontSize: 12 }}>&#9733;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No leaderboard data yet. Analyze your market to see category rankings.</p>
              <button className="btn accent" onClick={() => generateMi()} disabled={generatingMi}>{generatingMi ? 'Analyzing...' : 'Analyze market'}</button>
            </div></div>
          )}
        </section>

        {/* ── § 04 Keyword gap analysis ── */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 04</span><h2>Keyword <em>gap analysis</em></h2></div>
            <div className="section-sub">Keywords your competitors rank for that you don&rsquo;t, and keywords you share.</div>
          </div>
          <div className="grid-2">
            {/* Gaps */}
            <div className="card">
              <div className="card-head"><h3>Keyword gaps</h3>{allKeywordGaps.length > 0 && <span className="tag warn">{allKeywordGaps.length} gaps</span>}</div>
              <div className="card-body">
                {allKeywordGaps.length > 0 ? (
                  <div className="topic-chips">
                    {allKeywordGaps.map((kw, i) => (
                      <div key={i} className="topic-chip">{kw}</div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-ink-3)' }}>
                    {competitors.length > 0 ? (
                      <p>No keyword gaps detected. You share all tracked keywords with competitors.</p>
                    ) : (
                      <>
                        <p style={{ marginBottom: '1rem' }}>Discover competitors to identify keyword gaps.</p>
                        <button className="btn accent" onClick={() => generateComp()} disabled={generatingComp}>{generatingComp ? 'Discovering...' : 'Auto-discover'}</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Shared keywords */}
            <div className="card">
              <div className="card-head"><h3>Shared keywords</h3>{allSharedKeywords.length > 0 && <span className="tag ok">{allSharedKeywords.length} shared</span>}</div>
              <div className="card-body">
                {allSharedKeywords.length > 0 ? (
                  <div className="topic-chips">
                    {allSharedKeywords.map((kw, i) => (
                      <div key={i} className="topic-chip on">{kw}</div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-ink-3)' }}>
                    {competitors.length > 0 ? (
                      <p>No shared keywords found across competitors.</p>
                    ) : (
                      <p>Discover competitors to see shared keywords.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── § 05 Market trends ── */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 05</span><h2>Market <em>trends</em></h2></div>
            <div className="section-sub">Emerging trends in your category with direction indicators and relevance scoring.</div>
          </div>
          {trends.length > 0 ? (
            <div className="card">
              <div className="card-body">
                {trends.map((trend, i) => (
                  <div key={i} className="comp-row" style={{
                    background: directionBg(trend.direction),
                    borderBottom: i < trends.length - 1 ? '1px solid var(--color-line)' : 'none',
                  }}>
                    <div className="comp-icon" style={{ background: directionBg(trend.direction) }}>
                      <ArrowIcon direction={trend.direction} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="comp-name">{trend.trend}</div>
                      <div className="comp-meta">{trend.detail}</div>
                    </div>
                    <span className={`pill ${trend.relevance === 'high' ? 'warn' : trend.relevance === 'medium' ? 'test' : ''}`}>
                      {trend.relevance.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No market trend data yet. Analyze your market to discover category trends.</p>
              <button className="btn accent" onClick={() => generateMi()} disabled={generatingMi}>{generatingMi ? 'Analyzing...' : 'Analyze market'}</button>
            </div></div>
          )}

          {/* Top competitors from market-intel */}
          {miCompetitors.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-head"><h3>Top competitors</h3><span className="tag">{miCompetitors.length} tracked</span></div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Competitor</th>
                    <th>Threat</th>
                    <th className="tn">Rating</th>
                    <th className="tn">Installs</th>
                  </tr>
                </thead>
                <tbody>
                  {miCompetitors.map((comp, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{comp.name}</strong>
                        {comp.reason && <div style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{comp.reason}</div>}
                      </td>
                      <td>
                        <span className={`pill ${comp.threatLevel === 'high' ? 'warn' : comp.threatLevel === 'medium' ? 'test' : 'ok'}`}>
                          {comp.threatLevel}
                        </span>
                      </td>
                      <td className="tn num-big">
                        {comp.rating != null ? comp.rating.toFixed(1) : '\u2014'}
                      </td>
                      <td className="tn num-big">{comp.installs || '\u2014'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── § 06 Whitespace opportunities ── */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 06</span><h2>Whitespace <em>opportunities</em></h2></div>
            <div className="section-sub">Unserved audiences and market gaps where you can differentiate.</div>
          </div>
          {whitespace.length > 0 ? (
            <div className="card">
              <div className="card-body tight">
                {whitespace.map((ws, i) => (
                  <div key={i} className="review-item">
                    <div className="rv-meta">
                      <span className="theme" style={{ color: 'var(--color-ok)' }}>{ws.gap.toUpperCase()}</span>
                      <span className="tag">{ws.audience}</span>
                    </div>
                    <div className="rv-text">{ws.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No whitespace opportunities yet. Analyze your market to uncover gaps.</p>
              <button className="btn accent" onClick={() => generateMi()} disabled={generatingMi}>{generatingMi ? 'Analyzing...' : 'Analyze market'}</button>
            </div></div>
          )}
        </section>

        {/* Market saturation callout */}
        {marketOverview && (
          <div className="callout" style={{ marginTop: 8 }}>
            <div className="callout-label">MARKET SATURATION &middot; {marketOverview.saturation.toUpperCase()}</div>
            <p><strong>{marketOverview.growth}</strong> &mdash; {marketOverview.insight}</p>
          </div>
        )}
      </div>
    </>
  )
}
