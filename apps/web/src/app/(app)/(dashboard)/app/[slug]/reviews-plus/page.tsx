'use client'

import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { ReviewsPlusData } from '@/lib/analysis-types'

const statusPill = (s: string) => {
  const sl = s.toLowerCase()
  if (sl === 'escalated') return 'warn'
  if (sl === 'shipped') return 'ok'
  return 'test'
}

const stars = (n: number) => '★'.repeat(Math.max(1, Math.min(5, n)))

export default function ReviewsPlusPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData } = useApp(slug)
  const appId = slug
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<ReviewsPlusData>(appId, 'reviews-plus')
  const { generate, generating } = useGenerate(appId, 'reviews-plus', { onSuccess: refetch })

  const clusters = analysis?.clusters ?? []
  const tickets = analysis?.tickets ?? []
  const hasData = clusters.length > 0

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName ?? '—' },
          { label: 'Measure' },
          { label: 'Reviews+', isActive: true },
        ]}
      >
        <div className="top-strip-actions"><button className="btn ghost">Webhook settings</button></div>
      </TopStrip>

      <PageHero
        title={<>Reviews + <em>predict + route</em>.</>}
        subtitle={analysis?.summary ?? 'Your Reviews tab gives sentiment and AI replies. Reviews+ adds two layers: predictive rating-risk forecasting and auto-routing to Linear, Jira, and Slack. Same data, new capabilities.'}
        meta={
          hasData ? (
            <>
              NEW THIS WEEK <strong>{analysis?.newThisWeek ?? '—'}</strong><br />
              AUTO-REPLIED <strong>{analysis?.autoReplied ?? '—'}</strong><br />
              AUTO-TICKETED <strong>{analysis?.autoTicketed ?? '—'}</strong><br />
              RATING RISK <strong>{analysis?.ratingRisk ?? '—'}</strong>
            </>
          ) : (
            <>
              NEW THIS WEEK <strong>—</strong><br />
              AUTO-REPLIED <strong>—</strong><br />
              AUTO-TICKETED <strong>—</strong><br />
              RATING RISK <strong>—</strong>
            </>
          )
        }
      />

      <div className="content">
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 01</span><h2>Emerging <em>signals</em></h2></div>
          </div>

          {hasData ? (
            <div className="grid-2">
              {/* Clusters trending */}
              <div className="card">
                <div className="card-head"><h3>Clusters trending</h3><span className="tag">4-week horizon</span></div>
                <div className="card-body tight">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Cluster</th>
                        <th>Trend</th>
                        <th className="tn">Risk</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clusters.map((c, i) => {
                        const isNeg = (c.risk ?? 0) < 0
                        return (
                          <tr key={i}>
                            <td><strong>{c.cluster}</strong></td>
                            <td style={{ color: isNeg ? 'var(--color-warn)' : 'var(--color-ok)' }}>
                              <strong>{c.trend}</strong>
                            </td>
                            <td className="tn num-big" style={{ color: isNeg ? 'var(--color-warn)' : 'var(--color-ok)' }}>
                              <strong>{(c.risk ?? 0) > 0 ? `+${c.risk}` : c.risk}</strong>
                            </td>
                            <td><span className={`pill ${statusPill(c.status ?? '')}`}>{(c.status ?? '').toUpperCase()}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Auto-routed tickets */}
              <div className="card">
                <div className="card-head"><h3>Auto-routed tickets</h3><span className="tag">Linear · Jira · Slack</span></div>
                <div className="card-body tight">
                  {tickets.length > 0 ? tickets.map((t, i) => (
                    <div className="review-item" key={i}>
                      <div className="rv-meta">
                        <span>{t.source}</span>
                        <span className="stars">{stars(t.stars ?? 3)}</span>
                        <span className="theme" style={{ color: t.themeNegative ? 'var(--color-warn)' : undefined }}>{t.theme}</span>
                      </div>
                      <div className="rv-text">&quot;{t.text}&quot;</div>
                      <div className="rv-action">{t.routing}</div>
                    </div>
                  )) : (
                    <p style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-ink-3)' }}>No tickets routed yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No review data yet. Generate to see predictive signals and auto-routing.</p>
              <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
            </div></div>
          )}
        </section>
      </div>
    </>
  )
}
