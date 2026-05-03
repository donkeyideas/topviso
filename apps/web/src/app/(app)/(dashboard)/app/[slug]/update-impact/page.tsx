'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { UpdateImpactData, VersionHistoryItem } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo } from 'react'

const impactPill = (impact: string) =>
  impact === 'positive' ? 'ok' : impact === 'negative' ? 'warn' : ''

const priorityPill = (p: string) =>
  p === 'high' ? 'warn' : p === 'medium' ? 'test' : 'ok'

export default function UpdateImpactPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<UpdateImpactData>(slug, 'update-impact')
  const { generate, generating } = useGenerate(slug, 'update-impact', { onSuccess: refetch })

  const versions = (analysis?.versionHistory ?? []) as VersionHistoryItem[]
  const hasVersions = versions.length > 0
  const hasAnalysis = !!(analysis?.updateFrequency || analysis?.nextUpdatePlan?.length || analysis?.metadataTests?.length || analysis?.releaseNotesTips?.length)

  // Version table sort
  const vAccessors = useMemo(() => ({
    version: (v: VersionHistoryItem) => v.version,
    date: (v: VersionHistoryItem) => v.date,
  }), [])
  const { sorted: sortedVersions, sortKey: vSortKey, sortDir: vSortDir, toggle: vToggle } = useTableSort(versions, vAccessors)

  // KPI computations
  const positiveUpdates = hasVersions ? versions.filter(v => v.asoImpact === 'positive').length : 0
  const latestVersion = hasVersions ? versions[0] : null

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Update Impact', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  let sectionNum = 0

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'Update Impact', isActive: true },
        ]}
      >
        <div className="top-strip-actions"><button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing...' : 'Analyze latest'}</button></div>
      </TopStrip>

      <PageHero
        title={<>Did that update <em>help</em>?</>}
        subtitle={analysis?.summary ?? 'Track version releases, measure ASO impact, and plan your next update for maximum visibility.'}
        meta={
          hasAnalysis ? (
            <>
              {hasVersions && <>VERSIONS <strong>{versions.length}</strong><br /></>}
              {hasVersions && <>POSITIVE <strong>{positiveUpdates}</strong><br /></>}
              PLANNED <strong>{analysis?.nextUpdatePlan?.length ?? 0}</strong><br />
              TESTS <strong>{analysis?.metadataTests?.length ?? 0}</strong>
            </>
          ) : undefined
        }
      />

      <div className="content">
        {/* KPI strip — only show version KPIs when we have version data */}
        {hasAnalysis && (
          <div className={`kpi-strip ${hasVersions ? 'cols-4' : ''}`}>
            {hasVersions && (
              <>
                <div className="kpi">
                  <div className="label">Versions tracked</div>
                  <div className="value">{versions.length}</div>
                </div>
                <div className="kpi">
                  <div className="label">Positive impact</div>
                  <div className="value" style={{ color: 'var(--color-ok)' }}>{positiveUpdates}</div>
                </div>
                <div className="kpi">
                  <div className="label">Latest version</div>
                  <div className="value sm">{latestVersion?.version ?? '—'}</div>
                </div>
              </>
            )}
            <div className="kpi">
              <div className="label">Planned changes</div>
              <div className="value">{analysis?.nextUpdatePlan?.length ?? 0}</div>
            </div>
            <div className="kpi">
              <div className="label">Metadata tests</div>
              <div className="value">{analysis?.metadataTests?.length ?? 0}</div>
            </div>
            <div className="kpi">
              <div className="label">Release tips</div>
              <div className="value">{analysis?.releaseNotesTips?.length ?? 0}</div>
            </div>
          </div>
        )}

        {/* § Version timeline — first section */}
        {hasVersions && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>Version <em>timeline</em></h2></div>
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
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11 }}>{v.version}{isLast ? ' ↗' : ''}</div>
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
        {analysis?.nextUpdatePlan && analysis.nextUpdatePlan.length > 0 && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>Next update <em>plan</em></h2></div>
            </div>
            <div className="grid-3">
              {analysis.nextUpdatePlan.map((item, i) => (
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
        {analysis?.metadataTests && analysis.metadataTests.length > 0 && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>Metadata <em>tests</em></h2></div>
            </div>
            <div className="grid-3">
              {analysis.metadataTests.map((test, i) => (
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
        {analysis?.updateFrequency && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>Update <em>frequency</em></h2></div>
            </div>
            <div className="card">
              <div className="card-body">
                <p>{analysis.updateFrequency}</p>
              </div>
            </div>
          </section>
        )}

        {/* § Release notes tips */}
        {analysis?.releaseNotesTips && analysis.releaseNotesTips.length > 0 && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>Release notes <em>tips</em></h2></div>
            </div>
            <div className="card">
              <div className="card-body">
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {analysis.releaseNotesTips.map((tip, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* No data at all — show generate prompt */}
        {!hasAnalysis && !hasVersions && (
          <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-ink-3)' }}>
            <p style={{ marginBottom: 16 }}>No update impact analysis yet. Generate one to get release strategy recommendations, metadata test ideas, and release notes tips.</p>
            <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing...' : 'Analyze latest'}</button>
          </div></div>
        )}
      </div>
    </>
  )
}
