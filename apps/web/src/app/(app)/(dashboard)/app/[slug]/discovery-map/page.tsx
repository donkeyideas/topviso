'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import { DiscoveryFlowMap } from '@/components/dashboard/DiscoveryFlowMap'
import type { DiscoveryMapData } from '@/lib/analysis-types'

export default function DiscoveryMapPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const appPlatform = appData?.platform
  const { data: analysis, refetch } = useAnalysis<DiscoveryMapData>(slug, 'discovery-map')
  const { generate, generating } = useGenerate(slug, 'discovery-map', { onSuccess: refetch })

  const filteredSurfaces = analysis?.surfaces?.filter(s => {
    if (s.type !== 'store' || !appPlatform) return true
    if (appPlatform === 'ios') return !s.name.toLowerCase().includes('play')
    if (appPlatform === 'android') return !s.name.toLowerCase().includes('app store')
    return true
  })

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Discovery Map', isActive: true }]} />
        <div className="content">
          <div className="card">
            <div className="card-body">
              <div className="animate-pulse" style={{ height: 440, background: 'var(--color-line)', borderRadius: 8 }} />
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'Discovery Map', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn" onClick={() => generate()} disabled={generating}>{generating ? 'Mapping...' : 'Map surfaces'}</button>
          <button className="btn ghost">Export</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Every surface. <em>One map.</em></>}
        subtitle={analysis?.summary ?? '—'}
      />

      <div className="content">
        {/* § 01 Discovery flow map */}
        {filteredSurfaces?.length ? (
          <section>
            <div className="card">
              <div className="card-body" style={{ padding: '32px 24px' }}>
                <DiscoveryFlowMap surfaces={filteredSurfaces} platform={appPlatform} />
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No data yet</p>
              <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
            </div></div>
          </section>
        )}

        {/* § 02 Surface details */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 02</span><h2>Surface <em>details</em></h2></div>
          </div>
          <div className="grid-3">
            {filteredSurfaces?.length ? filteredSurfaces.map((surface, i) => (
              <div className="card" key={i}>
                <div className="card-head">
                  <h3>{surface.name}</h3>
                  <span className={`pill ${surface.optimizationStatus === 'optimized' ? 'ok' : surface.optimizationStatus === 'partial' ? 'live' : 'warn'}`}>
                    {(surface.optimizationStatus ?? 'unknown').toUpperCase()}
                  </span>
                </div>
                <div className="card-body">
                  <div className="app-card-stats">
                    <div className="acs"><div className="acs-label">Type</div><div className="acs-val">{(surface.type ?? '—').toUpperCase()}</div></div>
                    <div className="acs"><div className="acs-label">Traffic</div><div className="acs-val">{(surface.estimatedTraffic ?? '—').toUpperCase()}</div></div>
                  </div>
                  {(surface.topQueries?.length ?? 0) > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div className="acs-label" style={{ marginBottom: 4 }}>Top queries</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {surface.topQueries.map((q, j) => (
                          <span key={j} className="pill">{q}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="callout" style={{ marginTop: 14 }}>
                    <div className="callout-label">Recommendation</div>
                    <p>{surface.recommendation}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="card" style={{ gridColumn: '1 / -1' }}><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No data yet</p>
                <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
              </div></div>
            )}
          </div>
        </section>

        {/* § 03 Discovery gaps */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 03</span><h2>Discovery <em>gaps</em></h2></div>
          </div>
          <div className="grid-3">
            {analysis?.gaps ? analysis.gaps.map((gap, i) => (
              <div className="card" key={i}>
                <div className="card-head"><h3>{gap.surface}</h3><span className="pill warn">GAP</span></div>
                <div className="card-body">
                  <div className="callout warn">
                    <div className="callout-label">Issue</div>
                    <p>{gap.issue}</p>
                  </div>
                  <div className="callout ok" style={{ marginTop: 10 }}>
                    <div className="callout-label">Fix</div>
                    <p>{gap.fix}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="card" style={{ gridColumn: '1 / -1' }}><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No data yet</p>
                <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
              </div></div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
