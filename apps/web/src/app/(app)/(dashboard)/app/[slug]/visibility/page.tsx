'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { VisibilityData } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo } from 'react'

type KwBreakdown = { keyword: string; position: number | null; volume: number; weight: number; contributionPct: number }

export default function VisibilityPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<VisibilityData>(slug, 'visibility')
  const { generate, generating } = useGenerate(slug, 'visibility', { onSuccess: refetch })
  const kwAccessors = useMemo(() => ({
    keyword: (kw: KwBreakdown) => kw.keyword,
    position: (kw: KwBreakdown) => kw.position ?? 9999,
    volume: (kw: KwBreakdown) => kw.volume,
    weight: (kw: KwBreakdown) => kw.weight,
    contributionPct: (kw: KwBreakdown) => kw.contributionPct,
  }), [])
  const kwData = (analysis?.keywordBreakdown ?? []) as KwBreakdown[]
  const { sorted: sortedKw, sortKey: kwSortKey, sortDir: kwSortDir, toggle: kwToggle } = useTableSort(kwData, kwAccessors)

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Visibility', isActive: true }]} />
        <div className="content">
          <div className="kpi-strip cols-4">
            {[1, 2, 3, 4].map((i) => (
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
          { label: 'Visibility', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn ghost">Export report</button>
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Position-weighted <em>visibility</em>.</>}
        subtitle={analysis?.summary ?? '—'}
        meta={
          <>
            VISIBILITY SCORE <strong>{analysis?.overallScore ?? '—'}</strong><br />
            CATEGORY PERCENTILE <strong>{analysis?.categoryPercentile ?? '—'}</strong><br />
            REFRESHED <strong>{analysis?.refreshedAt ?? '—'}</strong>
          </>
        }
      />

      <div className="content">
        <div className="kpi-strip cols-4">
          <div className="kpi hl">
            <div className="label">Visibility Score</div>
            <div className="value">{analysis?.overallScore ?? '—'}</div>
            <div className="delta">{analysis?.scoreDelta ?? '—'}</div>
          </div>
          <div className="kpi">
            <div className="label">{appData?.platform === 'ios' ? 'App Store' : 'Play Store'} Score</div>
            <div className="value sm">{(appData?.platform === 'ios' ? analysis?.iosScore : analysis?.androidScore) ?? '—'}</div>
            <div className="delta">{analysis?.platformDelta ?? '—'}</div>
          </div>
          <div className="kpi">
            <div className="label">Category Rank</div>
            <div className="value">{analysis?.categoryRank ?? '—'}</div>
            <div className="delta">{analysis?.categoryRankDelta ?? '—'}</div>
          </div>
          <div className="kpi">
            <div className="label">Share of Search</div>
            <div className="value">{analysis?.shareOfSearch ?? '—'}</div>
            <div className="delta">{analysis?.shareOfSearchDelta ?? '—'}</div>
          </div>
        </div>

        {/* § 01 Ranking distribution */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">§ 01</span>
              <h2>Ranking <em>distribution</em></h2>
            </div>
          </div>

          <div className="grid-1-2">
            <div className="card">
              <div className="card-head">
                <h3>Position tiers</h3>
                <span className="tag">{analysis?.rankingDistribution ? `${analysis.rankingDistribution.top50 + analysis.rankingDistribution.notRanked} keywords` : '—'}</span>
              </div>
              <div className="card-body">
                {analysis?.rankingDistribution ? (() => {
                  const d = analysis.rankingDistribution
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
                })() : analysis?.surfaces?.length ? analysis.surfaces.map((s, i) => (
                  <div className="row-bar" key={i}>
                    <div className="rb-label">{s.surface}</div>
                    <div className="bar"><div className={`fill${s.status === 'strong' ? ' accent' : s.status === 'weak' ? ' warn' : ''}`} style={{ width: `${s.score}%` }} /></div>
                    <div className="rb-val">{s.score}</div>
                  </div>
                )) : (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No position tier data yet.</p>
                    <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              {analysis?.recommendations?.length ? (
                <>
                  <div className="card-head">
                    <h3>Recommendations</h3>
                    <span className="tag">ranked by lift</span>
                  </div>
                  <div className="card-body tight">
                    {analysis.recommendations.map((rec, i) => {
                      const sevColor = rec.severity === 'easy-win' ? 'var(--color-ok)' : rec.severity === 'medium' ? 'var(--color-accent)' : 'var(--color-warn, #d44)'
                      const sevLabel = rec.severity === 'easy-win' ? 'EASY WIN' : rec.severity.toUpperCase()
                      return (
                        <div className="review-item" key={i}>
                          <div className="rv-meta">
                            <span style={{ color: sevColor }}>{sevLabel}</span>
                            <span>{rec.effort}</span>
                          </div>
                          <div className="rv-text">{rec.text}</div>
                          <div className="rv-action">{rec.action}</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="card-head">
                    <h3>Keyword contribution</h3>
                    <span className="tag">by visibility weight</span>
                  </div>
                  <div className="card-body tight">
                    {analysis?.keywordBreakdown?.length ? analysis.keywordBreakdown.slice(0, 10).map((kw, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderBottom: '1px solid var(--color-line)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)', width: 24 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kw.keyword}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>
                            #{kw.position ?? '—'} · {kw.volume >= 1000 ? `${(kw.volume / 1000).toFixed(0)}K` : kw.volume} vol
                          </div>
                        </div>
                        <div style={{ width: 80 }}>
                          <div className="bar" style={{ height: 6 }}><div className="fill accent" style={{ width: `${Math.min(kw.contributionPct * 2, 100)}%` }} /></div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, width: 44, textAlign: 'right' }}>{kw.contributionPct}%</span>
                      </div>
                    )) : analysis?.quickWins?.length ? analysis.quickWins.map((qw, i) => (
                      <div className="review-item" key={i}>
                        <div className="rv-meta"><span style={{ color: 'var(--color-ok)' }}>QUICK WIN</span></div>
                        <div className="rv-text">{qw.action}</div>
                        <div className="rv-action">{qw.expectedImpact}</div>
                      </div>
                    )) : (
                      <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                        <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No keyword breakdown yet.</p>
                        <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* § 02 Trend — 90 days */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">§ 02</span>
              <h2>Trend <em>— 90 days</em></h2>
            </div>
          </div>
          {analysis?.trendData && (analysis.trendData.iosPath || analysis.trendData.androidPath || analysis.trendData.medianPath) ? (
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
                  {analysis.trendData.iosPath && (
                    <path d={analysis.trendData.iosPath} fill="none" stroke="#1d3fd9" strokeWidth={2.5} />
                  )}
                  {analysis.trendData.androidPath && (
                    <path d={analysis.trendData.androidPath} fill="none" stroke="#1f6a3a" strokeWidth={2} strokeDasharray="4 3" />
                  )}
                  {analysis.trendData.medianPath && (
                    <path d={analysis.trendData.medianPath} fill="none" stroke="#a8a69b" strokeWidth={1.5} strokeDasharray="2 3" />
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
                <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>
                  {analysis?.trendData?.dates?.length ? 'Trend chart needs at least 2 data points. Re-generate after a few days to build the trend line.' : 'No trend data yet. Generate visibility analysis to start tracking.'}
                </p>
                <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
              </div>
            </div>
          )}
        </section>

        {/* § 03 Keyword contribution breakdown */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">§ 03</span>
              <h2>Keyword contribution <em>breakdown</em></h2>
            </div>
          </div>
          {analysis?.keywordBreakdown?.length ? (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>#</th>
                    <SortHeader label="Keyword" sortKey="keyword" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} />
                    <SortHeader label="Position" sortKey="position" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                    <SortHeader label="Search vol" sortKey="volume" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                    <SortHeader label="Weight" sortKey="weight" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                    <th>Contribution</th>
                    <SortHeader label="% Share" sortKey="contributionPct" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                  </tr>
                </thead>
                <tbody>
                  {sortedKw.map((kw, i) => {
                    const pos = kw.position
                    const posColor = pos == null ? 'var(--color-ink-3)' : pos <= 10 ? 'var(--color-ok)' : pos <= 25 ? 'var(--color-accent)' : pos > 50 ? '#c53030' : 'var(--color-ink)'
                    return (
                      <tr key={i}>
                        <td style={{ color: 'var(--color-ink-3)' }}>{i + 1}</td>
                        <td><strong>{kw.keyword}</strong></td>
                        <td className="tn num-big" style={{ color: posColor, fontWeight: 600 }}>{pos != null ? `#${pos}` : '—'}</td>
                        <td className="tn num-big">{kw.volume >= 1_000_000 ? `${(kw.volume / 1_000_000).toFixed(1)}M` : kw.volume >= 1_000 ? `${(kw.volume / 1_000).toFixed(0)}K` : kw.volume.toLocaleString()}</td>
                        <td className="tn num-big">{(kw.weight * 100).toFixed(2)}%</td>
                        <td>
                          <div className="bar" style={{ height: 6, width: 80 }}><div className="fill warn" style={{ width: `${Math.min(kw.contributionPct * 4, 100)}%` }} /></div>
                        </td>
                        <td className="tn num-big"><strong>{kw.contributionPct.toFixed(1)}%</strong></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div style={{ padding: '12px 20px', fontSize: 12, color: 'var(--color-ink-3)' }}>
                Showing {analysis.keywordBreakdown.length} keywords
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No keyword breakdown data yet.</p>
                <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
