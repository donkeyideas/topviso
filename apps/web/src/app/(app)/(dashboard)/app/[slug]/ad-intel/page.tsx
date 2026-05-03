'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { AdIntelData } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo } from 'react'

type KwRow = NonNullable<AdIntelData['searchAdKeywords']>[number]

export default function AdIntelPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<AdIntelData>(slug, 'ad-intel')
  const { generate, generating } = useGenerate(slug, 'ad-intel', { onSuccess: refetch })

  const keywords = analysis?.searchAdKeywords ?? []
  const platforms = analysis?.platforms ?? []
  const campaigns = analysis?.campaignIdeas ?? []
  const overlap = analysis?.competitorOverlap ?? []

  // Keyword table sorting
  const kwAccessors = useMemo(() => ({
    keyword: (k: KwRow) => k.keyword,
    rank: (k: KwRow) => k.rank ?? 999,
    volume: (k: KwRow) => k.volume,
    difficulty: (k: KwRow) => k.difficulty,
    cpc: (k: KwRow) => k.cpc,
  }), [])
  const { sorted: sortedKws, sortKey, sortDir, toggle } = useTableSort(keywords, kwAccessors)

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Ad Intel', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '\u2014' },
          { label: 'Ad Intel', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Keyword-driven <em>ad strategy</em>.</>}
        subtitle={analysis?.summary ?? 'Search ad keywords with real rank data, platform recommendations, campaign ideas, and competitor keyword overlap.'}
        meta={
          <>
            KEYWORDS · <strong>{analysis?.keywordsTracked ?? '\u2014'}</strong><br />
            AVG DIFFICULTY · <strong>{analysis?.avgDifficulty ?? '\u2014'}</strong><br />
            TOP FIT · <strong>{analysis?.topPlatformFit ?? '\u2014'}</strong>
          </>
        }
      />

      <div className="content">
        {/* KPI strip */}
        <div className="kpi-strip cols-4">
          <div className="kpi hl">
            <div className="label">Keywords tracked</div>
            <div className="value">{analysis?.keywordsTracked ?? '\u2014'}</div>
            <div className="delta">{analysis ? 'with rank + enrichment data' : 'generate to populate'}</div>
          </div>
          <div className="kpi">
            <div className="label">Avg difficulty</div>
            <div className="value">{analysis?.avgDifficulty ?? '\u2014'}</div>
            <div className="delta">{analysis ? 'estimated from keyword analysis' : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Top platform fit</div>
            <div className="value">{analysis?.topPlatformFit ?? '\u2014'}</div>
            <div className="delta">{platforms.length > 0 ? `${platforms.length} platforms analyzed` : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Campaign ideas</div>
            <div className="value">{analysis ? campaigns.length : '\u2014'}</div>
            <div className="delta">{campaigns.length > 0 ? 'actionable strategies' : '\u2014'}</div>
          </div>
        </div>

        {/* 01 Search Ad Keywords — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 01</span><h2>Search ad <em>keywords</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>+ AI STRATEGY</span>
              <div className="section-sub" style={{ margin: 0 }}>Real ranks + estimated metrics + AI bid strategy.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body tight">
              {sortedKws.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortHeader label="Keyword" sortKey="keyword" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} />
                      <SortHeader label="Rank" sortKey="rank" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                      <SortHeader label="Volume EST." sortKey="volume" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                      <SortHeader label="Difficulty EST." sortKey="difficulty" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                      <SortHeader label="CPC EST." sortKey="cpc" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                      <th className="tn">Bid Strategy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedKws.map((k, i) => (
                      <tr key={i}>
                        <td>
                          <strong style={{ display: 'block' }}>{k.keyword}</strong>
                          <small style={{ color: 'var(--color-ink-3)', fontSize: 11 }}>{k.intent}</small>
                        </td>
                        <td className="tn num-big">
                          {k.rank ? (
                            <strong style={{ color: k.rank <= 10 ? 'var(--color-ok)' : k.rank <= 50 ? '#d97706' : 'var(--color-ink-2)' }}>#{k.rank}</strong>
                          ) : (
                            <span style={{ color: 'var(--color-ink-4)' }}>&mdash;</span>
                          )}
                        </td>
                        <td className="tn num-big">{k.volume.toLocaleString()}</td>
                        <td className="tn num-big">
                          <span className={`pill ${k.difficulty <= 30 ? 'ok' : k.difficulty <= 60 ? 'test' : 'warn'}`}>{k.difficulty}</span>
                        </td>
                        <td className="tn num-big">${k.cpc.toFixed(2)}</td>
                        <td className="tn">
                          <span className={`pill ${k.bidStrategy === 'aggressive' ? 'ok' : k.bidStrategy === 'moderate' ? 'test' : ''}`}>
                            {k.bidStrategy.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No keyword data yet. Generate keywords first, then run Ad Intel.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 02 Platform Recommendations — AI ANALYSIS */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 02</span><h2>Platform <em>recommendations</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>Best ad platforms for your app type.</div>
            </div>
          </div>
          <div className="grid-2">
            {platforms.length > 0 ? (
              platforms.map((p, i) => (
                <div className="card" key={i}>
                  <div className="card-head">
                    <h3>{p.platform}</h3>
                    <span className={`pill ${p.fit === 'high' ? 'ok' : p.fit === 'medium' ? 'test' : ''}`}>{p.fit.toUpperCase()} FIT</span>
                  </div>
                  <div className="card-body">
                    <p style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>{p.reasoning}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No platform recommendations yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 03 Campaign Ideas — AI ANALYSIS */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 03</span><h2>Campaign <em>ideas</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>Actionable campaign strategies.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {campaigns.length > 0 ? (
                campaigns.map((c, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{ background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="comp-name">{c.platform} &mdash; {c.type}</div>
                      <div className="comp-meta"><strong>Targeting:</strong> {c.targeting}</div>
                      <div className="comp-meta" style={{ marginTop: 2 }}><strong>Creative:</strong> {c.creative}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No campaign ideas yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 04 Competitor Keyword Overlap — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 04</span><h2>Competitor keyword <em>overlap</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Keywords shared with competitors.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {overlap.length > 0 ? (
                overlap.map((o, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{ background: '#6366f1' }}>{o.sharedKeywords.length}</div>
                    <div style={{ flex: 1 }}>
                      <div className="comp-name">{o.competitor}</div>
                      <div className="comp-meta" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {o.sharedKeywords.slice(0, 8).map((kw, j) => (
                          <span key={j} className="tag">{kw}</span>
                        ))}
                        {o.sharedKeywords.length > 8 && <span className="tag">+{o.sharedKeywords.length - 8} more</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No keyword overlap data. Run competitor analysis with keyword tracking first.</p>
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
