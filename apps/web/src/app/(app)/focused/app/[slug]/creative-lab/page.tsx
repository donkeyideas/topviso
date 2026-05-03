'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { CreativeLabData } from '@/lib/analysis-types'
import { useState } from 'react'

// Deterministic color from name
const iconColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#a855f7']
function nameColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return iconColors[Math.abs(hash) % iconColors.length]
}

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

function ScreenshotGrid({ urls, maxShow = 8 }: { urls: string[]; maxShow?: number }) {
  const [failedSet, setFailedSet] = useState<Set<number>>(new Set())

  if (urls.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
      {urls.slice(0, maxShow).map((url, i) => (
        failedSet.has(i) ? (
          <div key={i} style={{
            aspectRatio: '9/16', borderRadius: 8, background: 'var(--color-paper-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: 'var(--color-ink-4)', border: '1px solid var(--color-line)',
          }}>
            Screenshot {i + 1}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i} src={url} alt={`Screenshot ${i + 1}`}
            referrerPolicy="no-referrer" crossOrigin="anonymous"
            onError={() => setFailedSet(prev => new Set(prev).add(i))}
            style={{
              width: '100%', aspectRatio: '9/16', objectFit: 'cover',
              borderRadius: 8, border: '1px solid var(--color-line)',
            }}
          />
        )
      ))}
      {urls.length > maxShow && (
        <div style={{
          aspectRatio: '9/16', borderRadius: 8, background: 'var(--color-paper-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: 'var(--color-ink-3)', border: '1px solid var(--color-line)',
        }}>
          +{urls.length - maxShow} more
        </div>
      )}
    </div>
  )
}

