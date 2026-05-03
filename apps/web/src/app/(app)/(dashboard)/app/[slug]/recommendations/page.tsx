'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { RecommendationsData, RecommendationItem } from '@/lib/analysis-types'
import { asArray } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo, useState } from 'react'

const impactRank = (r: RecommendationItem) => r.impact === 'high' ? 3 : r.impact === 'medium' ? 2 : 1
const effortRank = (r: RecommendationItem) => r.effort === 'high' ? 3 : r.effort === 'medium' ? 2 : 1

const impactPill = (v: string) => v === 'high' ? 'warn' : v === 'medium' ? 'test' : 'ok'
const effortPill = (v: string) => v === 'low' ? 'ok' : v === 'medium' ? 'test' : 'warn'

export default function RecommendationsPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''

  const { data: analysis, refetch } = useAnalysis<RecommendationsData>(slug, 'recommendations')
  const { generate, generating } = useGenerate(slug, 'recommendations', { onSuccess: refetch })
  const recommendations = asArray(analysis)

  const [filter, setFilter] = useState<string | null>(null)
  const filtered = filter ? recommendations.filter(r => r.impact === filter) : recommendations

  const recAccessors = useMemo(() => ({
    impact: (r: RecommendationItem) => impactRank(r),
    title: (r: RecommendationItem) => r.title,
    category: (r: RecommendationItem) => r.category,
    effort: (r: RecommendationItem) => effortRank(r),
  }), [])
  const { sorted: sortedRecs, sortKey: rSortKey, sortDir: rSortDir, toggle: rToggle } = useTableSort(filtered, recAccessors)

  const highCount = recommendations.filter(r => r.impact === 'high').length
  const medCount = recommendations.filter(r => r.impact === 'medium').length
  const lowCount = recommendations.filter(r => r.impact === 'low').length
  const categories = [...new Set(recommendations.map(r => r.category))]

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Recommendations', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 400, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'Recommendations', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate more'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={recommendations.length > 0 ? <>{recommendations.length} moves, <em>ranked</em>.</> : <>Recommendations</>}
        subtitle="Every module feeds into this list. Ranked by estimated install lift, grouped by priority."
        meta={
          recommendations.length > 0 ? (
            <>
              OPEN <strong>{recommendations.length}</strong><br />
              CRITICAL <strong>{highCount}</strong><br />
              CATEGORIES <strong>{categories.length}</strong>
            </>
          ) : undefined
        }
      />

      <div className="content">
        {recommendations.length > 0 && (
          <div className="kpi-strip cols-4">
            <div className="kpi">
              <div className="label">Total actions</div>
              <div className="value">{recommendations.length}</div>
            </div>
            <div className="kpi">
              <div className="label">High impact</div>
              <div className="value" style={{ color: 'var(--color-warn)' }}>{highCount}</div>
            </div>
            <div className="kpi">
              <div className="label">Medium impact</div>
              <div className="value" style={{ color: 'var(--color-accent)' }}>{medCount}</div>
            </div>
            <div className="kpi">
              <div className="label">Low effort wins</div>
              <div className="value" style={{ color: 'var(--color-ok)' }}>{recommendations.filter(r => r.effort === 'low').length}</div>
            </div>
          </div>
        )}

        {/* § 01 Prioritized actions */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 01</span><h2>Prioritized <em>actions</em></h2></div>
            <div className="chip-row">
              <span className={`chip${filter === null ? ' on' : ''}`} onClick={() => setFilter(null)}>All</span>
              <span className={`chip${filter === 'high' ? ' on' : ''}`} onClick={() => setFilter(filter === 'high' ? null : 'high')}>High</span>
              <span className={`chip${filter === 'medium' ? ' on' : ''}`} onClick={() => setFilter(filter === 'medium' ? null : 'medium')}>Medium</span>
              <span className={`chip${filter === 'low' ? ' on' : ''}`} onClick={() => setFilter(filter === 'low' ? null : 'low')}>Low</span>
            </div>
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table wrap-cells" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: 90 }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 80 }} />
                <col />
                <col style={{ width: 80 }} />
              </colgroup>
              <thead>
                <tr>
                  <SortHeader label="Priority" sortKey="impact" activeSortKey={rSortKey} sortDir={rSortDir} onSort={rToggle} />
                  <SortHeader label="Action" sortKey="title" activeSortKey={rSortKey} sortDir={rSortDir} onSort={rToggle} />
                  <SortHeader label="Source module" sortKey="category" activeSortKey={rSortKey} sortDir={rSortDir} onSort={rToggle} />
                  <SortHeader label="Effort" sortKey="effort" activeSortKey={rSortKey} sortDir={rSortDir} onSort={rToggle} />
                  <th>Est. lift</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecs.length > 0 ? sortedRecs.map((r, i) => (
                  <tr key={`${r.category}-${i}`}>
                    <td style={{ whiteSpace: 'nowrap' }}><span className={`pill ${impactPill(r.impact)}`}>{r.impact.toUpperCase()}</span></td>
                    <td><strong>{r.title}</strong><br /><small style={{ color: 'var(--color-ink-3)' }}>{r.description}</small></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.category}</td>
                    <td style={{ whiteSpace: 'nowrap' }}><span className={`pill ${effortPill(r.effort)}`}>{r.effort.toUpperCase()}</span></td>
                    <td style={{ fontSize: 12, fontStyle: 'italic', color: r.lift?.includes('+') ? 'var(--color-ok)' : r.lift?.includes('−') || r.lift?.includes('-') ? 'var(--color-warn, #d44)' : 'var(--color-accent)' }}>{r.lift ?? '—'}</td>
                    <td>{r.owner ?? '—'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-ink-3)' }}>
                      <p style={{ marginBottom: 12 }}>No recommendations yet. Generate an analysis to get prioritized actions.</p>
                      <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* § 02 By category */}
        {recommendations.length > 0 && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">§ 02</span><h2>By <em>category</em></h2></div>
            </div>
            <div className="grid-3">
              {categories.map(cat => {
                const catRecs = recommendations.filter(r => r.category === cat)
                const catHigh = catRecs.filter(r => r.impact === 'high').length
                return (
                  <div className="card" key={cat}>
                    <div className="card-head">
                      <h3>{cat}</h3>
                      <span className="tag">{catRecs.length} action{catRecs.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="card-body">
                      {catHigh > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <span className="pill warn">{catHigh} HIGH</span>
                        </div>
                      )}
                      <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13 }}>
                        {catRecs.slice(0, 3).map((r, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>{r.title}</li>
                        ))}
                        {catRecs.length > 3 && <li style={{ color: 'var(--color-ink-3)' }}>+{catRecs.length - 3} more</li>}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
