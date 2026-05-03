'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { StoreIntelData } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo, useState } from 'react'

type AlgoFactor = { factor: string; weight: string; currentStatus: string }
type KwOpp = { keyword: string; description: string; volume: string; competition: string; score: number }

// Deterministic color from app name for leaderboard icons
const iconColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#a855f7']
function nameColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return iconColors[Math.abs(hash) % iconColors.length]
}

function ArrowIcon({ direction }: { direction: string }) {
  const d = (direction ?? '').toLowerCase()
  if (d.includes('up') || d.includes('rising') || d.includes('growing')) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3L15 10H3L9 3Z" fill="white" /></svg>
    )
  }
  if (d.includes('down') || d.includes('declining') || d.includes('falling')) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 15L3 8H15L9 15Z" fill="white" /></svg>
    )
  }
  // stable / flat / neutral / anything else
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="7" width="12" height="4" rx="2" fill="white" /></svg>
  )
}

function LeaderboardIcon({ name, iconUrl }: { name: string; iconUrl?: string | undefined }) {
  const [failed, setFailed] = useState(false)

  if (iconUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt={name}
        width={36}
        height={36}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setFailed(true)}
        style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, objectFit: 'cover' }}
      />
    )
  }

  // Fallback: colored initial letter
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8, background: nameColor(name),
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 15, flexShrink: 0,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function directionBg(direction: string): string {
  const d = (direction ?? '').toLowerCase()
  if (d.includes('up') || d.includes('rising') || d.includes('growing')) return 'var(--color-ok)'
  if (d.includes('down') || d.includes('declining') || d.includes('falling')) return '#ef4444'
  return '#6b7280'
}

