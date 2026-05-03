'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { ConversionData } from '@/lib/analysis-types'
import { useState } from 'react'

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? 'var(--color-ok)' : score >= 40 ? '#d97706' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
      <div style={{ width: 120, fontSize: 12, color: 'var(--color-ink-2)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: 'var(--color-line)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, score)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <div style={{ width: 36, textAlign: 'right', fontSize: 13, fontWeight: 600, color }}>{score}</div>
    </div>
  )
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, score) / 100) * circ
  const color = score >= 70 ? 'var(--color-ok)' : score >= 40 ? '#d97706' : '#ef4444'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="central" style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: size * 0.3, fontWeight: 700, fill: 'var(--color-ink)' }}>{score}</text>
    </svg>
  )
}

function ScreenshotGrid({ urls, maxShow = 8 }: { urls: string[]; maxShow?: number }) {
  const [failedSet, setFailedSet] = useState<Set<number>>(new Set())
  if (urls.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
      {urls.slice(0, maxShow).map((url, i) => (
        failedSet.has(i) ? (
          <div key={i} style={{ aspectRatio: '9/16', borderRadius: 8, background: 'var(--color-paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--color-ink-4)', border: '1px solid var(--color-line)' }}>
            #{i + 1}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt={`Screenshot ${i + 1}`} referrerPolicy="no-referrer" crossOrigin="anonymous"
            onError={() => setFailedSet(prev => new Set(prev).add(i))}
            style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-line)' }}
          />
        )
      ))}
      {urls.length > maxShow && (
        <div style={{ aspectRatio: '9/16', borderRadius: 8, background: 'var(--color-paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--color-ink-3)', border: '1px solid var(--color-line)' }}>
          +{urls.length - maxShow} more
        </div>
      )}
    </div>
  )
}

