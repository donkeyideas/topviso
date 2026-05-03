'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type {
  KeywordsData,
  VisibilityData,
  IntentMapData,
  IntentKeyword,
  KeywordAudiencesData,
} from '@/lib/analysis-types'
import { asArray } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo, useState } from 'react'

type Tab = 'rankings' | 'visibility' | 'intent' | 'audiences'

type KwBreakdown = { keyword: string; position: number | null; volume: number; weight: number; contributionPct: number }
type Gap = IntentMapData['gaps'][number]
type Audience = NonNullable<KeywordAudiencesData['audiences']>[number]
type AudienceKw = { keyword: string; state: string; rank: number | null; volume: number }

function normalizeKw(kw: string | IntentKeyword): { kw: string; state: 'ours' | 'win' | 'miss' } {
  if (typeof kw === 'string') return { kw, state: 'ours' }
  return kw
}

function CoverageBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? 'var(--color-ok)' : pct >= 40 ? '#d97706' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--color-line)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 32 }}>{pct}%</span>
    </div>
  )
}

function kwStateColor(state: string): string {
  if (state === 'ours') return 'var(--color-ok)'
  if (state === 'win') return '#d97706'
  return '#ef4444'
}

function kwStateBg(state: string): string {
  if (state === 'ours') return 'var(--color-ok-wash)'
  if (state === 'win') return '#fef3c7'
  return 'var(--color-warn-wash)'
}

