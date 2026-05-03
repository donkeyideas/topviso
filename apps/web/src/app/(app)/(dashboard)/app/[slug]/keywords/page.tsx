'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { KeywordsData } from '@/lib/analysis-types'
import { asArray } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo } from 'react'

export default function KeywordsPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<KeywordsData>(slug, 'keywords')
  const { generate, generating } = useGenerate(slug, 'keywords', { onSuccess: refetch })
  const keywords = asArray(analysis)
  const accessors = useMemo(() => ({
    keyword: (kw: (typeof keywords)[0]) => kw.keyword,
    rank: (kw: (typeof keywords)[0]) => kw.rank ?? 9999,
    volume: (kw: (typeof keywords)[0]) => kw.volume ?? 0,
    difficulty: (kw: (typeof keywords)[0]) => kw.difficulty,
    delta7d: (kw: (typeof keywords)[0]) => kw.delta7d ?? 0,
    kei: (kw: (typeof keywords)[0]) => kw.kei ?? '',
    topCompetitor: (kw: (typeof keywords)[0]) => kw.topCompetitor ?? '',
    field: (kw: (typeof keywords)[0]) => kw.field ?? '',
    cpc: (kw: (typeof keywords)[0]) => kw.cpc ?? 0,
    relevance: (kw: (typeof keywords)[0]) => kw.relevance,
    intent: (kw: (typeof keywords)[0]) => kw.intent,
    country: (kw: (typeof keywords)[0]) => kw.country ?? '',
  }), [])
  const { sorted: sortedKeywords, sortKey, sortDir, toggle } = useTableSort(keywords, accessors)

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Keywords', isActive: true }]} />
        <div className="content">
          <div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div>
        </div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'Optimize' },
          { label: 'Keywords', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <div className="top-search"><input type="text" placeholder="Search keywords..." /></div>
          <button className="btn ghost">Refresh Positions</button>
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate More'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>The full keyword <em>playbook</em>.</>}
        subtitle={keywords.length > 0
          ? `Tracking ${keywords.length} ranked keywords with competitor tracking, metadata scoring, and localization diff — in one workspace.`
          : "Click Generate to discover ranked keywords, competitor tracking, metadata scoring, and localization insights for your app."
        }
        meta={
          <>
            KEYWORDS TRACKED · <strong>{keywords.length > 0 ? keywords.length.toLocaleString() : '—'}</strong><br />
            RANKING TOP 10 · <strong>{keywords.length > 0 ? keywords.filter(kw => kw.rank != null && kw.rank <= 10).length : '—'}</strong><br />
            TOP 3 · <strong>{keywords.length > 0 ? keywords.filter(kw => kw.rank != null && kw.rank <= 3).length : '—'}</strong><br />
            REFRESHED · <strong>{keywords.length > 0 ? 'Last sync' : '—'}</strong>
          </>
        }
      />

      <div className="content">
        {/* § 01 Keyword intelligence */}
        <section>
          <div className="section-head">
            <div className="section-head-left">
              <span className="section-num">§ 01</span>
              <h2>Keyword <em>intelligence</em></h2>
            </div>
            <div className="chip-row">
              <span className="chip on">{appData?.platform === 'ios' ? 'App Store' : 'Play Store'} · US</span>
            </div>
          </div>

          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="Keyword" sortKey="keyword" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} style={{ position: 'sticky', left: 0, background: 'var(--color-bg)', zIndex: 2, minWidth: 120 }} />
                  <SortHeader label="Rank" sortKey="rank" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                  <SortHeader label="Vol." sortKey="volume" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                  <SortHeader label="Diff." sortKey="difficulty" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                  <SortHeader label="Δ7d" sortKey="delta7d" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                  <SortHeader label="KEI" sortKey="kei" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                  <SortHeader label="Top Competitor" sortKey="topCompetitor" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} style={{ minWidth: 100, maxWidth: 150 }} />
                  <SortHeader label="Rel." sortKey="relevance" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                  <SortHeader label="Intent" sortKey="intent" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                </tr>
              </thead>
              <tbody>
                {sortedKeywords.length > 0 ? sortedKeywords.map((kw, i) => {
                  const rankColor = kw.rank == null ? 'var(--color-ink-3)' : kw.rank <= 3 ? 'var(--color-ok)' : kw.rank <= 10 ? 'var(--color-accent)' : kw.rank <= 25 ? '#c9a227' : 'var(--color-ink-3)'
                  const diffColor = kw.difficulty < 30 ? 'var(--color-ok)' : kw.difficulty < 60 ? '#c9a227' : 'var(--color-warn, #d44)'
                  const fmtVol = (v?: number) => { if (!v) return '—'; if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K`; return String(v) }
                  return (
                    <tr key={i}>
                      <td style={{ position: 'sticky', left: 0, background: 'var(--color-bg)', zIndex: 1 }}><strong>{kw.keyword}</strong></td>
                      <td className="tn num-big"><span style={{ color: rankColor, fontWeight: 700 }}>{kw.rank != null ? `#${kw.rank}` : '—'}</span></td>
                      <td className="tn num-big">{fmtVol(kw.volume)}</td>
                      <td className="tn num-big">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: diffColor, display: 'inline-block' }} />
                          <span>{kw.difficulty}</span>
                        </span>
                      </td>
                      <td className="tn num-big" style={{ color: kw.delta7d != null ? (kw.delta7d > 0 ? 'var(--color-ok)' : kw.delta7d < 0 ? 'var(--color-warn, #d44)' : 'var(--color-ink-3)') : 'var(--color-ink-3)' }}>
                        {kw.delta7d != null && kw.delta7d !== 0 ? (kw.delta7d > 0 ? `+${kw.delta7d}` : String(kw.delta7d)) : '—'}
                      </td>
                      <td className="tn num-big"><strong>{kw.kei ?? '—'}</strong></td>
                      <td style={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>{kw.topCompetitor ?? '—'}</td>
                      <td className="tn num-big">{kw.relevance}</td>
                      <td className="tn"><span className={`pill ${kw.intent === 'transactional' ? 'accent' : kw.intent === 'commercial' ? 'warn' : kw.intent === 'navigational' ? 'ok' : ''}`} style={{ fontSize: 10, textTransform: 'uppercase' }}>{kw.intent}</span></td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-ink-3)' }}>
                      <p style={{ marginBottom: 12, fontSize: 15 }}>No keyword data yet. Generate an analysis to discover keyword rankings, volume, and competitor insights.</p>
                      <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* § 02 Metadata score + Suggested keywords */}
        <section>
          <div className="grid-1-2">
            <div className="card">
              <div className="card-head">
                <h3>Metadata score</h3>
                <span className="tag">{keywords.length > 0 ? `${keywords.length} keywords tracked` : 'No data yet'}</span>
              </div>
              <div className="card-body">
                {keywords.length > 0 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 32, alignItems: 'center' }}>
                      <div className="score-ring">
                        <svg viewBox="0 0 140 140">
                          <circle className="ring-bg" cx={70} cy={70} r={60} />
                          <circle className="ring-fg" cx={70} cy={70} r={60} strokeDasharray={377} strokeDashoffset={377 - (377 * (keywords.filter(k => k.rank != null).length / Math.max(keywords.length, 1))) } />
                        </svg>
                        <div className="score-val">
                          <span className="sv-num">{keywords.filter(k => k.rank != null).length}</span>
                          <span className="sv-label">ranked of {keywords.length}</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}><span>Keywords with rank</span><strong>{keywords.filter(k => k.rank != null).length}</strong></div>
                          <div className="bar"><div className="fill ok" style={{ width: `${(keywords.filter(k => k.rank != null).length / Math.max(keywords.length, 1)) * 100}%` }} /></div>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}><span>Top 10 positions</span><strong>{keywords.filter(k => k.rank != null && k.rank <= 10).length}</strong></div>
                          <div className="bar"><div className="fill accent" style={{ width: `${(keywords.filter(k => k.rank != null && k.rank <= 10).length / Math.max(keywords.length, 1)) * 100}%` }} /></div>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}><span>Top 3 positions</span><strong>{keywords.filter(k => k.rank != null && k.rank <= 3).length}</strong></div>
                          <div className="bar"><div className="fill accent" style={{ width: `${(keywords.filter(k => k.rank != null && k.rank <= 3).length / Math.max(keywords.length, 1)) * 100}%` }} /></div>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}><span>Avg. difficulty</span><strong>{Math.round(keywords.reduce((a, k) => a + k.difficulty, 0) / keywords.length)}</strong></div>
                          <div className="bar"><div className="fill warn" style={{ width: `${keywords.reduce((a, k) => a + k.difficulty, 0) / keywords.length}%` }} /></div>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}><span>Avg. relevance</span><strong>{Math.round(keywords.reduce((a, k) => a + k.relevance, 0) / keywords.length)}</strong></div>
                          <div className="bar"><div className="fill ok" style={{ width: `${keywords.reduce((a, k) => a + k.relevance, 0) / keywords.length}%` }} /></div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}><span>Total est. volume</span><strong>{(() => { const t = keywords.reduce((a, k) => a + (k.volume ?? 0), 0); return t >= 1000 ? `${(t / 1000).toFixed(0)}K` : String(t) })()}</strong></div>
                          <div className="bar"><div className="fill accent" style={{ width: `${Math.min(100, keywords.reduce((a, k) => a + (k.volume ?? 0), 0) / 1000)}%` }} /></div>
                        </div>
                      </div>
                    </div>
                    {keywords.filter(k => k.rank == null).length > 0 && (
                      <div className="callout warn">
                        <div className="callout-label">Unranked keywords</div>
                        <p>{keywords.filter(k => k.rank == null).length} keyword{keywords.filter(k => k.rank == null).length !== 1 ? 's' : ''} not found in the top 250 store results. Consider optimizing your metadata to improve rankings for these terms.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No metadata score data yet. Generate keyword analysis to see ranking breakdowns.</p>
                    <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h3>Suggested keywords</h3>
                <span className="tag">AI · {keywords.length > 0 ? `${Math.min(keywords.length, 6)} candidates` : 'No candidates'}</span>
              </div>
              <div className="card-body tight">
                <table className="data-table">
                  <tbody>
                    {keywords.length > 0 ? keywords.slice(0, 6).sort((a, b) => b.relevance - a.relevance).map((kw, i) => (
                      <tr key={i}><td><strong>{kw.keyword}</strong><br /><small style={{ color: 'var(--color-ink-3)' }}>{kw.intent}</small></td><td className="tn"><span className="pill ok">+{Math.round(kw.relevance * 3)}</span></td></tr>
                    )) : (
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'center', padding: '36px 24px', color: 'var(--color-ink-3)' }}>
                          <p style={{ marginBottom: 12, fontSize: 14 }}>No suggestions yet. Generate a keyword analysis to see AI-recommended keywords.</p>
                          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
