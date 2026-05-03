'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { MarketIntelData } from '@/lib/analysis-types'
import { useState } from 'react'

// Deterministic color from name
const iconColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#a855f7']
function nameColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return iconColors[Math.abs(hash) % iconColors.length]
}

function LeaderboardIcon({ name, iconUrl }: { name: string; iconUrl?: string | undefined }) {
  const [failed, setFailed] = useState(false)
  if (iconUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl} alt={name} width={36} height={36}
        referrerPolicy="no-referrer" crossOrigin="anonymous"
        onError={() => setFailed(true)}
        style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, objectFit: 'cover' }}
      />
    )
  }
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8, background: nameColor(name),
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 15, flexShrink: 0,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function ArrowIcon({ direction }: { direction: string }) {
  const d = (direction ?? '').toLowerCase()
  if (d.includes('up') || d.includes('rising') || d.includes('growing')) {
    return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3L15 10H3L9 3Z" fill="white" /></svg>
  }
  if (d.includes('down') || d.includes('declining') || d.includes('falling')) {
    return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 15L3 8H15L9 15Z" fill="white" /></svg>
  }
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="7" width="12" height="4" rx="2" fill="white" /></svg>
}

function directionBg(direction: string): string {
  const d = (direction ?? '').toLowerCase()
  if (d.includes('up') || d.includes('rising') || d.includes('growing')) return 'var(--color-ok)'
  if (d.includes('down') || d.includes('declining') || d.includes('falling')) return '#ef4444'
  return '#6b7280'
}

export default function MarketIntelPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<MarketIntelData>(slug, 'market-intel')
  const { generate, generating } = useGenerate(slug, 'market-intel', { onSuccess: refetch })

  const leaderboard = analysis?.categoryLeaderboard ?? []
  const competitors = analysis?.competitors ?? []
  const trends = analysis?.trends ?? []
  const whitespace = analysis?.whitespace ?? []

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Market Intel', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '\u2014' },
          { label: 'Market Intel', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>The full market, in one <em>view</em>.</>}
        subtitle={analysis?.summary ?? 'Category leaderboard, competitors, market trends, and whitespace opportunities \u2014 real data mixed with AI analysis.'}
        meta={
          <>
            SATURATION · <strong>{analysis?.marketOverview?.saturation?.toUpperCase() ?? '\u2014'}</strong><br />
            COMPETITORS · <strong>{analysis?.competitorsTracked ?? '\u2014'}</strong><br />
            KEYWORDS · <strong>{analysis?.keywordsTracked ?? '\u2014'}</strong>
          </>
        }
      />

      <div className="content">
        {/* KPI strip */}
        <div className="kpi-strip cols-4">
          <div className="kpi hl">
            <div className="label">Category position</div>
            <div className="value">{analysis?.categoryPosition ? `#${analysis.categoryPosition}` : '\u2014'}</div>
            <div className="delta">{analysis?.categoryPosition ? 'in category leaderboard' : 'generate to populate'}</div>
          </div>
          <div className="kpi">
            <div className="label">Competitors tracked</div>
            <div className="value">{analysis?.competitorsTracked ?? '\u2014'}</div>
            <div className="delta">{analysis ? (competitors.length > 0 ? 'from competitor analysis' : 'run competitors first') : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Keywords tracked</div>
            <div className="value">{analysis?.keywordsTracked ?? '\u2014'}</div>
            <div className="delta">{analysis ? 'across all markets' : '\u2014'}</div>
          </div>
          <div className="kpi">
            <div className="label">Category rating avg</div>
            <div className="value">{analysis?.categoryRatingAvg ? `${analysis.categoryRatingAvg}/5` : '\u2014'}</div>
            <div className="delta">{leaderboard.length > 0 ? `across ${leaderboard.length} top apps` : '\u2014'}</div>
          </div>
        </div>

        {/* 01 Category Leaderboard — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 01</span><h2>Category <em>leaderboard</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>Top apps in your category from the store.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body tight">
              {leaderboard.length > 0 ? (
                leaderboard.map((app, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px',
                    borderBottom: i < leaderboard.length - 1 ? '1px solid var(--color-line)' : 'none',
                  }}>
                    <div style={{
                      width: 24, fontSize: 13, textAlign: 'right', flexShrink: 0,
                      color: app.rank <= 3 ? 'var(--color-ink)' : 'var(--color-ink-3)',
                      fontWeight: app.rank <= 3 ? 700 : 400,
                    }}>#{app.rank}</div>
                    <LeaderboardIcon name={app.name} iconUrl={app.iconUrl} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-ink-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.developer}</div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-ink-2)', flexShrink: 0 }}>
                      {app.rating.toFixed(1)}<span style={{ color: '#eab308' }}>&#9733;</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No leaderboard data yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 02 Market Trends — AI ANALYSIS */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 02</span><h2>Market <em>trends</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>Industry-level trends and shifts affecting your vertical.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {trends.length > 0 ? (
                trends.map((t, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{ background: directionBg(t.direction) }}>
                      <ArrowIcon direction={t.direction} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="comp-name">{t.trend}</div>
                      <div className="comp-meta">{t.detail}</div>
                    </div>
                    <span className={`pill ${t.relevance === 'high' ? 'ok' : t.relevance === 'medium' ? 'test' : ''}`}>{t.relevance.toUpperCase()}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No market trend data yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 03 Top Competitors — REAL DATA */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 03</span><h2>Top <em>competitors</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
              <div className="section-sub" style={{ margin: 0 }}>From your competitor analysis.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {competitors.length > 0 ? (
                competitors.map((comp, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{
                      background: comp.threatLevel === 'high' ? '#ef4444' : comp.threatLevel === 'medium' ? '#d97706' : 'var(--color-ok)',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="comp-name">{comp.name}</div>
                      <div className="comp-meta">{comp.reason}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                      {comp.rating && <span style={{ fontSize: 12, color: 'var(--color-ink-2)' }}>{Number(comp.rating).toFixed(1)}<span style={{ color: '#eab308' }}>&#9733;</span></span>}
                      <span className={`pill ${comp.threatLevel === 'high' ? 'warn' : comp.threatLevel === 'medium' ? 'test' : 'ok'}`}>
                        {comp.threatLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No competitor data yet. Run competitor analysis first, then generate Market Intel.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 04 Whitespace Opportunities — AI ANALYSIS */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">&sect; 04</span><h2>Whitespace <em>opportunities</em></h2></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>AI ANALYSIS</span>
              <div className="section-sub" style={{ margin: 0 }}>Underserved niches and market gaps.</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              {whitespace.length > 0 ? (
                whitespace.map((w, i) => (
                  <div className="comp-row" key={i}>
                    <div className="comp-icon" style={{ background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="comp-name">{w.gap}</div>
                      <div className="comp-meta"><strong>Audience:</strong> {w.audience}</div>
                      <div className="comp-meta" style={{ marginTop: 4 }}><strong>Action:</strong> {w.recommendation}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-ink-3)' }}>
                  <p style={{ marginBottom: 12 }}>No whitespace analysis yet.</p>
                  <button className="btn accent" onClick={() => generate()} disabled={generating}>{generating ? 'Analyzing\u2026' : 'Generate'}</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Summary callout */}
        {analysis?.marketOverview && (
          <section>
            <div className="callout">
              <div className="callout-label">Market saturation: <strong>{analysis.marketOverview.saturation?.toUpperCase()}</strong></div>
              <p>{analysis.marketOverview.insight}</p>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
