'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { LocalizationData, MarketOpportunity, MarketPerformance } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo } from 'react'

type Loc = LocalizationData['localizations'][number]

const scoreColor = (score: number) =>
  score >= 70 ? 'var(--color-ok)' : score >= 40 ? '#c9a227' : 'var(--color-warn)'

const competitionPill = (c: string) =>
  c === 'low' ? 'ok' : c === 'medium' ? 'test' : 'warn'

const sizePill = (s: string) =>
  s === 'large' ? 'ok' : s === 'medium' ? 'test' : ''

const statusPill = (s: string) =>
  s === 'live' ? 'live' : s === 'draft' ? 'draft' : 'warn'

export default function LocalizationPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''

  const { data: analysis, refetch } = useAnalysis<LocalizationData>(slug, 'localization')
  const { generate, generating } = useGenerate(slug, 'localization', { onSuccess: refetch })

  // Localization table sort
  const locAccessors = useMemo(() => ({
    locale: (l: Loc) => l.locale,
    title: (l: Loc) => l.title,
  }), [])
  const locs = (analysis?.localizations ?? []) as Loc[]
  const hasLocs = locs.length > 0
  const { sorted: sortedLocs, sortKey: lSortKey, sortDir: lSortDir, toggle: lToggle } = useTableSort(locs, locAccessors)

  // Market opportunity sort
  const moAccessors = useMemo(() => ({
    market: (m: MarketOpportunity) => m.market,
    opportunityScore: (m: MarketOpportunity) => m.opportunityScore,
    categoryFit: (m: MarketOpportunity) => m.categoryFit,
  }), [])
  const opportunities = (analysis?.marketOpportunities ?? []) as MarketOpportunity[]
  const hasOpps = opportunities.length > 0
  const { sorted: sortedOpps, sortKey: moSortKey, sortDir: moSortDir, toggle: moToggle } = useTableSort(opportunities, moAccessors)

  // Market performance sort
  const mpAccessors = useMemo(() => ({
    market: (m: MarketPerformance) => m.market,
    keywordsCovered: (m: MarketPerformance) => m.keywordsCovered,
  }), [])
  const performance = (analysis?.marketPerformance ?? []) as MarketPerformance[]
  const hasPerf = performance.length > 0
  const { sorted: sortedPerf, sortKey: mpSortKey, sortDir: mpSortDir, toggle: mpToggle } = useTableSort(performance, mpAccessors)

  // KPI computations
  const avgOppScore = hasOpps ? Math.round(opportunities.reduce((s, o) => s + o.opportunityScore, 0) / opportunities.length) : null
  const topMarket = hasOpps ? [...opportunities].sort((a, b) => b.opportunityScore - a.opportunityScore)[0] : null
  const liveMarkets = hasPerf ? performance.filter(p => p.status === 'live').length : 0

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Localization', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'Localization', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate localizations'}</button>
          <button className="btn ghost">Translate selected</button>
          <button className="btn ghost">+ Add market</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>62 markets, <em>one dashboard</em>.</>}
        subtitle="Market opportunity matrix shows where to localize next, scored by market size × category fit. AI-translated listings ready for review per market."
        meta={
          hasLocs ? (
            <>
              LOCALES <strong>{locs.length}</strong>
            </>
          ) : undefined
        }
      />

      <div className="content">
        {(hasLocs || hasOpps || hasPerf) && (
          <div className="kpi-strip cols-4">
            <div className="kpi">
              <div className="label">Locales generated</div>
              <div className="value">{locs.length}</div>
            </div>
            <div className="kpi">
              <div className="label">Markets analyzed</div>
              <div className="value">{opportunities.length}</div>
            </div>
            <div className="kpi">
              <div className="label">Avg opportunity</div>
              <div className="value" style={{ color: avgOppScore ? scoreColor(avgOppScore) : undefined }}>{avgOppScore ?? '—'}</div>
            </div>
            <div className="kpi">
              <div className="label">Live markets</div>
              <div className="value">{liveMarkets}</div>
            </div>
          </div>
        )}

        {/* § 01 Market opportunity matrix */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 01</span><h2>Market <em>opportunity matrix</em></h2></div>
          </div>
          {hasOpps ? (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <SortHeader label="Market" sortKey="market" activeSortKey={moSortKey} sortDir={moSortDir} onSort={moToggle} />
                    <th>Locale</th>
                    <th>Size</th>
                    <SortHeader label="Category fit" sortKey="categoryFit" activeSortKey={moSortKey} sortDir={moSortDir} onSort={moToggle} className="tn" />
                    <th>Competition</th>
                    <SortHeader label="Opportunity" sortKey="opportunityScore" activeSortKey={moSortKey} sortDir={moSortDir} onSort={moToggle} className="tn" />
                    <th>Recommendation</th>
                    <th>Status</th>
                    <th>Completeness</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOpps.map((opp) => (
                    <tr key={opp.locale}>
                      <td><input type="checkbox" defaultChecked={opp.status === 'localized'} /></td>
                      <td><strong>{opp.market}</strong></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{opp.locale}</td>
                      <td><span className={`pill ${sizePill(opp.marketSize)}`}>{opp.marketSize}</span></td>
                      <td className="tn num-big">{opp.categoryFit}</td>
                      <td><span className={`pill ${competitionPill(opp.competition)}`}>{opp.competition}</span></td>
                      <td className="tn">
                        <span className="num-big" style={{ color: scoreColor(opp.opportunityScore) }}>{opp.opportunityScore}</span>
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.recommendation}</td>
                      <td><span className={`pill ${opp.status === 'localized' ? 'ok' : opp.status === 'ai-draft' ? 'test' : 'draft'}`}>
                        {(opp.status ?? 'unknown').toUpperCase().replace('-', ' ')}
                      </span></td>
                      <td>
                        {opp.completeness != null ? (
                          <div className="bar" style={{ width: 100 }}>
                            <div className={`fill ${opp.completeness >= 80 ? 'ok' : opp.completeness >= 40 ? 'accent' : 'warn'}`}
                                 style={{ width: `${opp.completeness}%` }} />
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        {opp.status === 'not-localized' || opp.status === 'ai-draft'
                          ? <button className="btn ghost" style={{ fontSize: 11 }}>Translate</button>
                          : opp.status === 'localized'
                            ? <button className="btn ghost" style={{ fontSize: 11 }}>Edit</button>
                            : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No data yet</p>
              <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
            </div></div>
          )}

          {topMarket && (
            <div className="callout" style={{ marginTop: 16 }}>
              <div className="callout-label">TOP OPPORTUNITY</div>
              <p>{topMarket.market} ({topMarket.locale}) — score {topMarket.opportunityScore}/100. {topMarket.recommendation}</p>
            </div>
          )}
        </section>

        {/* § 02 AI-generated localizations */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 02</span><h2>AI-generated <em>localizations</em></h2></div>
          </div>
          {hasLocs ? (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortHeader label="Locale" sortKey="locale" activeSortKey={lSortKey} sortDir={lSortDir} onSort={lToggle} />
                    <SortHeader label="Title" sortKey="title" activeSortKey={lSortKey} sortDir={lSortDir} onSort={lToggle} />
                    <th>Subtitle</th>
                    <th>Short description</th>
                    <th>Keywords</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLocs.map((loc) => (
                    <tr key={loc.locale}>
                      <td><strong>{loc.locale}</strong></td>
                      <td>{loc.title}</td>
                      <td>{loc.subtitle}</td>
                      <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.shortDescription}</td>
                      <td style={{ fontSize: 12 }}>{loc.keywords.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No data yet</p>
              <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
            </div></div>
          )}
        </section>

        {/* § 03 Market-by-market performance */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 03</span><h2>Market-by-market <em>performance</em></h2></div>
          </div>
          {hasPerf ? (
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortHeader label="Market" sortKey="market" activeSortKey={mpSortKey} sortDir={mpSortDir} onSort={mpToggle} />
                    <th>Locale</th>
                    <th className="tn">Downloads</th>
                    <SortHeader label="Keywords" sortKey="keywordsCovered" activeSortKey={mpSortKey} sortDir={mpSortDir} onSort={mpToggle} className="tn" />
                    <th className="tn">CVR</th>
                    <th className="tn">Rating</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPerf.map((mp) => (
                    <tr key={mp.locale}>
                      <td><strong>{mp.market}</strong></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{mp.locale}</td>
                      <td className="tn num-big">{mp.estimatedDownloads}</td>
                      <td className="tn num-big">{mp.keywordsCovered}</td>
                      <td className="tn num-big">{mp.conversionRate}</td>
                      <td className="tn num-big">{mp.rating != null ? mp.rating.toFixed(1) : '—'}</td>
                      <td><span className={`pill ${statusPill(mp.status)}`}>{mp.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No data yet</p>
              <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</button>
            </div></div>
          )}
        </section>
      </div>
    </>
  )
}
