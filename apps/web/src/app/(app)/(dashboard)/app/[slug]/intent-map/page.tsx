'use client'

import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { IntentMapData, IntentKeyword } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo } from 'react'

type Gap = IntentMapData['gaps'][number]

function normalizeKw(kw: string | IntentKeyword): { kw: string; state: 'ours' | 'win' | 'miss' } {
  if (typeof kw === 'string') return { kw, state: 'ours' }
  return kw
}

export default function IntentMapPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData } = useApp(slug)
  const appId = slug
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<IntentMapData>(appId, 'intent-map')
  const { generate, generating } = useGenerate(appId, 'intent-map', { onSuccess: refetch })

  const clusters = analysis?.clusters ?? []
  const hasClusters = clusters.length > 0

  const gapAccessors = useMemo(() => ({
    intent: (g: Gap) => g.intent,
  }), [])
  const gaps = (analysis?.gaps ?? []) as Gap[]
  const { sorted: sortedGaps, sortKey: gSK, sortDir: gSD, toggle: gT } = useTableSort(gaps, gapAccessors)

  // Computed KPIs
  const totalKeywords = hasClusters ? clusters.reduce((s, c) => s + c.keywords.length, 0) : 0
  const dominant = hasClusters
    ? [...clusters].sort((a, b) => b.keywords.length - a.keywords.length)[0]
    : null
  const weakest = hasClusters
    ? [...clusters].sort((a, b) => a.keywords.length - b.keywords.length)[0]
    : null

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName ?? '—' },
          { label: 'Discovery' },
          { label: 'Intent Map', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" disabled={generating} onClick={() => generate()}>
            {generating ? 'Clustering...' : 'Cluster keywords'}
          </button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Optimize for <em>intent</em>.</>}
        subtitle="Intent Map groups your keywords into user-task clusters — the semantic buckets the stores match on after Apple App Store Tags and Google Guided Search. Routes actions back into your other tabs."
        meta={
          hasClusters ? (
            <>
              CLUSTERS <strong>{clusters.length}</strong><br />
              KEYWORDS <strong>{totalKeywords}</strong><br />
              GAPS <strong>{gaps.length}</strong>
            </>
          ) : (
            <>
              CLUSTERS <strong>—</strong><br />
              DOMINANT <strong>—</strong><br />
              MISSING <strong>—</strong>
            </>
          )
        }
      />

      <div className="content">
        {hasClusters && (
          <div className="kpi-strip cols-4">
            <div className="kpi">
              <div className="label">Clusters</div>
              <div className="value">{clusters.length}</div>
            </div>
            <div className="kpi">
              <div className="label">Total keywords</div>
              <div className="value">{totalKeywords}</div>
            </div>
            <div className="kpi">
              <div className="label">Dominant intent</div>
              <div className="value sm">{dominant?.intent ?? '—'}</div>
            </div>
            <div className="kpi">
              <div className="label">Weakest intent</div>
              <div className="value sm" style={{ color: 'var(--color-warn)' }}>{weakest?.intent ?? '—'}</div>
            </div>
          </div>
        )}

        {/* § 01 Intent coverage map */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 01</span><h2>Intent coverage <em>map</em></h2></div>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="card-head"><h3>What you cover</h3><span className="tag">pulled from Keywords tab</span></div>
              <div className="card-body">
                {hasClusters ? clusters.map((c) => (
                  <div className="intent-cluster" key={c.intent}>
                    <div className="ic-head">
                      <div className="ic-name">{c.intent}</div>
                      <div className="ic-score-wrap">
                        {c.coveragePct != null && (
                          <div style={{ width: 80, height: 4, background: 'var(--color-paper-3, #e0dbce)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 2, width: `${c.coveragePct}%`, background: c.coveragePct >= 60 ? 'var(--color-ok)' : 'var(--color-warn, #d44)' }} />
                          </div>
                        )}
                        <span className="ic-score" style={{ color: c.coveragePct != null ? (c.coveragePct >= 60 ? 'var(--color-ok)' : 'var(--color-warn, #d44)') : undefined }}>
                          {c.optimization}{c.coveragePct != null ? ` · ${c.coveragePct}%` : ''}
                        </span>
                      </div>
                    </div>
                    <div>{c.keywords.map((kwRaw, ki) => {
                      const { kw, state } = normalizeKw(kwRaw)
                      return <span className={`kw ${state}`} key={ki}>{kw}</span>
                    })}</div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ marginBottom: 16, color: 'var(--color-ink-3)' }}>No data yet</p>
                    <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Clustering...' : 'Generate'}</button>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h3>Recommended moves</h3><span className="tag">routes to other tabs</span></div>
              <div className="card-body tight">
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortHeader label="Intent gap" sortKey="intent" activeSortKey={gSK} sortDir={gSD} onSort={gT} />
                      <th>Suggested keywords</th>
                      <th>Reasoning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGaps.length > 0 ? sortedGaps.map((g) => (
                      <tr key={g.intent}>
                        <td><strong>{g.intent}</strong></td>
                        <td style={{ fontSize: 12 }}>{g.suggestedKeywords.join(', ')}</td>
                        <td style={{ fontSize: 12 }}>{g.reasoning}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-ink-3)' }}>No gaps found yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
