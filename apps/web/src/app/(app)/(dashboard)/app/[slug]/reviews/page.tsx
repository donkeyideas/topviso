'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { ReviewsAnalysisData } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo, useState, useCallback } from 'react'

type ComplaintTheme = { theme: string; frequency: string; suggestedFix: string; example: string }

export default function ReviewsPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<ReviewsAnalysisData>(slug, 'reviews-analysis')
  const { generate, generating } = useGenerate(slug, 'reviews-analysis', { onSuccess: refetch })
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const complaintAccessors = useMemo(() => ({
    theme: (t: ComplaintTheme) => t.theme,
    frequency: (t: ComplaintTheme) => t.frequency,
  }), [])
  const complaints = (analysis?.complaintThemes ?? []) as ComplaintTheme[]
  const { sorted: sortedComplaints, sortKey: cSortKey, sortDir: cSortDir, toggle: cToggle } = useTableSort(complaints, complaintAccessors)

  // Filter themes by active topic chip
  const matchesTopic = useCallback((text: string) => {
    if (!activeTopic) return true
    return text.toLowerCase().includes(activeTopic.toLowerCase())
  }, [activeTopic])

  const filteredPraise = useMemo(() =>
    (analysis?.praiseThemes ?? []).filter(t => matchesTopic(t.theme) || matchesTopic(t.example)),
    [analysis?.praiseThemes, matchesTopic]
  )
  const filteredComplaints = useMemo(() =>
    (analysis?.complaintThemes ?? []).filter(t => matchesTopic(t.theme) || matchesTopic(t.example) || matchesTopic(t.suggestedFix)),
    [analysis?.complaintThemes, matchesTopic]
  )

  const reviewCount = analysis?.realReviewCount ?? null
  const avgRating = analysis?.averageRating ?? null

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Reviews', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'Reviews', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn ghost" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing...' : 'Analyze reviews'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>User voice, <em>understood</em>.</>}
        subtitle={analysis?.sentimentSummary ?? "Sentiment breakdown, rating distribution, topic intelligence, filterable feed, and AI-drafted replies — all on one page."}
        meta={
          analysis ? (
            <>
              AVG RATING · <strong>{avgRating != null ? `${avgRating.toFixed(1)}/5` : '—'}</strong><br />
              REVIEWS · <strong>{reviewCount ?? '—'}</strong><br />
              THEMES · <strong>{analysis.praiseThemes.length + analysis.complaintThemes.length}</strong>
            </>
          ) : (
            <>
              AVG RATING · <strong>&mdash;</strong><br />
              REVIEWS · <strong>&mdash;</strong><br />
              THEMES · <strong>&mdash;</strong>
            </>
          )
        }
      />

      <div className="content">
        <div className="kpi-strip cols-4">
          <div className="kpi hl">
            <div className="label">Reviews analyzed</div>
            <div className="value">{reviewCount ?? '—'}</div>
            {analysis ? <div className="delta">{analysis.praiseThemes.length + analysis.complaintThemes.length} themes detected</div> : <div className="delta">—</div>}
          </div>
          <div className="kpi">
            <div className="label">Average rating</div>
            <div className="value">{avgRating != null ? `${avgRating.toFixed(1)}` : '—'}</div>
            {avgRating != null ? <div className="delta">{avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'mixed' : 'needs attention'}</div> : <div className="delta">—</div>}
          </div>
          <div className="kpi">
            <div className="label">Complaint themes</div>
            <div className="value">{analysis?.complaintThemes?.length ?? '—'}</div>
            {analysis ? <div className="delta">{analysis.complaintThemes?.[0]?.theme ? `top: ${analysis.complaintThemes[0].theme}` : 'none'}</div> : <div className="delta">—</div>}
          </div>
          <div className="kpi">
            <div className="label">Reply templates</div>
            <div className="value">{analysis?.replyTemplates?.length ?? '—'}</div>
            {analysis ? <div className="delta">ready to use</div> : <div className="delta">—</div>}
          </div>
        </div>

        {/* § 01 Topic intelligence */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 01</span><h2>Topic <em>intelligence</em></h2></div>
            <div className="section-sub">{activeTopic ? `Filtering by "${activeTopic}" — click again to clear.` : 'Click any topic to filter the review feed below.'}</div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="topic-chips">
                {analysis?.keywordsFromReviews?.length ? (
                  analysis.keywordsFromReviews.map((kw, i) => (
                    <div
                      key={i}
                      className={`topic-chip${activeTopic === kw ? ' on' : ''}`}
                      onClick={() => setActiveTopic(prev => prev === kw ? null : kw)}
                      style={{ cursor: 'pointer' }}
                    >
                      {kw}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)', width: '100%' }}>
                    <p style={{ marginBottom: '1rem' }}>No topic data yet. Generate a reviews analysis to discover topic clusters from user feedback.</p>
                    <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing...' : 'Analyze reviews'}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* § 02 Clustered by theme */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 02</span><h2>Clustered by <em>theme</em></h2></div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-head"><h3>Recent reviews, auto-clustered</h3>{analysis && <span className="tag">{filteredPraise.length + filteredComplaints.length} themes</span>}</div>
              <div className="card-body tight">
                {filteredPraise.length || filteredComplaints.length ? (
                  <>
                    {filteredPraise.map((t, i) => (
                      <div key={`praise-${i}`} className="review-item">
                        <div className="rv-meta"><span className="theme">{t.theme.toUpperCase()}</span><span className="tag ok">{t.frequency}</span></div>
                        <div className="rv-text">&quot;{t.example}&quot;</div>
                      </div>
                    ))}
                    {filteredComplaints.map((t, i) => (
                      <div key={`complaint-${i}`} className="review-item">
                        <div className="rv-meta"><span className="theme" style={{ color: 'var(--color-warn)' }}>{t.theme.toUpperCase()}</span><span className="tag">{t.frequency}</span></div>
                        <div className="rv-text">&quot;{t.example}&quot;</div>
                        <div className="rv-action">Suggested fix: {t.suggestedFix}</div>
                      </div>
                    ))}
                  </>
                ) : activeTopic ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                    <p>No themes match &quot;{activeTopic}&quot;.</p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                    <p style={{ marginBottom: '1rem' }}>No review clusters yet. Generate a reviews analysis to see praise and complaint themes.</p>
                    <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing...' : 'Analyze reviews'}</button>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h3>Emerging signals</h3>{analysis && <span className="tag">from analysis</span>}</div>
              <div className="card-body tight">
                {analysis?.complaintThemes?.length ? (
                  <>
                    <table className="data-table">
                      <thead><tr><SortHeader label="Theme" sortKey="theme" activeSortKey={cSortKey} sortDir={cSortDir} onSort={cToggle} /><SortHeader label="Frequency" sortKey="frequency" activeSortKey={cSortKey} sortDir={cSortDir} onSort={cToggle} /><th>Suggested fix</th></tr></thead>
                      <tbody>
                        {sortedComplaints.map((t, i) => (
                          <tr key={i}>
                            <td><strong>{t.theme}</strong></td>
                            <td><span className="tag">{t.frequency}</span></td>
                            <td>{t.suggestedFix}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="callout ok" style={{ margin: 22 }}>
                      <div className="callout-label">Summary</div>
                      <p>{analysis.sentimentSummary}</p>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                    {analysis ? (
                      <p>No complaint themes found — all reviews are positive! Re-analyze as more reviews come in.</p>
                    ) : (
                      <>
                        <p style={{ marginBottom: '1rem' }}>No emerging signals yet. Generate a reviews analysis to surface complaint trends and suggested fixes.</p>
                        <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* § 03 Reply templates */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 03</span><h2>Reply <em>templates</em></h2></div>
            <div className="section-sub">AI-drafted replies for common review scenarios.</div>
          </div>
          <div className="card">
            <div className="card-body tight">
              {analysis?.replyTemplates?.length ? (
                analysis.replyTemplates.map((rt, i) => (
                  <div key={i} className="review-item">
                    <div className="rv-meta"><span className="theme">{rt.scenario.toUpperCase()}</span></div>
                    <div className="rv-text">{rt.reply}</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  {analysis ? (
                    <p>No reply templates needed — no negative review patterns detected.</p>
                  ) : (
                    <>
                      <p style={{ marginBottom: '1rem' }}>No reply templates yet. Generate a reviews analysis to get AI-drafted reply templates for common scenarios.</p>
                      <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
                    </>
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
