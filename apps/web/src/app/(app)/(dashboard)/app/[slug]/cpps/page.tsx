'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { KeywordAudiencesData } from '@/lib/analysis-types'

type Audience = NonNullable<KeywordAudiencesData['audiences']>[number]
type AudienceKw = { keyword: string; state: string; rank: number | null; volume: number }

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

export default function KeywordAudiencesPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<KeywordAudiencesData>(slug, 'keyword-audiences')
  const { generate, generating } = useGenerate(slug, 'keyword-audiences', { onSuccess: refetch })

  const audiences = (analysis?.audiences ?? []) as Audience[]
  const uncovered = analysis?.uncoveredKeywords ?? []
  const insights = analysis?.audienceInsights ?? []

  const weakest = audiences.length > 0
    ? audiences.reduce((min: Audience, a: Audience) => a.coveragePct < min.coveragePct ? a : min)
    : null

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Keyword Audiences', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '\u2014' },
          { label: 'Keyword Audiences', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>One message per <em>audience</em>.</>}
        subtitle={analysis?.summary ?? 'Keywords clustered by audience persona \u2014 coverage analysis, messaging recommendations, and gap identification.'}
        meta={
          <>
            SEGMENTS · <strong>{audiences.length || '\u2014'}</strong><br />
            KEYWORDS · <strong>{analysis?.totalKeywords ?? '\u2014'}</strong><br />
            AVG COVERAGE · <strong>{analysis?.avgCoverage ? `${analysis.avgCoverage}%` : '\u2014'}</strong>
          </>
        }
      />

      <div className="content">
        {/* KPI strip */}
        <div className="kpi-strip cols-4">
          <div className="kpi hl">
            <div className="label">Audience segments</div>
            <div className="value">{audiences.length || '\u2014'}</div>
            <div className="delta">{audiences.length > 0 ? 'distinct personas identified' : 'generate to populate'}</div>
          </div>
          <div className="kpi">
            <div className="label">Keywords covered</div>
            <div className="value">{analysis?.totalKeywords ?? '\u2014'}</div>
            <div className="delta">{analysis ? 'tracked keywords analyzed' : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Avg coverage</div>
            <div className="value">{analysis?.avgCoverage ? `${analysis.avgCoverage}%` : '\u2014'}</div>
            <div className="delta">{analysis ? 'across all segments' : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Weakest segment</div>
            <div className="value">{weakest?.name ?? '\u2014'}</div>
            <div className="delta">{weakest ? `${weakest.coveragePct}% coverage` : '\u2014'}</div>
          </div>
        </div>

        {/* 01 Audience Segments — REAL + AI */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 01</span><h2>Audience <em>segments</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>+ AI CLUSTERING</span>
              <div className="section-sub" style={{ margin: 0 }}>Keywords grouped by audience persona.</div>
            </div>
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
                      {/* Coverage bar */}
                      <div style={{ marginBottom: 12 }}>
                        <CoverageBar pct={aud.coveragePct} />
                      </div>

                      {/* Keyword chips */}
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

                      {/* Messaging focus */}
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
                <p style={{ marginBottom: 12 }}>No audience segments yet. Generate keywords first, then run Keyword Audiences.</p>
                <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
              </div>
            </div>
          )}
        </section>

        {/* 02 Coverage Matrix — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 02</span><h2>Coverage <em>matrix</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>How many keywords rank vs don&apos;t per audience.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body tight">
              {audiences.length > 0 ? (
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
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p>No coverage data yet.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 03 Audience Insights — AI ANALYSIS */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 03</span><h2>Audience <em>insights</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>Patterns and strategic recommendations.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {insights.length > 0 ? (
                insights.map((ins, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{ background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="comp-name">{ins.insight}</div>
                      <div className="comp-meta"><strong>Action:</strong> {ins.action}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No audience insights yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 04 Keyword Gaps — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 04</span><h2>Keyword <em>gaps</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Keywords not assigned to any audience segment.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {uncovered.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {uncovered.map((k, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', borderRadius: 6, background: 'var(--color-paper-2)',
                      border: '1px solid var(--color-line)', fontSize: 13,
                    }}>
                      <strong>{k.keyword}</strong>
                      <div style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 2 }}>
                        vol ~{k.volume.toLocaleString()} / diff {k.difficulty}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-ink-3)' }}>
                  {audiences.length > 0 ? (
                    <p>All keywords are covered by audience segments.</p>
                  ) : (
                    <p>No gap data yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
