'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { GrowthInsightsData, UpdateImpactData, VersionHistoryItem } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo } from 'react'

type KwVis = NonNullable<GrowthInsightsData['keywordVisibility']>[number]

const impactPill = (impact: string) =>
  impact === 'positive' ? 'ok' : impact === 'negative' ? 'warn' : ''

const priorityPill = (p: string) =>
  p === 'high' ? 'warn' : p === 'medium' ? 'test' : 'ok'

function TrendChart({ dates, values, label, color = 'var(--color-accent)' }: { dates: string[]; values: number[]; label: string; color?: string }) {
  if (dates.length < 2) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const w = 500
  const h = 120
  const padX = 0
  const padY = 10

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * (w - padX * 2)
    const y = padY + (1 - (v - min) / range) * (h - padY * 2)
    return `${x},${y}`
  })

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--color-ink-3)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      <svg viewBox={`0 0 ${w} ${h + 30}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = padY + (1 - pct) * (h - padY * 2)
          const val = min + pct * range
          return (
            <g key={pct}>
              <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="var(--color-line)" strokeWidth="0.5" />
              <text x={w - padX + 4} y={y + 3} fontSize="9" fill="var(--color-ink-4)">{val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(val < 10 ? 1 : 0)}</text>
            </g>
          )
        })}
        {/* Line */}
        <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => {
          const [x, y] = p.split(',').map(Number)
          return <circle key={i} cx={x} cy={y} r="3" fill={color} />
        })}
        {/* Date labels */}
        {dates.map((d, i) => {
          if (dates.length > 8 && i % 2 !== 0 && i !== dates.length - 1) return null
          const x = padX + (i / (dates.length - 1)) * (w - padX * 2)
          return <text key={i} x={x} y={h + 20} fontSize="9" fill="var(--color-ink-4)" textAnchor="middle">{d}</text>
        })}
      </svg>
    </div>
  )
}

export default function GrowthPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const isIOS = appData?.platform === 'ios'

  // Growth Insights
  const { data: growthAnalysis, refetch: refetchGrowth } = useAnalysis<GrowthInsightsData>(slug, 'growth-insights')
  const { generate: generateGrowth, generating: generatingGrowth } = useGenerate(slug, 'growth-insights', { onSuccess: refetchGrowth })

  // Update Impact
  const { data: updateAnalysis, refetch: refetchUpdate } = useAnalysis<UpdateImpactData>(slug, 'update-impact')
  const { generate: generateUpdate, generating: generatingUpdate } = useGenerate(slug, 'update-impact', { onSuccess: refetchUpdate })

  const kwVis = growthAnalysis?.keywordVisibility ?? []
  const recommendations = growthAnalysis?.growthRecommendations ?? []

  const versions = (updateAnalysis?.versionHistory ?? []) as VersionHistoryItem[]
  const hasVersions = versions.length > 0
  const hasUpdateAnalysis = !!(updateAnalysis?.updateFrequency || updateAnalysis?.nextUpdatePlan?.length || updateAnalysis?.metadataTests?.length || updateAnalysis?.releaseNotesTips?.length)

  // Keyword visibility sorting
  const kwAccessors = useMemo(() => ({
    keyword: (k: KwVis) => k.keyword,
    rank: (k: KwVis) => k.rank ?? 999,
    volume: (k: KwVis) => k.volume,
    estimatedTraffic: (k: KwVis) => k.estimatedTraffic,
  }), [])
  const { sorted: sortedKws, sortKey, sortDir, toggle } = useTableSort(kwVis, kwAccessors)

  // Version table sort
  const vAccessors = useMemo(() => ({
    version: (v: VersionHistoryItem) => v.version,
    date: (v: VersionHistoryItem) => v.date,
  }), [])
  const { sorted: sortedVersions, sortKey: vSortKey, sortDir: vSortDir, toggle: vToggle } = useTableSort(versions, vAccessors)

  const rankingCount = kwVis.filter(k => k.rank !== null).length

  // Update Impact KPI computations
  const positiveUpdates = hasVersions ? versions.filter(v => v.asoImpact === 'positive').length : 0
  const latestVersion = hasVersions ? versions[0] : null

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Growth', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  let sectionNum = 0

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '\u2014' },
          { label: 'Growth', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => generateGrowth()} disabled={generatingGrowth}>{generatingGrowth ? 'Analyzing\u2026' : 'Analyze growth'}</button>
          <button className="btn accent" onClick={() => generateUpdate()} disabled={generatingUpdate}>{generatingUpdate ? 'Analyzing\u2026' : 'Analyze updates'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Growth, <em>measured</em>.</>}
        subtitle={growthAnalysis?.summary ?? updateAnalysis?.summary ?? 'Install trends, rating growth, keyword-driven traffic, version impact, and AI recommendations \u2014 all from real data.'}
        meta={
          <>
            INSTALLS \u00b7 <strong>{growthAnalysis?.currentInstalls || '\u2014'}</strong><br />
            RATING \u00b7 <strong>{growthAnalysis?.currentRating ? `${growthAnalysis.currentRating.toFixed(1)}/5` : '\u2014'}</strong><br />
            VISIBILITY \u00b7 <strong>{growthAnalysis?.visibilityScore ?? '\u2014'}</strong>
          </>
        }
      />

      <div className="content">
        {/* Combined KPI strip */}
        <div className="kpi-strip cols-6">
          <div className="kpi hl">
            <div className="label">Total installs</div>
            <div className="value">{growthAnalysis?.currentInstalls || '\u2014'}</div>
            <div className="delta">{growthAnalysis?.isAndroid === false ? 'not available for iOS' : growthAnalysis ? 'from Play Store' : 'generate to populate'}</div>
          </div>
          <div className="kpi">
            <div className="label">Rating</div>
            <div className="value">{growthAnalysis?.currentRating ? growthAnalysis.currentRating.toFixed(1) : '\u2014'}</div>
            <div className="delta">{growthAnalysis?.currentRatings ? `${growthAnalysis.currentRatings.toLocaleString()} ratings` : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Keywords ranking</div>
            <div className="value">{growthAnalysis ? `${rankingCount}/${kwVis.length}` : '\u2014'}</div>
            <div className="delta">{growthAnalysis ? 'tracked keywords with rank' : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Visibility score</div>
            <div className="value">{growthAnalysis?.visibilityScore ?? '\u2014'}</div>
            <div className="delta">{growthAnalysis ? 'from visibility analysis' : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Versions tracked</div>
            <div className="value">{hasVersions ? versions.length : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Positive updates</div>
            <div className="value" style={{ color: positiveUpdates > 0 ? 'var(--color-ok)' : undefined }}>{hasVersions ? positiveUpdates : '\u2014'}</div>
          </div>
        </div>

        {/* § Install Trend — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; {String(++sectionNum).padStart(2, '0')}</span><h2>Install <em>trend</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Weekly install estimates from store data.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {growthAnalysis?.installTrend && growthAnalysis.installTrend.dates.length >= 2 ? (
                <TrendChart dates={growthAnalysis.installTrend.dates} values={growthAnalysis.installTrend.values} label="Estimated installs (weekly avg)" color="var(--color-accent)" />
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  {isIOS || growthAnalysis?.isAndroid === false ? (
                    <p>Install data is not available for iOS apps. Apple does not expose download counts through public APIs.</p>
                  ) : (
                    <>
                      <p style={{ marginBottom: 12 }}>No install trend data yet.</p>
                      <button className="btn accent" onClick={() => generateGrowth()} disabled={generatingGrowth}>{generatingGrowth ? 'Analyzing\u2026' : 'Analyze growth'}</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* § Rating & Reviews Growth — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; {String(++sectionNum).padStart(2, '0')}</span><h2>Rating &amp; reviews <em>growth</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Rating score and review count over time from store snapshots.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {growthAnalysis?.ratingTrend && growthAnalysis.ratingTrend.dates.length >= 2 ? (
                <div className="grid-2">
                  <TrendChart dates={growthAnalysis.ratingTrend.dates} values={growthAnalysis.ratingTrend.scores} label="Rating score" color="var(--color-ok)" />
                  <TrendChart dates={growthAnalysis.ratingTrend.dates} values={growthAnalysis.ratingTrend.counts} label="Total ratings count" color="#6366f1" />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  {growthAnalysis && !growthAnalysis.currentRating ? (
                    <p>This app has no rating yet. Rating trends will appear once users start rating the app.</p>
                  ) : (
                    <>
                      <p style={{ marginBottom: 12 }}>No rating trend data yet. Data accumulates over time from daily snapshots.</p>
                      <button className="btn accent" onClick={() => generateGrowth()} disabled={generatingGrowth}>{generatingGrowth ? 'Analyzing\u2026' : 'Analyze growth'}</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* § Keyword-Driven Traffic — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; {String(++sectionNum).padStart(2, '0')}</span><h2>Keyword-driven <em>traffic</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Estimated organic traffic from keyword rankings x search volume.</div>
            </div>
          </div>
          <div className="card">
            {growthAnalysis?.totalEstimatedTraffic !== undefined && (
              <div className="card-head">
                <h3>Total estimated traffic</h3>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{growthAnalysis.totalEstimatedTraffic.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-ink-3)' }}> /month</span></span>
              </div>
            )}
            <div className="card-body tight">
              {sortedKws.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortHeader label="Keyword" sortKey="keyword" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} />
                      <SortHeader label="Rank" sortKey="rank" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                      <SortHeader label="Volume EST." sortKey="volume" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                      <SortHeader label="Est. Traffic" sortKey="estimatedTraffic" activeSortKey={sortKey} sortDir={sortDir} onSort={toggle} className="tn" />
                      <th className="tn">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedKws.map((k, i) => (
                      <tr key={i}>
                        <td><strong>{k.keyword}</strong></td>
                        <td className="tn num-big">
                          {k.rank ? (
                            <span style={{ color: k.rank <= 10 ? 'var(--color-ok)' : k.rank <= 50 ? '#d97706' : 'var(--color-ink-2)', fontWeight: 700 }}>#{k.rank}</span>
                          ) : (
                            <span style={{ color: 'var(--color-ink-4)' }}>&mdash;</span>
                          )}
                        </td>
                        <td className="tn num-big">{k.volume.toLocaleString()}</td>
                        <td className="tn num-big">
                          <strong style={{ color: k.estimatedTraffic > 1000 ? 'var(--color-ok)' : k.estimatedTraffic > 100 ? '#d97706' : 'var(--color-ink-2)' }}>
                            {k.estimatedTraffic.toLocaleString()}
                          </strong>
                        </td>
                        <td className="tn">
                          <span className={`pill ${k.trend === 'up' ? 'ok' : k.trend === 'down' ? 'warn' : ''}`}>
                            {k.trend === 'up' ? 'UP' : k.trend === 'down' ? 'DOWN' : 'STABLE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No keyword visibility data yet. Generate keywords first, then run Growth Insights.</p>
                  <button className="btn accent" onClick={() => generateGrowth()} disabled={generatingGrowth}>{generatingGrowth ? 'Analyzing\u2026' : 'Analyze growth'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* § Growth Recommendations — AI ANALYSIS */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; {String(++sectionNum).padStart(2, '0')}</span><h2>Growth <em>recommendations</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>Strategic growth advice based on your real data.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {recommendations.length > 0 ? (
                recommendations.map((r, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{
                      background: r.impact === 'high' ? '#ef4444' : r.impact === 'medium' ? '#d97706' : 'var(--color-ok)',
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="comp-name">{r.title}</div>
                      <div className="comp-meta">{r.detail}</div>
                    </div>
                    <span className={`pill ${r.impact === 'high' ? 'warn' : r.impact === 'medium' ? 'test' : 'ok'}`}>{r.impact.toUpperCase()}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No growth recommendations yet.</p>
                  <button className="btn accent" onClick={() => generateGrowth()} disabled={generatingGrowth}>{generatingGrowth ? 'Analyzing\u2026' : 'Analyze growth'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* § Version timeline */}
        {hasVersions && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">&sect; {String(++sectionNum).padStart(2, '0')}</span><h2>Version <em>timeline</em></h2></div>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '20px 0', overflowX: 'auto' }}>
                  {versions.map((v, i) => {
                    const isLast = i === versions.length - 1
                    const dotBg = isLast ? 'var(--color-accent)' : v.asoImpact === 'positive' ? 'var(--color-ok)' : v.asoImpact === 'negative' ? 'var(--color-warn, #d44)' : '#fff'
                    const dotBorder = isLast ? 'var(--color-accent)' : v.asoImpact === 'positive' ? 'var(--color-ok)' : v.asoImpact === 'negative' ? 'var(--color-warn, #d44)' : 'var(--color-ink)'
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', flexShrink: 0, padding: '0 20px' }}>
                        {!isLast && <div style={{ position: 'absolute', top: 18, left: '50%', right: '-50%', height: 1, background: 'var(--color-line)' }} />}
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: dotBg, border: `2px solid ${dotBorder}`, zIndex: 2, position: 'relative', ...(isLast ? { boxShadow: '0 0 0 4px var(--color-accent-wash)' } : {}) }} />
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11 }}>{v.version}{isLast ? ' \u2197' : ''}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.08em' }}>{v.date}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortHeader label="Version" sortKey="version" activeSortKey={vSortKey} sortDir={vSortDir} onSort={vToggle} />
                    <SortHeader label="Date" sortKey="date" activeSortKey={vSortKey} sortDir={vSortDir} onSort={vToggle} />
                    <th>Key changes</th>
                    <th>ASO impact</th>
                    <th className="tn">Rating</th>
                    <th className="tn">Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVersions.map((v) => (
                    <tr key={v.version}>
                      <td><strong>{v.version}</strong></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v.date}</td>
                      <td style={{ fontSize: 12, maxWidth: 280 }}>
                        {v.changes.slice(0, 2).join('; ')}
                        {v.changes.length > 2 && ` +${v.changes.length - 2} more`}
                      </td>
                      <td><span className={`pill ${impactPill(v.asoImpact)}`}>{v.asoImpact}</span></td>
                      <td className="tn num-big" style={{ color: v.ratingDelta.startsWith('+') ? 'var(--color-ok)' : v.ratingDelta.startsWith('-') ? 'var(--color-warn)' : 'var(--color-ink-3)' }}>{v.ratingDelta}</td>
                      <td className="tn num-big" style={{ color: v.downloadDelta.startsWith('+') ? 'var(--color-ok)' : v.downloadDelta.startsWith('-') ? 'var(--color-warn)' : 'var(--color-ink-3)' }}>{v.downloadDelta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* § Next update plan */}
        {updateAnalysis?.nextUpdatePlan && updateAnalysis.nextUpdatePlan.length > 0 && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">&sect; {String(++sectionNum).padStart(2, '0')}</span><h2>Next update <em>plan</em></h2></div>
            </div>
            <div className="grid-3">
              {updateAnalysis.nextUpdatePlan.map((item, i) => (
                <div className="card" key={i}>
                  <div className="card-head">
                    <h3>{item.change}</h3>
                    <span className={`pill ${priorityPill(item.priority)}`}>{item.priority.toUpperCase()}</span>
                  </div>
                  <div className="card-body">
                    <p>{item.expectedImpact}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* § Metadata A/B tests */}
        {updateAnalysis?.metadataTests && updateAnalysis.metadataTests.length > 0 && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">&sect; {String(++sectionNum).padStart(2, '0')}</span><h2>Metadata <em>tests</em></h2></div>
            </div>
            <div className="grid-3">
              {updateAnalysis.metadataTests.map((test, i) => (
                <div className="card" key={i}>
                  <div className="card-head"><h3>{test.element}</h3></div>
                  <div className="card-body">
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-ink-3)', marginBottom: 4 }}>Current</div>
                      <p style={{ fontSize: 13, margin: 0 }}>{test.current}</p>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-ink-3)', marginBottom: 4 }}>Suggested</div>
                      <p style={{ fontSize: 13, margin: 0 }}>{test.suggested}</p>
                    </div>
                    <div className="callout" style={{ marginTop: 0 }}>
                      <div className="callout-label">Hypothesis</div>
                      <p>{test.hypothesis}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* § Update frequency recommendation */}
        {updateAnalysis?.updateFrequency && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">&sect; {String(++sectionNum).padStart(2, '0')}</span><h2>Update <em>frequency</em></h2></div>
            </div>
            <div className="card">
              <div className="card-body">
                <p>{updateAnalysis.updateFrequency}</p>
              </div>
            </div>
          </section>
        )}

        {/* § Release notes tips */}
        {updateAnalysis?.releaseNotesTips && updateAnalysis.releaseNotesTips.length > 0 && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">&sect; {String(++sectionNum).padStart(2, '0')}</span><h2>Release notes <em>tips</em></h2></div>
            </div>
            <div className="card">
              <div className="card-body">
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {updateAnalysis.releaseNotesTips.map((tip, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* No update data at all — show generate prompt */}
        {!hasUpdateAnalysis && !hasVersions && (
          <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-ink-3)' }}>
            <p style={{ marginBottom: 16 }}>No update impact analysis yet. Generate one to get release strategy recommendations, metadata test ideas, and release notes tips.</p>
            <button className="btn accent" onClick={() => generateUpdate()} disabled={generatingUpdate}>{generatingUpdate ? 'Analyzing...' : 'Analyze updates'}</button>
          </div></div>
        )}
      </div>
    </>
  )
}
