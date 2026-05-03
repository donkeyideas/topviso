'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { CompetitorsData, OverviewData, KeywordsData, CompetitorAlert } from '@/lib/analysis-types'
import { asArray } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo } from 'react'

export default function CompetitorsPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<CompetitorsData>(slug, 'competitors')
  const { data: overviewData } = useAnalysis<OverviewData>(slug, 'overview')
  const { data: keywordsData } = useAnalysis<KeywordsData>(slug, 'keywords')
  const { generate, generating } = useGenerate(slug, 'competitors', { onSuccess: refetch })
  const rawData = analysis
  const competitors = Array.isArray(rawData) ? rawData : (rawData?.competitors ?? [])
  const alerts: CompetitorAlert[] = Array.isArray(rawData) ? [] : (rawData?.alerts ?? [])
  const keywords = asArray(keywordsData)
  const top10Keywords = keywords.filter(k => k.rank != null && k.rank <= 10).length
  const compAccessors = useMemo(() => ({
    name: (c: (typeof competitors)[0]) => c.name,
    overlapCount: (c: (typeof competitors)[0]) => c.overlapCount ?? 0,
    rating: (c: (typeof competitors)[0]) => c.rating ?? 0,
    threatLevel: (c: (typeof competitors)[0]) => c.threatLevel === 'high' ? 3 : c.threatLevel === 'medium' ? 2 : 1,
    monthlyDownloads: (c: (typeof competitors)[0]) => c.monthlyDownloads ?? '',
    estimatedMRR: (c: (typeof competitors)[0]) => c.estimatedMRR ?? '',
    llmSov: (c: (typeof competitors)[0]) => c.llmSov ?? '',
    trend30d: (c: (typeof competitors)[0]) => c.trend30d ?? '',
  }), [])
  const { sorted: sortedComps, sortKey: compSortKey, sortDir: compSortDir, toggle: compToggle } = useTableSort(competitors, compAccessors)

  // Aggregate keyword gaps & shared keywords from all competitors
  const allKeywordGaps = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of competitors) {
      for (const kw of c.keywordGaps ?? []) {
        map.set(kw, (map.get(kw) || 0) + 1)
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [competitors])

  const allSharedKeywords = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of competitors) {
      for (const kw of c.sharedKeywords ?? []) {
        map.set(kw, (map.get(kw) || 0) + 1)
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [competitors])

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Competitors', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'Discovery' },
          { label: 'Competitors', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn ghost" onClick={() => generate()} disabled={generating}>{generating ? 'Discovering...' : 'Auto-discover'}</button>
          <button className="btn accent">+ Add competitor</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Know your <em>enemy</em>.</>}
        subtitle="Every competitor, tracked across every discovery surface. Downloads, revenue, keywords, creatives, reviews, LLM recommendation rate, feature timeline."
        meta={
          <>
            TRACKED · <strong>{competitors.length > 0 ? `${competitors.length} apps` : '—'}</strong><br />
            HIGH THREATS · <strong>{competitors.filter(c => c.threatLevel === 'high').length || '—'}</strong><br />
            KEYWORD GAPS · <strong>{allKeywordGaps.length || '—'}</strong>
          </>
        }
      />

      <div className="content">
        {/* § 01 Head-to-head matrix */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 01</span><h2>Head-to-head <em>matrix</em></h2></div>
          </div>
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="App" sortKey="name" activeSortKey={compSortKey} sortDir={compSortDir} onSort={compToggle} />
                  <SortHeader label="Installs" sortKey="monthlyDownloads" activeSortKey={compSortKey} sortDir={compSortDir} onSort={compToggle} className="tn" />
                  <SortHeader label="Developer" sortKey="developer" activeSortKey={compSortKey} sortDir={compSortDir} onSort={compToggle} className="tn" />
                  <SortHeader label="Keyword overlap" sortKey="overlapCount" activeSortKey={compSortKey} sortDir={compSortDir} onSort={compToggle} className="tn" />
                  <SortHeader label="Rating" sortKey="rating" activeSortKey={compSortKey} sortDir={compSortDir} onSort={compToggle} className="tn" />
                  <SortHeader label="Threat" sortKey="threatLevel" activeSortKey={compSortKey} sortDir={compSortDir} onSort={compToggle} />
                </tr>
              </thead>
              <tbody>
                {competitors.length > 0 ? (
                  <>
                    <tr style={{ background: 'var(--color-accent-wash)' }}>
                      <td><strong>{appName || 'You'} (you)</strong></td>
                      <td className="tn num-big">{overviewData?.storeInstalls ?? '—'}</td>
                      <td className="tn num-big" style={{ color: 'var(--color-ink-3)', fontSize: 11 }}>—</td>
                      <td className="tn num-big">{top10Keywords || '—'}</td>
                      <td className="tn num-big">{overviewData?.storeRating != null ? overviewData.storeRating.toFixed(1) : '—'}</td>
                      <td><span className="pill ok">YOU</span></td>
                    </tr>
                    {sortedComps.map((c, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{c.name}</strong>
                          <br /><small style={{ color: 'var(--color-ink-3)' }}>{c.reason}</small>
                          {c.storeId && <><br /><small style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)' }}>{c.storeId}</small></>}
                        </td>
                        <td className="tn num-big">{c.monthlyDownloads ?? c.installs ?? '—'}</td>
                        <td className="tn num-big" style={{ fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.developer ?? '—'}</td>
                        <td className="tn num-big">{c.overlapCount ?? '—'}</td>
                        <td className="tn num-big">{c.rating != null ? c.rating.toFixed(1) : '—'}</td>
                        <td><span className={`pill ${c.threatLevel === 'high' ? 'warn' : c.threatLevel === 'medium' ? 'test' : 'ok'}`}>{c.threatLevel.toUpperCase()}</span></td>
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-ink-3)' }}>
                      <p style={{ marginBottom: 12 }}>No competitors discovered yet. Run auto-discovery to find apps competing for your keywords and audience.</p>
                      <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Discovering...' : 'Auto-discover'}</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* § 02 Alerts & moves */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 02</span><h2>Alerts &amp; <em>moves</em></h2></div>
            <div className="section-sub">Competitor strengths, weaknesses, and opportunities to exploit.</div>
          </div>
          {alerts.length > 0 ? (
            <div className="card">
              <div className="card-body tight">
                {alerts.map((alert, i) => {
                  const typeColor = alert.type === 'competitor-move' ? 'var(--color-warn, #d44)'
                    : alert.type === 'keyword-shift' ? 'var(--color-accent)'
                    : alert.type === 'opportunity' ? 'var(--color-ok)'
                    : 'var(--color-accent)'
                  const typeLabel = alert.type.replace('-', ' ').toUpperCase()
                  return (
                    <div className="review-item" key={i}>
                      <div className="rv-meta">
                        <span style={{ color: typeColor }}>{typeLabel}</span>
                        <span>{alert.competitor}</span>
                        <span>{alert.timeAgo}</span>
                      </div>
                      <div className="rv-text">{alert.text}</div>
                      <div className="rv-action">{alert.action}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : competitors.length > 0 ? (
            <div className="grid-2">
              {competitors.filter(c => c.threatLevel === 'high').concat(competitors.filter(c => c.threatLevel !== 'high')).slice(0, 4).map((c, i) => (
                <div className="card" key={i}>
                  <div className="card-head" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ flex: 1 }}>{c.name}</h3>
                    <span className={`pill ${c.threatLevel === 'high' ? 'warn' : c.threatLevel === 'medium' ? 'test' : 'ok'}`} style={{ fontSize: 10 }}>{c.threatLevel.toUpperCase()}</span>
                    {c.rating != null && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-2)' }}>{c.rating.toFixed(1)}</span>}
                  </div>
                  <div className="card-body" style={{ fontSize: 13 }}>
                    {c.strengths.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.08em', marginBottom: 4 }}>STRENGTHS</div>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {c.strengths.map((s, j) => <li key={j} style={{ color: 'var(--color-ink-2)', marginBottom: 2 }}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {c.weaknesses.length > 0 && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#22c55e', letterSpacing: '0.08em', marginBottom: 4 }}>WEAKNESSES TO EXPLOIT</div>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {c.weaknesses.map((w, j) => <li key={j} style={{ color: 'var(--color-ink-2)', marginBottom: 2 }}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-ink-3)' }}>
                <p style={{ marginBottom: 12 }}>No competitor alerts yet. Discover competitors first to track their moves, keyword shifts, and opportunities.</p>
                <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Discovering...' : 'Auto-discover'}</button>
              </div>
            </div>
          )}
        </section>

        {/* § 03 Keyword gap analysis */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 03</span><h2>AI keyword <em>gap analysis</em></h2></div>
          </div>
          {competitors.length > 0 ? (
            <div className="grid-2">
              <div className="card">
                <div className="card-head"><h3>Keywords they rank for, you don&apos;t</h3></div>
                <div className="card-body">
                  {allKeywordGaps.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr><th>Keyword</th><th className="tn">Competitors</th></tr>
                      </thead>
                      <tbody>
                        {allKeywordGaps.slice(0, 10).map(([kw, count]) => (
                          <tr key={kw}>
                            <td style={{ fontSize: 13 }}>{kw}</td>
                            <td className="tn num-big">{count}/{competitors.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: 'var(--color-ink-3)', fontSize: 13 }}>Re-run auto-discover to generate keyword gap data.</p>
                  )}
                </div>
              </div>
              <div className="card">
                <div className="card-head"><h3>Keywords you both rank for</h3></div>
                <div className="card-body">
                  {allSharedKeywords.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr><th>Keyword</th><th className="tn">Overlap</th></tr>
                      </thead>
                      <tbody>
                        {allSharedKeywords.slice(0, 10).map(([kw, count]) => (
                          <tr key={kw}>
                            <td style={{ fontSize: 13 }}>{kw}</td>
                            <td className="tn num-big">{count}/{competitors.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: 'var(--color-ink-3)', fontSize: 13 }}>Re-run auto-discover to generate shared keyword data.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-ink-3)' }}>
                <p style={{ marginBottom: 12 }}>No keyword gap data yet. Discover competitors first to analyze keyword overlaps and gaps.</p>
                <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Discovering...' : 'Auto-discover'}</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
