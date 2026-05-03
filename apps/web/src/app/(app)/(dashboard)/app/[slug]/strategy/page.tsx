'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { StrategyData } from '@/lib/analysis-types'

export default function StrategyPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''

  const { data: analysis, refetch } = useAnalysis<StrategyData>(slug, 'strategy')
  const { generate, generating } = useGenerate(slug, 'strategy', { onSuccess: refetch })

  const goals = analysis?.goals ?? []
  const weeks = analysis?.weeks ?? []
  const hasGoals = goals.length > 0
  const hasWeeks = weeks.length > 0

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Strategy', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'Strategy', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate strategy'}</button>
          <button className="btn ghost">Download PDF</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>The Top Viso <em>playbook</em>.</>}
        subtitle={analysis?.summary ?? 'Generate a 90-day ASO roadmap with strategic goals, weekly milestones, and expected outcomes.'}
        meta={
          hasGoals ? (
            <>
              QUARTER <strong>{analysis?.quarter ?? '—'}</strong><br />
              GOALS <strong>{goals.length}</strong><br />
              WEEKS <strong>{weeks.length}</strong>
            </>
          ) : undefined
        }
      />

      <div className="content">
        {(hasGoals || hasWeeks) && (
          <div className="kpi-strip cols-3">
            <div className="kpi">
              <div className="label">Quarter</div>
              <div className="value sm">{analysis?.quarter ?? '—'}</div>
            </div>
            <div className="kpi">
              <div className="label">Strategic goals</div>
              <div className="value">{goals.length}</div>
            </div>
            <div className="kpi">
              <div className="label">Weekly milestones</div>
              <div className="value">{weeks.length}</div>
            </div>
          </div>
        )}

        {/* § 01 Strategy goals */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 01</span><h2>Strategy <em>goals</em></h2></div>
          </div>
          {hasGoals ? (
            <div className="grid-3">
              {goals.map((g, i) => (
                <div className="card" key={i}><div className="card-body">
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--color-accent)', lineHeight: 1, marginBottom: 10 }}>{String(i + 1).padStart(2, '0')}</div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 10 }}>{g.goal}</h4>
                  <p style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.5 }}>{g.metric} &mdash; target: {g.target}</p>
                </div></div>
              ))}
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No data yet</p>
              <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
            </div></div>
          )}
        </section>

        {/* § 02 Weekly action plan */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 02</span><h2>Weekly <em>action plan</em>{analysis?.quarter ? <> &mdash; {analysis.quarter}</> : null}</h2></div>
          </div>
          {hasWeeks ? (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Focus</th>
                    <th>Actions</th>
                    <th>Expected outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((w) => (
                    <tr key={w.week}>
                      <td><strong>{w.week}</strong></td>
                      <td><strong>{w.focus}</strong></td>
                      <td style={{ fontSize: 12 }}>
                        <ul style={{ paddingLeft: 16, margin: 0 }}>
                          {w.actions.map((a, j) => (
                            <li key={j} style={{ marginBottom: 2 }}>{a}</li>
                          ))}
                        </ul>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-ink-2)' }}>{w.expectedOutcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No data yet</p>
              <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
            </div></div>
          )}
        </section>

        {/* § 03 Do / Don't */}
        {(analysis?.dos?.length || analysis?.donts?.length) && (
          <section>
            <div className="section-head">
              <div className="section-head-left">
                <span className="section-num">§ 03</span>
                <h2>Do / <em>Don&apos;t</em></h2>
              </div>
            </div>
            <div className="grid-2">
              {analysis?.dos?.length ? (
                <div className="card">
                  <div className="card-head"><h3 style={{ color: 'var(--color-ok)' }}>Do</h3></div>
                  <div className="card-body">
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysis.dos.map((d, i) => (
                        <li key={i} style={{ paddingLeft: 24, position: 'relative', fontSize: 13, lineHeight: 1.5 }}>
                          <span style={{ position: 'absolute', left: 0, color: 'var(--color-ok)', fontWeight: 700 }}>✓</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
              {analysis?.donts?.length ? (
                <div className="card">
                  <div className="card-head"><h3 style={{ color: 'var(--color-warn, #d44)' }}>Don&apos;t</h3></div>
                  <div className="card-body">
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysis.donts.map((d, i) => (
                        <li key={i} style={{ paddingLeft: 24, position: 'relative', fontSize: 13, lineHeight: 1.5 }}>
                          <span style={{ position: 'absolute', left: 0, color: 'var(--color-warn, #d44)', fontWeight: 700 }}>×</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