export default function CreativeLabPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<CreativeLabData>(slug, 'creative-lab')
  const { generate, generating } = useGenerate(slug, 'creative-lab', { onSuccess: refetch })

  const screenshots = analysis?.screenshots ?? []
  const breakdown = analysis?.scoreBreakdown
  const recommendations = analysis?.screenshotRecommendations ?? []
  const iconRecs = analysis?.iconRecommendations ?? []
  const compCreatives = analysis?.competitorCreatives ?? []
  const compInsights = analysis?.competitorInsights ?? []

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Creative Lab', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '\u2014' },
          { label: 'Creative Lab', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Visual assets, <em>analyzed</em>.</>}
        subtitle={analysis?.summary ?? 'Your screenshots, icon, and creative quality score \u2014 with AI recommendations and competitor visual comparison.'}
        meta={
          <>
            SCREENSHOTS · <strong>{analysis?.screenshotCount ?? '\u2014'}</strong><br />
            CREATIVE SCORE · <strong>{analysis?.creativeScore ?? '\u2014'}</strong><br />
            COMPETITORS · <strong>{analysis?.competitorCount ?? '\u2014'}</strong>
          </>
        }
      />

      <div className="content">
        {/* KPI strip */}
        <div className="kpi-strip cols-3">
          <div className="kpi hl">
            <div className="label">Screenshot count</div>
            <div className="value">{analysis?.screenshotCount ?? '\u2014'}</div>
            <div className="delta">{screenshots.length >= 8 ? 'good coverage' : screenshots.length > 0 ? 'consider adding more' : 'generate to populate'}</div>
          </div>
          <div className="kpi">
            <div className="label">Creative score</div>
            <div className="value">{analysis?.creativeScore ?? '\u2014'}<span style={{ fontSize: 14, color: 'var(--color-ink-3)' }}>/100</span></div>
            <div className="delta">{analysis ? 'from ASO quality analysis' : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Competitors analyzed</div>
            <div className="value">{analysis?.competitorCount ?? '\u2014'}</div>
            <div className="delta">{compCreatives.length > 0 ? 'visual assets compared' : '\u2014'}</div>
          </div>
        </div>

        {/* 01 Your Screenshots — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 01</span><h2>Your <em>screenshots</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Actual screenshots from your store listing.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {screenshots.length > 0 ? (
                <ScreenshotGrid urls={screenshots} maxShow={10} />
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No screenshot data yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 02 Creative Quality Score — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 02</span><h2>Creative quality <em>score</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>ASO score breakdown for your visual and metadata assets.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {breakdown ? (
                <div style={{ maxWidth: 500 }}>
                  <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-display)' }}>
                    {analysis?.creativeScore}<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--color-ink-3)' }}>/100</span>
                  </div>
                  <ScoreBar label="Title" score={breakdown.titleScore} />
                  <ScoreBar label="Subtitle" score={breakdown.subtitleScore} />
                  <ScoreBar label="Description" score={breakdown.descriptionScore} />
                  <ScoreBar label="Keywords" score={breakdown.keywordsFieldScore} />
                  <ScoreBar label="Ratings" score={breakdown.ratingsScore} />
                  <ScoreBar label="Creatives" score={breakdown.creativesScore} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No score data yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 03 AI Recommendations */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 03</span><h2>AI <em>recommendations</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>Specific improvements for your visual assets.</div>
            </div>
          </div>
          <div className="grid-2">
            {/* Screenshot recommendations */}
            <div className="card">
              <div className="card-head"><h3>Screenshot strategy</h3></div>
              <div className="card-body">
                {recommendations.length > 0 ? (
                  recommendations.map((r, i) => (
                    <div className="comp-row" key={i}>
                      <div className="comp-icon" style={{
                        background: r.priority === 'high' ? '#ef4444' : r.priority === 'medium' ? '#d97706' : 'var(--color-ok)',
                      }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div className="comp-name">{r.title}</div>
                        <div className="comp-meta">{r.detail}</div>
                      </div>
                      <span className={`pill ${r.priority === 'high' ? 'warn' : r.priority === 'medium' ? 'test' : 'ok'}`}>{r.priority.toUpperCase()}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-ink-3)' }}>No recommendations yet.</div>
                )}
              </div>
            </div>

            {/* Icon recommendations */}
            <div className="card">
              <div className="card-head">
                <h3>Icon improvements</h3>
                {analysis?.iconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={analysis.iconUrl} alt="App icon" width={32} height={32}
                    referrerPolicy="no-referrer" crossOrigin="anonymous"
                    style={{ borderRadius: 8, flexShrink: 0 }}
                  />
                )}
              </div>
              <div className="card-body">
                {iconRecs.length > 0 ? (
                  iconRecs.map((r, i) => (
                    <div className="comp-row" key={i}>
                      <div className="comp-icon" style={{ background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div className="comp-name">{r.title}</div>
                        <div className="comp-meta">{r.detail}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-ink-3)' }}>No icon recommendations yet.</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 04 Competitor Visual Comparison — REAL + AI */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 04</span><h2>Competitor <em>visuals</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>+ AI NOTES</span>
              <div className="section-sub" style={{ margin: 0 }}>Competitor screenshots with AI creative insights.</div>
            </div>
          </div>

          {compCreatives.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {compCreatives.map((comp, i) => (
                <div className="card" key={i}>
                  <div className="card-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {comp.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={comp.iconUrl} alt={comp.name} width={28} height={28}
                          referrerPolicy="no-referrer" crossOrigin="anonymous"
                          style={{ borderRadius: 6, flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 28, height: 28, borderRadius: 6, background: nameColor(comp.name),
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13, flexShrink: 0,
                        }}>{comp.name.charAt(0)}</div>
                      )}
                      <h3>{comp.name}</h3>
                    </div>
                    {comp.rating && <span style={{ fontSize: 12, color: 'var(--color-ink-2)' }}>{comp.rating.toFixed(1)}<span style={{ color: '#eab308' }}>&#9733;</span></span>}
                  </div>
                  <div className="card-body">
                    <ScreenshotGrid urls={comp.screenshots} maxShow={4} />
                  </div>
                </div>
              ))}

              {/* AI competitor insights */}
              {compInsights.length > 0 && (
                <div className="card">
                  <div className="card-head"><h3>Creative patterns</h3></div>
                  <div className="card-body">
                    {compInsights.map((insight, i) => (
                      <div className="comp-row" key={i}>
                        <div className="comp-icon" style={{ background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div className="comp-name">{insight.insight}</div>
                          <div className="comp-meta"><strong>Action:</strong> {insight.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                <p style={{ marginBottom: 12 }}>No competitor visual data. Run competitor analysis first, then generate Creative Lab.</p>
                <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