export default function KeywordsV2Page() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''

  const [activeTab, setActiveTab] = useState<Tab>('rankings')

  // --- Data fetching (all 4 at top level for instant tab switching) ---
  const { data: kwAnalysis, refetch: refetchKw } = useAnalysis<KeywordsData>(slug, 'keywords')
  const { data: visAnalysis, refetch: refetchVis } = useAnalysis<VisibilityData>(slug, 'visibility')
  const { data: intentAnalysis, refetch: refetchIntent } = useAnalysis<IntentMapData>(slug, 'intent-map')
  const { data: audAnalysis, refetch: refetchAud } = useAnalysis<KeywordAudiencesData>(slug, 'keyword-audiences')

  // --- Generate hooks ---
  const { generate: genKw, generating: genningKw } = useGenerate(slug, 'keywords', { onSuccess: refetchKw })
  const { generate: genVis, generating: genningVis } = useGenerate(slug, 'visibility', { onSuccess: refetchVis })
  const { generate: genIntent, generating: genningIntent } = useGenerate(slug, 'intent-map', { onSuccess: refetchIntent })
  const { generate: genAud, generating: genningAud } = useGenerate(slug, 'keyword-audiences', { onSuccess: refetchAud })

  // --- Rankings tab data ---
  const keywords = asArray(kwAnalysis)
  const kwAccessors = useMemo(() => ({
    keyword: (kw: (typeof keywords)[0]) => kw.keyword,
    rank: (kw: (typeof keywords)[0]) => kw.rank ?? 9999,
    volume: (kw: (typeof keywords)[0]) => kw.volume ?? 0,
    difficulty: (kw: (typeof keywords)[0]) => kw.difficulty,
    delta7d: (kw: (typeof keywords)[0]) => kw.delta7d ?? 0,
    kei: (kw: (typeof keywords)[0]) => kw.kei ?? '',
    topCompetitor: (kw: (typeof keywords)[0]) => kw.topCompetitor ?? '',
    relevance: (kw: (typeof keywords)[0]) => kw.relevance,
    intent: (kw: (typeof keywords)[0]) => kw.intent,
  }), [])
  const { sorted: sortedKeywords, sortKey: kwSortKey, sortDir: kwSortDir, toggle: kwToggle } = useTableSort(keywords, kwAccessors)

  // --- Visibility tab data ---
  const visKwAccessors = useMemo(() => ({
    keyword: (kw: KwBreakdown) => kw.keyword,
    position: (kw: KwBreakdown) => kw.position ?? 9999,
    volume: (kw: KwBreakdown) => kw.volume,
    weight: (kw: KwBreakdown) => kw.weight,
    contributionPct: (kw: KwBreakdown) => kw.contributionPct,
  }), [])
  const visKwData = (visAnalysis?.keywordBreakdown ?? []) as KwBreakdown[]
  const { sorted: sortedVisKw, sortKey: visKwSK, sortDir: visKwSD, toggle: visKwToggle } = useTableSort(visKwData, visKwAccessors)

  // --- Intent tab data ---
  const clusters = intentAnalysis?.clusters ?? []
  const hasClusters = clusters.length > 0
  const totalIntentKws = hasClusters ? clusters.reduce((s, c) => s + c.keywords.length, 0) : 0
  const gapAccessors = useMemo(() => ({ intent: (g: Gap) => g.intent }), [])
  const intentGaps = (intentAnalysis?.gaps ?? []) as Gap[]
  const { sorted: sortedGaps, sortKey: gSK, sortDir: gSD, toggle: gT } = useTableSort(intentGaps, gapAccessors)

  // --- Audiences tab data ---
  const audiences = (audAnalysis?.audiences ?? []) as Audience[]
  const uncovered = audAnalysis?.uncoveredKeywords ?? []
  const insights = audAnalysis?.audienceInsights ?? []
  const weakest = audiences.length > 0
    ? audiences.reduce((min: Audience, a: Audience) => a.coveragePct < min.coveragePct ? a : min)
    : null

  // --- Tab-specific actions ---
  const tabActions: Record<Tab, { label: string; generating: boolean; generate: () => void }> = {
    rankings: { label: 'Generate Keywords', generating: genningKw, generate: () => genKw() },
    visibility: { label: 'Generate Visibility', generating: genningVis, generate: () => genVis() },
    intent: { label: 'Cluster Keywords', generating: genningIntent, generate: () => genIntent() },
    audiences: { label: 'Generate Audiences', generating: genningAud, generate: () => genAud() },
  }
  const currentAction = tabActions[activeTab]

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Keywords', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '\u2014' },
          { label: 'Keywords', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={currentAction.generate} disabled={currentAction.generating}>
            {currentAction.generating ? 'Generating\u2026' : currentAction.label}
          </button>
        </div>
      </TopStrip>

      <PageHero
        title={<>The full keyword <em>playbook</em>.</>}
        subtitle="Rankings, visibility scoring, intent clustering, and audience segmentation — all in one workspace."
        meta={
          <>
            KEYWORDS TRACKED &middot; <strong>{keywords.length > 0 ? keywords.length.toLocaleString() : '\u2014'}</strong><br />
            RANKING TOP 10 &middot; <strong>{keywords.length > 0 ? keywords.filter(kw => kw.rank != null && kw.rank <= 10).length : '\u2014'}</strong><br />
            VISIBILITY &middot; <strong>{visAnalysis?.overallScore ?? '\u2014'}</strong>
          </>
        }
      />

      {/* Tab bar */}
      <div style={{ padding: '0 40px 16px' }}>
        <div className="chip-row">
          {(['rankings', 'visibility', 'intent', 'audiences'] as const).map(t => (
            <span
              key={t}
              className={`chip${activeTab === t ? ' on' : ''}`}
              onClick={() => setActiveTab(t)}
              style={{ cursor: 'pointer' }}
            >
              {t === 'rankings' ? 'Rankings' : t === 'visibility' ? 'Visibility' : t === 'intent' ? 'Intent' : 'Audiences'}
            </span>
          ))}
        </div>
      </div>

      <div className="content">
        {/* ═══ RANKINGS TAB ═══ */}
        {activeTab === 'rankings' && (
          <>
            <section>
              <div className="section-head">
                <div className="section-head-left"><span className="section-num">&sect; 01</span><h2>Keyword <em>intelligence</em></h2></div>
                <div className="chip-row">
                  <span className="chip on">{appData?.platform === 'ios' ? 'App Store' : 'Play Store'} &middot; US</span>
                </div>
              </div>
              <div className="card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortHeader label="Keyword" sortKey="keyword" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} style={{ position: 'sticky', left: 0, background: 'var(--color-bg)', zIndex: 2, minWidth: 120 }} />
                      <SortHeader label="Rank" sortKey="rank" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                      <SortHeader label="Vol." sortKey="volume" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                      <SortHeader label="Diff." sortKey="difficulty" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                      <SortHeader label="Δ 7d" sortKey="delta7d" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                      <SortHeader label="KEI" sortKey="kei" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                      <SortHeader label="Top Competitor" sortKey="topCompetitor" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} style={{ minWidth: 100, maxWidth: 150 }} />
                      <SortHeader label="Rel." sortKey="relevance" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                      <SortHeader label="Intent" sortKey="intent" activeSortKey={kwSortKey} sortDir={kwSortDir} onSort={kwToggle} className="tn" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedKeywords.length > 0 ? sortedKeywords.map((kw, i) => {
                      const rankColor = kw.rank == null ? 'var(--color-ink-3)' : kw.rank <= 3 ? 'var(--color-ok)' : kw.rank <= 10 ? 'var(--color-accent)' : kw.rank <= 25 ? '#c9a227' : 'var(--color-ink-3)'
                      const diffColor = kw.difficulty < 30 ? 'var(--color-ok)' : kw.difficulty < 60 ? '#c9a227' : 'var(--color-warn, #d44)'
                      const fmtVol = (v?: number) => { if (!v) return '\u2014'; if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K`; return String(v) }
                      return (
                        <tr key={i}>
                          <td style={{ position: 'sticky', left: 0, background: 'var(--color-bg)', zIndex: 1 }}><strong>{kw.keyword}</strong></td>
                          <td className="tn num-big"><span style={{ color: rankColor, fontWeight: 700 }}>{kw.rank != null ? `#${kw.rank}` : '\u2014'}</span></td>
                          <td className="tn num-big">{fmtVol(kw.volume)}</td>
                          <td className="tn num-big">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: diffColor, display: 'inline-block' }} />
                              <span>{kw.difficulty}</span>
                            </span>
                          </td>
                          <td className="tn num-big" style={{ color: kw.delta7d != null ? (kw.delta7d > 0 ? 'var(--color-ok)' : kw.delta7d < 0 ? 'var(--color-warn, #d44)' : 'var(--color-ink-3)') : 'var(--color-ink-3)' }}>
                            {kw.delta7d != null && kw.delta7d !== 0 ? (kw.delta7d > 0 ? `+${kw.delta7d}` : String(kw.delta7d)) : '\u2014'}
                          </td>
                          <td className="tn num-big"><strong>{kw.kei ?? '\u2014'}</strong></td>
                          <td style={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>{kw.topCompetitor ?? '\u2014'}</td>
                          <td className="tn num-big">{kw.relevance}</td>
                          <td className="tn"><span className={`pill ${kw.intent === 'transactional' ? 'accent' : kw.intent === 'commercial' ? 'warn' : kw.intent === 'navigational' ? 'ok' : ''}`} style={{ fontSize: 10, textTransform: 'uppercase' }}>{kw.intent}</span></td>
                        </tr>
                      )
                    }) : (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-ink-3)' }}>
                          <p style={{ marginBottom: 12, fontSize: 15 }}>No keyword data yet.</p>
                          <button className="btn accent" onClick={() => genKw()} disabled={genningKw}>{genningKw ? 'Generating\u2026' : 'Generate'}</button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Metadata score + Suggested keywords */}
            <section>
              <div className="grid-1-2">
                <div className="card">
                  <div className="card-head"><h3>Metadata score</h3><span className="tag">{keywords.length > 0 ? `${keywords.length} keywords tracked` : 'No data yet'}</span></div>
                  <div className="card-body">
                    {keywords.length > 0 ? (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 32, alignItems: 'center' }}>
                          <div className="score-ring">
                            <svg viewBox="0 0 140 140">
                              <circle className="ring-bg" cx={70} cy={70} r={60} />
                              <circle className="ring-fg" cx={70} cy={70} r={60} strokeDasharray={377} strokeDashoffset={377 - (377 * (keywords.filter(k => k.rank != null).length / Math.max(keywords.length, 1)))} />
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
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                        <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No metadata score data yet.</p>
                        <button className="btn accent" onClick={() => genKw()} disabled={genningKw}>{genningKw ? 'Generating\u2026' : 'Generate'}</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-head"><h3>Suggested keywords</h3><span className="tag">AI &middot; {keywords.length > 0 ? `${Math.min(keywords.length, 6)} candidates` : 'No candidates'}</span></div>
                  <div className="card-body tight">
                    <table className="data-table">
                      <tbody>
                        {keywords.length > 0 ? keywords.slice(0, 6).sort((a, b) => b.relevance - a.relevance).map((kw, i) => (
                          <tr key={i}><td><strong>{kw.keyword}</strong><br /><small style={{ color: 'var(--color-ink-3)' }}>{kw.intent}</small></td><td className="tn"><span className="pill ok">+{Math.round(kw.relevance * 3)}</span></td></tr>
                        )) : (
                          <tr>
                            <td colSpan={2} style={{ textAlign: 'center', padding: '36px 24px', color: 'var(--color-ink-3)' }}>
                              <p style={{ marginBottom: 12, fontSize: 14 }}>No suggestions yet.</p>
                              <button className="btn accent" onClick={() => genKw()} disabled={genningKw}>{genningKw ? 'Generating\u2026' : 'Generate'}</button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ═══ VISIBILITY TAB ═══ */}
        {activeTab === 'visibility' && (
          <>
            <div className="kpi-strip cols-4">
              <div className="kpi hl">
                <div className="label">Visibility Score</div>
                <div className="value">{visAnalysis?.overallScore ?? '\u2014'}</div>
                <div className="delta">{visAnalysis?.scoreDelta ?? '\u2014'}</div>
              </div>
              <div className="kpi">
                <div className="label">{appData?.platform === 'ios' ? 'App Store' : 'Play Store'} Score</div>
                <div className="value sm">{(appData?.platform === 'ios' ? visAnalysis?.iosScore : visAnalysis?.androidScore) ?? '\u2014'}</div>
              </div>
              <div className="kpi">
                <div className="label">Category Rank</div>
                <div className="value">{visAnalysis?.categoryRank ?? '\u2014'}</div>
              </div>
              <div className="kpi">
                <div className="label">Share of Search</div>
                <div className="value">{visAnalysis?.shareOfSearch ?? '\u2014'}</div>
              </div>
            </div>

            {/* Ranking distribution */}
            <section>
              <div className="section-head">
                <div className="section-head-left"><span className="section-num">&sect; 01</span><h2>Ranking <em>distribution</em></h2></div>
              </div>
              <div className="grid-1-2">
                <div className="card">
                  <div className="card-head"><h3>Position tiers</h3></div>
                  <div className="card-body">
                    {visAnalysis?.rankingDistribution ? (() => {
                      const d = visAnalysis.rankingDistribution
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
                        <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No position tier data yet.</p>
                        <button className="btn accent" onClick={() => genVis()} disabled={genningVis}>{genningVis ? 'Generating\u2026' : 'Generate'}</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="card">
                  <div className="card-head"><h3>Keyword contribution</h3><span className="tag">by visibility weight</span></div>
                  <div className="card-body tight">
                    {visAnalysis?.keywordBreakdown?.length ? visAnalysis.keywordBreakdown.slice(0, 10).map((kw, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderBottom: '1px solid var(--color-line)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)', width: 24 }}>{i + 1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kw.keyword}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>#{kw.position ?? '\u2014'} &middot; {kw.volume >= 1000 ? `${(kw.volume / 1000).toFixed(0)}K` : kw.volume} vol</div>
                        </div>
                        <div style={{ width: 80 }}>
                          <div className="bar" style={{ height: 6 }}><div className="fill accent" style={{ width: `${Math.min(kw.contributionPct * 2, 100)}%` }} /></div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, width: 44, textAlign: 'right' }}>{kw.contributionPct}%</span>
                      </div>
                    )) : (
                      <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                        <p style={{ color: 'var(--color-ink-3)', marginBottom: 12 }}>No keyword breakdown yet.</p>
                        <button className="btn accent" onClick={() => genVis()} disabled={genningVis}>{genningVis ? 'Generating\u2026' : 'Generate'}</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Trend */}
            <section>
              <div className="section-head">
                <div className="section-head-left"><span className="section-num">&sect; 02</span><h2>Trend <em>&mdash; 90 days</em></h2></div>
              </div>
              {visAnalysis?.trendData && (visAnalysis.trendData.iosPath || visAnalysis.trendData.androidPath || visAnalysis.trendData.medianPath) ? (
                <div className="card">
                  <div className="chart-frame">
                    <svg viewBox="0 0 800 220" preserveAspectRatio="none">
                      <g stroke="#e4e0d3" strokeWidth={1}>
                        <line x1={0} y1={40} x2={800} y2={40} /><line x1={0} y1={90} x2={800} y2={90} /><line x1={0} y1={140} x2={800} y2={140} /><line x1={0} y1={190} x2={800} y2={190} />
                      </g>
                      <g fontFamily="JetBrains Mono" fontSize={10} fill="#a8a69b">
                        <text x={6} y={36}>100</text><text x={6} y={86}>75</text><text x={6} y={136}>50</text><text x={6} y={186}>25</text>
                      </g>
                      {visAnalysis.trendData.iosPath && <path d={visAnalysis.trendData.iosPath} fill="none" stroke="#1d3fd9" strokeWidth={2.5} />}
                      {visAnalysis.trendData.androidPath && <path d={visAnalysis.trendData.androidPath} fill="none" stroke="#1f6a3a" strokeWidth={2} strokeDasharray="4 3" />}
                      {visAnalysis.trendData.medianPath && <path d={visAnalysis.trendData.medianPath} fill="none" stroke="#a8a69b" strokeWidth={1.5} strokeDasharray="2 3" />}
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
                    <button className="btn accent" onClick={() => genVis()} disabled={genningVis}>{genningVis ? 'Generating\u2026' : 'Generate'}</button>
                  </div>
                </div>
              )}
            </section>

            {/* Keyword contribution breakdown table */}
            {visAnalysis?.keywordBreakdown?.length ? (
              <section>
                <div className="section-head">
                  <div className="section-head-left"><span className="section-num">&sect; 03</span><h2>Keyword contribution <em>breakdown</em></h2></div>
                </div>
                <div className="card">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 48 }}>#</th>
                        <SortHeader label="Keyword" sortKey="keyword" activeSortKey={visKwSK} sortDir={visKwSD} onSort={visKwToggle} />
                        <SortHeader label="Position" sortKey="position" activeSortKey={visKwSK} sortDir={visKwSD} onSort={visKwToggle} className="tn" />
                        <SortHeader label="Search vol" sortKey="volume" activeSortKey={visKwSK} sortDir={visKwSD} onSort={visKwToggle} className="tn" />
                        <SortHeader label="Weight" sortKey="weight" activeSortKey={visKwSK} sortDir={visKwSD} onSort={visKwToggle} className="tn" />
                        <th>Contribution</th>
                        <SortHeader label="% Share" sortKey="contributionPct" activeSortKey={visKwSK} sortDir={visKwSD} onSort={visKwToggle} className="tn" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedVisKw.map((kw, i) => {
                        const pos = kw.position
                        const posColor = pos == null ? 'var(--color-ink-3)' : pos <= 10 ? 'var(--color-ok)' : pos <= 25 ? 'var(--color-accent)' : pos > 50 ? '#c53030' : 'var(--color-ink)'
                        return (
                          <tr key={i}>
                            <td style={{ color: 'var(--color-ink-3)' }}>{i + 1}</td>
                            <td><strong>{kw.keyword}</strong></td>
                            <td className="tn num-big" style={{ color: posColor, fontWeight: 600 }}>{pos != null ? `#${pos}` : '\u2014'}</td>
                            <td className="tn num-big">{kw.volume >= 1_000_000 ? `${(kw.volume / 1_000_000).toFixed(1)}M` : kw.volume >= 1_000 ? `${(kw.volume / 1_000).toFixed(0)}K` : kw.volume.toLocaleString()}</td>
                            <td className="tn num-big">{(kw.weight * 100).toFixed(2)}%</td>
                            <td><div className="bar" style={{ height: 6, width: 80 }}><div className="fill warn" style={{ width: `${Math.min(kw.contributionPct * 4, 100)}%` }} /></div></td>
                            <td className="tn num-big"><strong>{kw.contributionPct.toFixed(1)}%</strong></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </>
        )}

        {/* ═══ INTENT TAB ═══ */}
        {activeTab === 'intent' && (
          <>
            {hasClusters && (
              <div className="kpi-strip cols-4">
                <div className="kpi"><div className="label">Clusters</div><div className="value">{clusters.length}</div></div>
                <div className="kpi"><div className="label">Total keywords</div><div className="value">{totalIntentKws}</div></div>
                <div className="kpi"><div className="label">Dominant intent</div><div className="value sm">{[...clusters].sort((a, b) => b.keywords.length - a.keywords.length)[0]?.intent ?? '\u2014'}</div></div>
                <div className="kpi"><div className="label">Weakest intent</div><div className="value sm" style={{ color: 'var(--color-warn)' }}>{[...clusters].sort((a, b) => a.keywords.length - b.keywords.length)[0]?.intent ?? '\u2014'}</div></div>
              </div>
            )}
            <section>
              <div className="section-head">
                <div className="section-head-left"><span className="section-num">&sect; 01</span><h2>Intent coverage <em>map</em></h2></div>
              </div>
              <div className="grid-2">
                <div className="card">
                  <div className="card-head"><h3>What you cover</h3><span className="tag">pulled from Keywords tab</span></div>
                  <div className="card-body">
                    {hasClusters ? clusters.map((c) => (
                      <div className="intent-cluster" key={c.intent}>
                        <div className="ic-head">
                          <div className="ic-name">{c.intent}</div>
                          <div className="ic-score-wrap">
                            {c.coveragePct != null && (
                              <div style={{ width: 80, height: 4, background: 'var(--color-paper-3, #e0dbce)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 2, width: `${c.coveragePct}%`, background: c.coveragePct >= 60 ? 'var(--color-ok)' : 'var(--color-warn, #d44)' }} />
                              </div>
                            )}
                            <span className="ic-score" style={{ color: c.coveragePct != null ? (c.coveragePct >= 60 ? 'var(--color-ok)' : 'var(--color-warn, #d44)') : undefined }}>
                              {c.optimization}{c.coveragePct != null ? ` \u00b7 ${c.coveragePct}%` : ''}
                            </span>
                          </div>
                        </div>
                        <div>{c.keywords.map((kwRaw, ki) => {
                          const { kw, state } = normalizeKw(kwRaw)
                          return <span className={`kw ${state}`} key={ki}>{kw}</span>
                        })}</div>
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <p style={{ marginBottom: 16, color: 'var(--color-ink-3)' }}>No data yet</p>
                        <button className="btn accent" onClick={() => genIntent()} disabled={genningIntent}>{genningIntent ? 'Clustering\u2026' : 'Generate'}</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="card">
                  <div className="card-head"><h3>Recommended moves</h3><span className="tag">routes to other tabs</span></div>
                  <div className="card-body tight">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <SortHeader label="Intent gap" sortKey="intent" activeSortKey={gSK} sortDir={gSD} onSort={gT} />
                          <th>Suggested keywords</th>
                          <th>Reasoning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedGaps.length > 0 ? sortedGaps.map((g) => (
                          <tr key={g.intent}>
                            <td><strong>{g.intent}</strong></td>
                            <td style={{ fontSize: 12 }}>{g.suggestedKeywords.join(', ')}</td>
                            <td style={{ fontSize: 12 }}>{g.reasoning}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-ink-3)' }}>No gaps found yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ═══ AUDIENCES TAB ═══ */}
        {activeTab === 'audiences' && (
          <>
            <div className="kpi-strip cols-4">
              <div className="kpi hl">
                <div className="label">Audience segments</div>
                <div className="value">{audiences.length || '\u2014'}</div>
              </div>
              <div className="kpi">
                <div className="label">Keywords covered</div>
                <div className="value">{audAnalysis?.totalKeywords ?? '\u2014'}</div>
              </div>
              <div className="kpi">
                <div className="label">Avg coverage</div>
                <div className="value">{audAnalysis?.avgCoverage ? `${audAnalysis.avgCoverage}%` : '\u2014'}</div>
              </div>
              <div className="kpi">
                <div className="label">Weakest segment</div>
                <div className="value">{weakest?.name ?? '\u2014'}</div>
                <div className="delta">{weakest ? `${weakest.coveragePct}% coverage` : '\u2014'}</div>
              </div>
            </div>

            {/* Audience segments */}
            <section>
              <div className="section-head">
                <div className="section-head-left"><span className="section-num">&sect; 01</span><h2>Audience <em>segments</em></h2></div>
              </div>
              {audiences.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {audiences.map((aud, i) => {
                    const kws = (aud.keywords ?? []) as AudienceKw[]
                    return (
                      <div className="card" key={i}>
                        <div className="card-head">
                          <div>
                            <h3>{aud.name}</h3>
                            <div style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 2 }}>{aud.description}</div>
                          </div>
                        </div>
                        <div className="card-body">
                          <div style={{ marginBottom: 12 }}><CoverageBar pct={aud.coveragePct} /></div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                            {kws.map((k, j) => (
                              <span key={j} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 8px', borderRadius: 4, fontSize: 12,
                                background: kwStateBg(k.state), color: kwStateColor(k.state),
                                border: `1px solid ${kwStateColor(k.state)}20`,
                              }}>
                                {k.keyword}
                                {k.rank && <small style={{ opacity: 0.7 }}>#{k.rank}</small>}
                              </span>
                            ))}
                          </div>
                          {aud.messagingFocus && (
                            <div style={{ background: 'var(--color-paper-2)', borderRadius: 6, padding: '10px 14px' }}>
                              <div style={{ fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Suggested messaging</div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{aud.messagingFocus.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--color-ink-2)' }}>{aud.messagingFocus.subtitle}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                    <p style={{ marginBottom: 12 }}>No audience segments yet.</p>
                    <button className="btn accent" onClick={() => genAud()} disabled={genningAud}>{genningAud ? 'Analyzing\u2026' : 'Generate'}</button>
                  </div>
                </div>
              )}
            </section>

            {/* Coverage matrix */}
            {audiences.length > 0 && (
              <section>
                <div className="section-head">
                  <div className="section-head-left"><span className="section-num">&sect; 02</span><h2>Coverage <em>matrix</em></h2></div>
                </div>
                <div className="card">
                  <div className="card-body tight">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Audience</th>
                          <th className="tn">Keywords</th>
                          <th className="tn">Ranking</th>
                          <th className="tn">Opportunities</th>
                          <th className="tn">Missing</th>
                          <th className="tn">Coverage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audiences.map((aud, i) => {
                          const kws = (aud.keywords ?? []) as AudienceKw[]
                          const ours = kws.filter(k => k.state === 'ours').length
                          const win = kws.filter(k => k.state === 'win').length
                          const miss = kws.filter(k => k.state === 'miss').length
                          return (
                            <tr key={i}>
                              <td><strong>{aud.name}</strong></td>
                              <td className="tn num-big">{kws.length}</td>
                              <td className="tn num-big"><span className="pill ok">{ours}</span></td>
                              <td className="tn num-big"><span className="pill test">{win}</span></td>
                              <td className="tn num-big"><span className="pill warn">{miss}</span></td>
                              <td className="tn" style={{ minWidth: 100 }}><CoverageBar pct={aud.coveragePct} /></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <section>
                <div className="section-head">
                  <div className="section-head-left"><span className="section-num">&sect; 03</span><h2>Audience <em>insights</em></h2></div>
                </div>
                <div className="card">
                  <div className="card-body">
                    {insights.map((ins, i) => (
                      <div className="comp-row" key={i}>
                        <div className="comp-icon" style={{ background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div className="comp-name">{ins.insight}</div>
                          <div className="comp-meta"><strong>Action:</strong> {ins.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Keyword gaps */}
            {uncovered.length > 0 && (
              <section>
                <div className="section-head">
                  <div className="section-head-left"><span className="section-num">&sect; 04</span><h2>Keyword <em>gaps</em></h2></div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {uncovered.map((k, i) => (
                        <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-paper-2)', border: '1px solid var(--color-line)', fontSize: 13 }}>
                          <strong>{k.keyword}</strong>
                          <div style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 2 }}>vol ~{k.volume.toLocaleString()} / diff {k.difficulty}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}