export default function StoreIntelPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const isIOS = appData?.platform === 'ios'
  const { data: analysis, refetch } = useAnalysis<StoreIntelData>(slug, 'store-intel')
  const { generate, generating } = useGenerate(slug, 'store-intel', { onSuccess: refetch })

  // Algorithm factors sorting
  const algoAccessors = useMemo(() => ({
    factor: (f: AlgoFactor) => f.factor,
    weight: (f: AlgoFactor) => f.weight === 'high' ? 3 : f.weight === 'medium' ? 2 : 1,
  }), [])
  const algoFactors = (analysis?.algorithmFactors ?? []) as AlgoFactor[]
  const { sorted: sortedFactors, sortKey: fSortKey, sortDir: fSortDir, toggle: fToggle } = useTableSort(algoFactors, algoAccessors)

  // Keyword opportunities sorting
  const kwAccessors = useMemo(() => ({
    keyword: (k: KwOpp) => k.keyword,
    volume: (k: KwOpp) => k.volume === 'high' ? 3 : k.volume === 'medium' ? 2 : 1,
    competition: (k: KwOpp) => k.competition === 'high' ? 3 : k.competition === 'medium' ? 2 : 1,
    score: (k: KwOpp) => k.score,
  }), [])
  const kwOpps = (analysis?.keywordOpportunities ?? []) as KwOpp[]
  const { sorted: sortedKwOpps, sortKey: kwSortKey, sortDir: kwSortDir, toggle: kwToggle } = useTableSort(kwOpps, kwAccessors)

  const kwOppCount = kwOpps.length
  const highImpactTrends = analysis?.categoryTrends?.filter(t => t.impact === 'high').length ?? 0
  const leaderboard = analysis?.categoryLeaderboard ?? []
  const marketTrends = analysis?.marketTrends ?? []

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Store Intel', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '\u2014' },
          { label: 'Store Intel', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>The <em>whole market</em>, mapped.</>}
        subtitle={analysis?.summary ?? 'Category trends, algorithm factors, keyword opportunities, leaderboard, and market trends \u2014 all on one page.'}
        meta={
          <>
            DENSITY · <strong>{analysis?.competitiveDensity?.toUpperCase() ?? '\u2014'}</strong><br />
            OPPORTUNITIES · <strong>{kwOppCount || '\u2014'}</strong><br />
            PLATFORM · <strong>{isIOS ? 'iOS' : 'Android'}</strong>
          </>
        }
      />

      <div className="content">
        {/* KPI strip */}
        <div className="kpi-strip cols-4">
          <div className="kpi hl">
            <div className="label">Keyword opportunities</div>
            <div className="value">{kwOppCount || '\u2014'}</div>
            {kwOppCount > 0 ? <div className="delta">low competition + high relevance</div> : <div className="delta">&mdash;</div>}
          </div>
          <div className="kpi">
            <div className="label">Category density</div>
            <div className="value">{analysis?.competitiveDensity?.toUpperCase() ?? '\u2014'}</div>
            {analysis ? <div className="delta">{leaderboard.length > 0 ? `${leaderboard.length} apps tracked` : 'generate to populate'}</div> : <div className="delta">&mdash;</div>}
          </div>
          <div className="kpi">
            <div className="label">High-impact trends</div>
            <div className="value">{analysis ? highImpactTrends : '\u2014'}</div>
            {analysis ? <div className="delta">{analysis.categoryTrends?.length ?? 0} total trends</div> : <div className="delta">&mdash;</div>}
          </div>
          <div className="kpi">
            <div className="label">Algorithm factors</div>
            <div className="value">{analysis ? algoFactors.length : '\u2014'}</div>
            {analysis ? <div className="delta">{algoFactors.filter(f => f.weight === 'high').length} high weight</div> : <div className="delta">&mdash;</div>}
          </div>
        </div>

        {/* § 01 Market trends — AI ANALYSIS */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 01</span><h2>Market <em>trends</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>Broader industry shifts affecting your app&apos;s vertical.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {marketTrends.length > 0 ? (
                marketTrends.map((t, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{ background: directionBg(t.direction) }}>
                      <ArrowIcon direction={t.direction} />
                    </div>
                    <div>
                      <div className="comp-name">{t.trend}</div>
                      <div className="comp-meta">{t.detail}</div>
                    </div>
                    <span className={`pill ${t.relevance === 'high' ? 'ok' : t.relevance === 'medium' ? 'test' : ''}`}>{t.relevance.toUpperCase()}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No market trend data yet. Generate to discover industry-level shifts and emerging opportunities.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* § 02 Category trends — AI ANALYSIS */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 02</span><h2>Category <em>trends</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>Seasonal patterns and emerging shifts in your app category.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {analysis?.categoryTrends?.length ? (
                analysis.categoryTrends.map((t, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{
                      background: t.impact === 'high' ? 'var(--color-ok)' : t.impact === 'medium' ? '#d97706' : '#6b7280',
                    }}>{i + 1}</div>
                    <div>
                      <div className="comp-name">{t.trend}</div>
                      <div className="comp-meta">{t.action}</div>
                    </div>
                    <span className={`pill ${t.impact === 'high' ? 'ok' : t.impact === 'medium' ? 'test' : ''}`}>{t.impact.toUpperCase()}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No category trend data yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* § 03 Category Leaderboard + Keyword Opportunities */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 03</span><h2>Leaderboard &amp; <em>opportunities</em></h2></div>
          </div>
          <div className="grid-2">
            {/* Category Leaderboard — REAL DATA */}
            <div className="card">
              <div className="card-head">
                <h3>Category Leaderboard</h3>
                <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1, flexShrink: 0 }}>REAL DATA</span>
                {leaderboard.length > 0 && (
                  <span className="pill" style={{ flexShrink: 0, whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(appData?.category ?? 'CATEGORY').toUpperCase()}
                  </span>
                )}
              </div>
              <div className="card-body tight">
                {leaderboard.length > 0 ? (
                  leaderboard.map((app, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      borderBottom: i < leaderboard.length - 1 ? '1px solid var(--color-line)' : 'none',
                    }}>
                      <div style={{
                        width: 24,
                        fontSize: 13,
                        color: app.rank <= 3 ? 'var(--color-ink-1)' : 'var(--color-ink-3)',
                        fontWeight: app.rank <= 3 ? 700 : 400,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}>
                        #{app.rank}
                      </div>
                      <LeaderboardIcon name={app.name} iconUrl={app.iconUrl} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.developer}</div>
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: 'var(--color-ink-2)',
                        flexShrink: 0,
                        whiteSpace: 'nowrap',
                      }}>
                        {app.rating.toFixed(1)}<span style={{ color: '#eab308' }}>&#9733;</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                    <p style={{ marginBottom: 12 }}>No leaderboard data yet.</p>
                    <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                  </div>
                )}
              </div>
            </div>

            {/* Keyword Opportunities — AI ANALYSIS */}
            <div className="card">
              <div className="card-head">
                <h3>Keyword Opportunities</h3>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
                  {kwOppCount > 0 && <span className="tag">LOW COMPETITION</span>}
                </div>
              </div>
              <div className="card-body tight">
                {kwOppCount > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <SortHeader label="Keyword" sortKey="keyword" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} />
                        <SortHeader label="Volume" sortKey="volume" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                        <SortHeader label="Competition" sortKey="competition" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                        <SortHeader label="Score" sortKey="score" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedKwOpps.map((k, i) => (
                        <tr key={i}>
                          <td>
                            <strong style={{ display: 'block' }}>{k.keyword}</strong>
                            <small style={{ color: 'var(--color-ink-3)', fontSize: 11 }}>{k.description}</small>
                          </td>
                          <td className="tn">
                            <span className={`pill ${k.volume === 'high' ? 'ok' : k.volume === 'medium' ? 'test' : ''}`}>{k.volume.toUpperCase()}</span>
                          </td>
                          <td className="tn">
                            <span className={`pill ${k.competition === 'low' ? 'ok' : k.competition === 'medium' ? 'test' : 'warn'}`}>{k.competition.toUpperCase()}</span>
                          </td>
                          <td className="tn num-big">
                            <strong style={{
                              color: k.score >= 80 ? '#22c55e' : k.score >= 60 ? '#d97706' : '#ef4444',
                            }}>
                              {k.score}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                    <p style={{ marginBottom: 12 }}>No keyword opportunity data yet. Generate to discover untapped keywords.</p>
                    <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* § 04 Algorithm factors — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 04</span><h2>Algorithm <em>factors</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Key ranking signals and their current status for your app.</div>
            </div>
          </div>
          <div className="card">
            <table className="data-table">
              <thead><tr><SortHeader label="Factor" sortKey="factor" activeSortKey={fSortKey} sortDir={fSortDir} onSort={fToggle} /><SortHeader label="Weight" sortKey="weight" activeSortKey={fSortKey} sortDir={fSortDir} onSort={fToggle} className="tn" /><th>Current Status</th></tr></thead>
              <tbody>
                {sortedFactors.length > 0 ? (
                  sortedFactors.map((f, i) => (
                    <tr key={i}>
                      <td><strong>{f.factor}</strong></td>
                      <td className="tn num-big"><span className={`pill ${f.weight === 'high' ? 'ok' : f.weight === 'medium' ? 'test' : ''}`}>{f.weight.toUpperCase()}</span></td>
                      <td>{f.currentStatus}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                      <p style={{ marginBottom: 12 }}>No algorithm factor data yet.</p>
                      <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* § 05 Featuring tips — AI ANALYSIS */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 05</span><h2>Featuring <em>tips</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>How to get featured by {isIOS ? 'Apple' : 'Google'}.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {analysis?.featuringTips?.length ? (
                analysis.featuringTips.map((tip, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{ background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13 }}>{tip}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No featuring tips yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Competitive density callout */}
        {analysis?.summary && (
          <section>
            <div className="callout">
              <div className="callout-label">Competitive density: <strong>{analysis.competitiveDensity?.toUpperCase()}</strong></div>
              <p>{analysis.summary}</p>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
