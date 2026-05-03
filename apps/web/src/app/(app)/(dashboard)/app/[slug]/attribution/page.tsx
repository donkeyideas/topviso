'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { GrowthInsightsData } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo } from 'react'

type KwVis = NonNullable<GrowthInsightsData['keywordVisibility']>[number]

function TrendChart({ dates, values, label, color = 'var(--color-accent)' }: { dates: string[]; values: number[]; label: string; color?: string }) {
  if (dates.length < 2) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 500
  const h = 120
  const padX = 0
  const padY = 10

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * (w - padX * 2)
    const y = padY + (1 - (v - min) / range) * (h - padY * 2)
    return `${x},${y}`
  })

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--color-ink-3)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      <svg viewBox={`0 0 ${w} ${h + 30}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = padY + (1 - pct) * (h - padY * 2)
          const val = min + pct * range
          return (
            <g key={pct}>
              <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="var(--color-line)" strokeWidth="0.5" />
              <text x={w - padX + 4} y={y + 3} fontSize="9" fill="var(--color-ink-4)">{val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(val < 10 ? 1 : 0)}</text>
            </g>
          )
        })}
        {/* Line */}
        <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => {
          const [x, y] = p.split(',').map(Number)
          return <circle key={i} cx={x} cy={y} r="3" fill={color} />
        })}
        {/* Date labels */}
        {dates.map((d, i) => {
          if (dates.length > 8 && i % 2 !== 0 && i !== dates.length - 1) return null
          const x = padX + (i / (dates.length - 1)) * (w - padX * 2)
          return <text key={i} x={x} y={h + 20} fontSize="9" fill="var(--color-ink-4)" textAnchor="middle">{d}</text>
        })}
      </svg>
    </div>
  )
}

export default function GrowthInsightsPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const isIOS = appData?.platform === 'ios'
  const { data: analysis, refetch } = useAnalysis<GrowthInsightsData>(slug, 'growth-insights')
  const { generate, generating } = useGenerate(slug, 'growth-insights', { onSuccess: refetch })

  const kwVis = analysis?.keywordVisibility ?? []
  const recommendations = analysis?.growthRecommendations ?? []

  // Keyword visibility sorting
  const kwAccessors = useMemo(() => ({
    keyword: (k: KwVis) => k.keyword,
    rank: (k: KwVis) => k.rank ?? 999,
    volume: (k: KwVis) => k.volume,
    estimatedTraffic: (k: KwVis) => k.estimatedTraffic,
  }), [])
  const { sorted: sortedKws, sortKey, sortDir, toggle } = useTableSort(kwVis, kwAccessors)

  const rankingCount = kwVis.filter(k => k.rank !== null).length

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Growth Insights', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '\u2014' },
          { label: 'Growth Insights', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Real growth, <em>measured</em>.</>}
        subtitle={analysis?.summary ?? 'Install trends, rating growth, keyword-driven traffic estimates, and AI growth recommendations \u2014 all from real data.'}
        meta={
          <>
            INSTALLS · <strong>{analysis?.currentInstalls || '\u2014'}</strong><br />
            RATING · <strong>{analysis?.currentRating ? `${analysis.currentRating.toFixed(1)}/5` : '\u2014'}</strong><br />
            VISIBILITY · <strong>{analysis?.visibilityScore ?? '\u2014'}</strong>
          </>
        }
      />

      <div className="content">
        {/* KPI strip */}
        <div className="kpi-strip cols-4">
          <div className="kpi hl">
            <div className="label">Total installs</div>
            <div className="value">{analysis?.currentInstalls || '\u2014'}</div>
            <div className="delta">{analysis?.isAndroid === false ? 'not available for iOS' : analysis ? 'from Play Store' : 'generate to populate'}</div>
          </div>
          <div className="kpi">
            <div className="label">Rating</div>
            <div className="value">{analysis?.currentRating ? analysis.currentRating.toFixed(1) : '\u2014'}</div>
            <div className="delta">{analysis?.currentRatings ? `${analysis.currentRatings.toLocaleString()} ratings` : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Keywords ranking</div>
            <div className="value">{analysis ? `${rankingCount}/${kwVis.length}` : '\u2014'}</div>
            <div className="delta">{analysis ? 'tracked keywords with rank' : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Visibility score</div>
            <div className="value">{analysis?.visibilityScore ?? '\u2014'}</div>
            <div className="delta">{analysis ? 'from visibility analysis' : '\u2014'}</div>
          </div>
        </div>

        {/* 01 Install Trend — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 01</span><h2>Install <em>trend</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Weekly install estimates from store data.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {analysis?.installTrend && analysis.installTrend.dates.length >= 2 ? (
                <TrendChart dates={analysis.installTrend.dates} values={analysis.installTrend.values} label="Estimated installs (weekly avg)" color="var(--color-accent)" />
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  {isIOS || analysis?.isAndroid === false ? (
                    <p>Install data is not available for iOS apps. Apple does not expose download counts through public APIs.</p>
                  ) : (
                    <>
                      <p style={{ marginBottom: 12 }}>No install trend data yet.</p>
                      <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 02 Rating & Reviews Growth — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 02</span><h2>Rating &amp; reviews <em>growth</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Rating score and review count over time from store snapshots.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {analysis?.ratingTrend && analysis.ratingTrend.dates.length >= 2 ? (
                <div className="grid-2">
                  <TrendChart dates={analysis.ratingTrend.dates} values={analysis.ratingTrend.scores} label="Rating score" color="var(--color-ok)" />
                  <TrendChart dates={analysis.ratingTrend.dates} values={analysis.ratingTrend.counts} label="Total ratings count" color="#6366f1" />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  {analysis && !analysis.currentRating ? (
                    <p>This app has no rating yet. Rating trends will appear once users start rating the app.</p>
                  ) : (
                    <>
                      <p style={{ marginBottom: 12 }}>No rating trend data yet. Data accumulates over time from daily snapshots.</p>
                      <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 03 Keyword-Driven Traffic — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 03</span><h2>Keyword-driven <em>traffic</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Estimated organic traffic from keyword rankings x search volume.</div>
            </div>
          </div>
          <div className="card">
            {analysis?.totalEstimatedTraffic !== undefined && (
              <div className="card-head">
                <h3>Total estimated traffic</h3>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{analysis.totalEstimatedTraffic.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-ink-3)' }}> /month</span></span>
              </div>
            )}
            <div className="card-body tight">
              {sortedKws.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortHeader label="Keyword" sortKey="keyword" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} />
                      <SortHeader label="Rank" sortKey="rank" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                      <SortHeader label="Volume EST." sortKey="volume" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                      <SortHeader label="Est. Traffic" sortKey="estimatedTraffic" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                      <th className="tn">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedKws.map((k, i) => (
                      <tr key={i}>
                        <td><strong>{k.keyword}</strong></td>
                        <td className="tn num-big">
                          {k.rank ? (
                            <span style={{ color: k.rank <= 10 ? 'var(--color-ok)' : k.rank <= 50 ? '#d97706' : 'var(--color-ink-2)', fontWeight: 700 }}>#{k.rank}</span>
                          ) : (
                            <span style={{ color: 'var(--color-ink-4)' }}>&mdash;</span>
                          )}
                        </td>
                        <td className="tn num-big">{k.volume.toLocaleString()}</td>
                        <td className="tn num-big">
                          <strong style={{ color: k.estimatedTraffic > 1000 ? 'var(--color-ok)' : k.estimatedTraffic > 100 ? '#d97706' : 'var(--color-ink-2)' }}>
                            {k.estimatedTraffic.toLocaleString()}
                          </strong>
                        </td>
                        <td className="tn">
                          <span className={`pill ${k.trend === 'up' ? 'ok' : k.trend === 'down' ? 'warn' : ''}`}>
                            {k.trend === 'up' ? 'UP' : k.trend === 'down' ? 'DOWN' : 'STABLE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No keyword visibility data yet. Generate keywords first, then run Growth Insights.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 04 Growth Recommendations — AI ANALYSIS */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 04</span><h2>Growth <em>recommendations</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>Strategic growth advice based on your real data.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {recommendations.length > 0 ? (
                recommendations.map((r, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{
                      background: r.impact === 'high' ? '#ef4444' : r.impact === 'medium' ? '#d97706' : 'var(--color-ok)',
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="comp-name">{r.title}</div>
                      <div className="comp-meta">{r.detail}</div>
                    </div>
                    <span className={`pill ${r.impact === 'high' ? 'warn' : r.impact === 'medium' ? 'test' : 'ok'}`}>{r.impact.toUpperCase()}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No growth recommendations yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