export default function ConversionPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const { data, refetch } = useAnalysis<ConversionData>(slug, 'conversion')
  const { generate, generating } = useGenerate(slug, 'conversion', { onSuccess: refetch })

  const audit = data?.searchCardAudit
  const competitors = data?.competitorComparison ?? []
  const issues = audit?.issues ?? []
  const recommendations = data?.recommendations ?? []

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Conversion', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '\u2014' },
          { label: 'Conversion', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>From impression to <em>install</em>.</>}
        subtitle={data?.summary ?? 'Audit your store listing to understand why users see your app but don\u2019t tap \u2014 and what to fix first.'}
        meta={
          <>
            CONVERSION SCORE &middot; <strong>{data?.conversionScore ?? '\u2014'}</strong><br />
            SCREENSHOTS &middot; <strong>{data?.screenshotUrls?.length ?? '\u2014'}</strong><br />
            ISSUES &middot; <strong>{issues.length || '\u2014'}</strong>
          </>
        }
      />

      <div className="content">
        {/* KPI strip */}
        <div className="kpi-strip">
          <div className="kpi hl" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ScoreRing score={data?.conversionScore ?? 0} />
            <div>
              <div className="label">Conversion Score</div>
              <div className="value">{data?.conversionScore ?? '\u2014'}<span style={{ fontSize: 14, color: 'var(--color-ink-3)' }}>/100</span></div>
            </div>
          </div>
          <div className="kpi">
            <div className="label">Icon</div>
            <div className="value">{audit?.iconScore ?? '\u2014'}</div>
            <div className="delta">{audit ? (audit.iconScore >= 70 ? 'strong' : audit.iconScore >= 40 ? 'needs work' : 'weak') : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Title & Subtitle</div>
            <div className="value">{audit ? Math.round((audit.titleScore + audit.subtitleScore) / 2) : '\u2014'}</div>
            <div className="delta">{audit ? 'avg of title + subtitle' : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Social Proof</div>
            <div className="value">{audit?.ratingScore ?? '\u2014'}</div>
            <div className="delta">{data ? `${data.appRating.toFixed(1)}\u2605 (${data.appRatingsCount.toLocaleString()})` : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Screenshots</div>
            <div className="value">{audit?.screenshotScore ?? '\u2014'}</div>
            <div className="delta">{data ? `${data.screenshotUrls.length} uploaded` : '\u2014'}</div>
          </div>
        </div>

        {/* § 01 Search result card */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 01</span><h2>Search result <em>card</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>What users see in search results before tapping.</div>
            </div>
          </div>
          <div className="grid-2">
            {/* Left: visual preview */}
            <div className="card">
              <div className="card-head"><h3>Your listing</h3></div>
              <div className="card-body">
                {data ? (
                  <div>
                    {/* App header */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
                      {data.appIcon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={data.appIcon} alt="Icon" referrerPolicy="no-referrer" crossOrigin="anonymous"
                          style={{ width: 64, height: 64, borderRadius: 14, border: '1px solid var(--color-line)', flexShrink: 0 }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.appTitle}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-ink-3)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.appSubtitle || 'No subtitle'}</div>
                        <div style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
                          {'★'.repeat(Math.round(data.appRating))}{' '}
                          <span style={{ fontWeight: 600 }}>{data.appRating.toFixed(1)}</span>{' '}
                          <span style={{ color: 'var(--color-ink-4)' }}>({data.appRatingsCount.toLocaleString()})</span>
                        </div>
                      </div>
                    </div>
                    {/* First 3 screenshots */}
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      First 3 screenshots (shown in search)
                    </div>
                    <ScreenshotGrid urls={data.screenshotUrls.slice(0, 3)} maxShow={3} />
                    {data.screenshotUrls.length === 0 && (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-ink-4)', border: '1px dashed var(--color-line)', borderRadius: 8 }}>
                        No screenshots found
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                    <p style={{ marginBottom: 12 }}>No data yet.</p>
                    <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: score breakdown */}
            <div className="card">
              <div className="card-head"><h3>Score breakdown</h3></div>
              <div className="card-body">
                {audit ? (
                  <div style={{ maxWidth: 500 }}>
                    <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-display)' }}>
                      {data?.conversionScore}<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--color-ink-3)' }}>/100</span>
                    </div>
                    <ScoreBar label="Icon" score={audit.iconScore} />
                    <ScoreBar label="Title" score={audit.titleScore} />
                    <ScoreBar label="Subtitle" score={audit.subtitleScore} />
                    <ScoreBar label="Rating & Reviews" score={audit.ratingScore} />
                    <ScoreBar label="Screenshots" score={audit.screenshotScore} />
                    <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--color-paper-2)', fontSize: 12, color: 'var(--color-ink-3)' }}>
                      Weights: Icon 15% &middot; Title 25% &middot; Subtitle 20% &middot; Rating 25% &middot; Screenshots 15%
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                    <p style={{ marginBottom: 12 }}>No score data yet.</p>
                    <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* § 02 Competitor comparison */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 02</span><h2>Competitor <em>comparison</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Side-by-side with competitors for the same keywords.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {data && competitors.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, 1 + competitors.length)}, 1fr)`, gap: 16 }}>
                  {/* Your app */}
                  <div style={{ padding: 16, borderRadius: 12, border: '2px solid var(--color-accent)', background: 'var(--color-accent-wash)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      {data.appIcon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={data.appIcon} alt="You" referrerPolicy="no-referrer" crossOrigin="anonymous"
                          style={{ width: 56, height: 56, borderRadius: 12, border: '1px solid var(--color-line)', margin: '0 auto 8px' }}
                        />
                      )}
                      <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.appTitle}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 2 }}>Your app</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-ink-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Rating</span><strong>{data.appRating.toFixed(1)} ★</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ratings</span><strong>{data.appRatingsCount.toLocaleString()}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Screenshots</span><strong>{data.screenshotUrls.length}</strong></div>
                    </div>
                  </div>

                  {/* Competitors */}
                  {competitors.slice(0, 3).map((comp, i) => (
                    <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--color-line)' }}>
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        {comp.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={comp.iconUrl} alt={comp.name} referrerPolicy="no-referrer" crossOrigin="anonymous"
                            style={{ width: 56, height: 56, borderRadius: 12, border: '1px solid var(--color-line)', margin: '0 auto 8px' }}
                          />
                        ) : (
                          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--color-paper-2)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--color-ink-4)' }}>
                            {comp.name.charAt(0)}
                          </div>
                        )}
                        <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comp.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-ink-3)', marginTop: 2 }}>Competitor</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-ink-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Rating</span>
                          <strong style={{ color: comp.rating > data.appRating ? 'var(--color-ok)' : undefined }}>{comp.rating.toFixed(1)} ★</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Ratings</span>
                          <strong style={{ color: comp.ratingsCount > data.appRatingsCount ? 'var(--color-ok)' : undefined }}>{comp.ratingsCount.toLocaleString()}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Screenshots</span>
                          <strong style={{ color: comp.screenshotCount > data.screenshotUrls.length ? 'var(--color-ok)' : undefined }}>{comp.screenshotCount}</strong>
                        </div>
                      </div>
                      {comp.advantage && (
                        <div style={{ marginTop: 10, padding: 8, borderRadius: 6, background: 'var(--color-paper-2)', fontSize: 11, color: 'var(--color-ink-3)', lineHeight: 1.4 }}>
                          {comp.advantage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : data ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-ink-3)' }}>
                  No competitor data. Run Competitors analysis first, then regenerate.
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No data yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* § 03 Issues & fixes */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 03</span><h2>Issues &amp; <em>fixes</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>What&apos;s hurting your tap-through rate.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {issues.length > 0 ? (
                issues.map((issue, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{
                      background: issue.impact === 'high' ? '#ef4444' : issue.impact === 'medium' ? '#d97706' : 'var(--color-ok)',
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="comp-name" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ textTransform: 'capitalize' }}>{issue.element}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-ink-4)' }}>&mdash; {issue.issue}</span>
                      </div>
                      <div className="comp-meta">{issue.fix}</div>
                    </div>
                    <span className={`pill ${issue.impact === 'high' ? 'warn' : issue.impact === 'medium' ? 'test' : 'ok'}`}>{issue.impact.toUpperCase()}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-ink-3)' }}>
                  {data ? 'No issues found \u2014 great listing!' : 'Generate analysis to see issues.'}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* § 04 Conversion playbook */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 04</span><h2>Conversion <em>playbook</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>Prioritized actions to increase installs.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {recommendations.length > 0 ? (
                recommendations.map((rec, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{
                      background: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#d97706' : 'var(--color-ok)',
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="comp-name">{rec.title}</div>
                      <div className="comp-meta">{rec.detail}</div>
                      {rec.expectedLift && (
                        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--color-accent)', fontWeight: 600 }}>
                          Expected lift: {rec.expectedLift}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <span className={`pill ${rec.priority === 'high' ? 'warn' : rec.priority === 'medium' ? 'test' : 'ok'}`}>{rec.priority.toUpperCase()}</span>
                      <span style={{ fontSize: 10, color: 'var(--color-ink-4)', textTransform: 'uppercase' }}>{rec.effort.replace('-', ' ')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-ink-3)' }}>
                  {data ? 'No recommendations yet.' : 'Generate analysis to get your playbook.'}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* All screenshots */}
        {data && data.screenshotUrls.length > 3 && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">&sect; 05</span><h2>All <em>screenshots</em></h2></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
                <div className="section-sub" style={{ margin: 0 }}>{data.screenshotUrls.length} screenshots from your store listing.</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <ScreenshotGrid urls={data.screenshotUrls} maxShow={12} />
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
