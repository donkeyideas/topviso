'use client'

import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { LlmTrackData, LlmTrackItem, LlmCitation, LlmPromptRow, LlmOptimizationTip, DiscoveryMapData } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { DiscoveryFlowMap } from '@/components/dashboard/DiscoveryFlowMap'
import { useGenerateContext } from '@/contexts/GenerateContext'
import { useMemo, useState, useCallback, useRef } from 'react'

const posRank = (p: string) => p === '1st' ? 4 : p === '2nd' ? 3 : p === '3rd' ? 2 : 1

export default function LLMDiscoveryPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData } = useApp(slug)
  const appId = slug
  const appName = appData?.name ?? ''
  const appPlatform = appData?.platform

  /* ── LLM Tracker ── */
  const { data: llmAnalysis, refetch: llmRefetch } = useAnalysis<LlmTrackData>(appId, 'llm-track')
  const { generate: llmGenerate, generating: llmGenerating } = useGenerate(appId, 'llm-track', { onSuccess: llmRefetch })

  const [prompt, setPrompt] = useState('')
  const [filter, setFilter] = useState<'all' | 'winning' | 'losing'>('all')

  const rawResults = llmAnalysis
  const results = Array.isArray(rawResults) ? rawResults : (rawResults?.results ?? []) as LlmTrackItem[]
  const citations = Array.isArray(rawResults) ? [] : ((rawResults as Exclude<LlmTrackData, LlmTrackItem[]>)?.citations ?? [])
  const promptMatrix = Array.isArray(rawResults) ? [] : ((rawResults as Exclude<LlmTrackData, LlmTrackItem[]>)?.promptMatrix ?? [])
  const optimizationTips = Array.isArray(rawResults) ? [] : ((rawResults as Exclude<LlmTrackData, LlmTrackItem[]>)?.optimizationTips ?? [])
  const hasResults = results.length > 0

  const filtered = useMemo(() => {
    if (filter === 'winning') return results.filter(r => r.mentioned)
    if (filter === 'losing') return results.filter(r => !r.mentioned)
    return results
  }, [results, filter])

  const llmAccessors = useMemo(() => ({
    surface: (r: LlmTrackItem) => r.surface,
    mentioned: (r: LlmTrackItem) => r.mentioned ? 1 : 0,
    position: (r: LlmTrackItem) => posRank(r.position),
  }), [])
  const { sorted: sortedResults, sortKey: llmSK, sortDir: llmSD, toggle: llmT } = useTableSort(filtered, llmAccessors)

  // Computed KPIs
  const mentionedCount = results.filter(r => r.mentioned).length
  const totalEngines = results.length
  const shareOfVoice = totalEngines > 0 ? Math.round((mentionedCount / totalEngines) * 100) : null
  const bestEngine = hasResults
    ? [...results].filter(r => r.mentioned).sort((a, b) => posRank(b.position) - posRank(a.position))[0]
    : null

  const handleRunPoll = () => {
    llmGenerate(prompt ? { prompt } : undefined)
  }

  /* ── Discovery Map ── */
  const { data: discAnalysis, refetch: discRefetch } = useAnalysis<DiscoveryMapData>(appId, 'discovery-map')
  const { generate: discGenerate, generating: discGenerating } = useGenerate(appId, 'discovery-map', { onSuccess: discRefetch })

  /* ── Sync All (LLM poll + discovery map) ── */
  const [syncingAll, setSyncingAll] = useState(false)
  const { startGeneration, endGeneration } = useGenerateContext()
  const syncRef = useRef(false)

  const syncAll = useCallback(async () => {
    if (!slug || syncRef.current) return
    syncRef.current = true
    setSyncingAll(true)
    startGeneration('llm-track')
    const fire = (action: string, body?: Record<string, unknown>) =>
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, appId: slug, ...body }),
      }).then(r => { if (!r.ok) throw new Error(`${action} failed`); return r.json().catch(() => null) })
    try {
      await Promise.all([
        fire('llm-track', prompt ? { userPrompt: prompt } : undefined),
        fire('discovery-map'),
      ])
      endGeneration()
      await new Promise(r => setTimeout(r, 500))
      llmRefetch(); discRefetch()
    } catch (err) {
      endGeneration(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncingAll(false)
      syncRef.current = false
    }
  }, [slug, prompt, startGeneration, endGeneration, llmRefetch, discRefetch])

  const filteredSurfaces = discAnalysis?.surfaces?.filter(s => {
    if (s.type !== 'store' || !appPlatform) return true
    if (appPlatform === 'ios') return !s.name.toLowerCase().includes('play')
    if (appPlatform === 'android') return !s.name.toLowerCase().includes('app store')
    return true
  })

  /* ── Section numbering ── */
  let sectionNum = 0

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'LLM Discovery', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" disabled={syncingAll || llmGenerating || discGenerating} onClick={() => syncAll()}>
            {syncingAll ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Where AI <em>finds you</em>.</>}
        subtitle="Track how LLMs recommend your app and map every discovery surface — from AI answers to store search, web, social and beyond."
        meta={
          hasResults ? (
            <>
              ENGINES <strong>{totalEngines}</strong><br />
              CITED IN <strong>{mentionedCount}/{totalEngines}</strong><br />
              BEST POSITION <strong>{bestEngine?.position ?? '—'}</strong>
            </>
          ) : (
            <>
              ENGINES <strong>5</strong><br />
              PROMPTS <strong>—</strong><br />
              CITATIONS <strong>—</strong>
            </>
          )
        }
      />

      <div className="content">
        {/* ═══════════════════════════════════════════════
            LLM TRACKER SECTIONS
            ═══════════════════════════════════════════════ */}

        {/* Prompt input */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Enter a prompt to test (e.g. &quot;best streaming app for movies&quot;)..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !llmGenerating) handleRunPoll() }}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid var(--color-line)',
                borderRadius: 6,
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                background: 'var(--color-paper)',
                outline: 'none',
              }}
            />
            <button className="btn accent" disabled={llmGenerating} onClick={handleRunPoll}>
              {llmGenerating ? 'Polling...' : 'Test prompt'}
            </button>
          </div>
        </div>

        {hasResults && (
          <div className="kpi-strip">
            <div className="kpi hl">
              <div className="label">Share of voice</div>
              <div className="value">{shareOfVoice}%</div>
            </div>
            <div className="kpi">
              <div className="label">Cited in</div>
              <div className="value">{mentionedCount}/{totalEngines}</div>
            </div>
            <div className="kpi">
              <div className="label">Citation sources</div>
              <div className="value">{mentionedCount}</div>
            </div>
            <div className="kpi">
              <div className="label">Best engine</div>
              <div className="value sm">{bestEngine?.surface ?? '—'}</div>
            </div>
            <div className="kpi">
              <div className="label">Best position</div>
              <div className="value sm">{bestEngine?.position ?? '—'}</div>
            </div>
          </div>
        )}

        {/* § Recommendation rate by engine */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>Recommendation rate <em>by engine</em></h2></div>
            {hasResults && <div className="section-sub">Prompt: &quot;{prompt || 'best app in this category'}&quot;</div>}
          </div>
          {hasResults ? (
            <div className="card"><div className="card-body">
              {results.map((r) => {
                const posMap: Record<string, number> = { '1st': 100, '2nd': 75, '3rd': 50, 'not listed': 0 }
                const pct = r.mentioned ? (posMap[r.position] ?? 25) : 0
                return (
                  <div className="row-bar" key={r.surface}>
                    <div className="rb-label">{r.surface}</div>
                    <div className="bar"><div className={`fill${r.mentioned ? ' accent' : ' warn'}`} style={{ width: `${pct}%` }} /></div>
                    <div className="rb-val">{r.mentioned ? r.position : 'N/A'}</div>
                  </div>
                )
              })}
            </div></div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No data yet. Enter a prompt above and run a poll to see how AI engines rank your app.</p>
              <button className="btn accent" onClick={handleRunPoll} disabled={llmGenerating}>{llmGenerating ? 'Polling...' : 'Run poll now'}</button>
            </div></div>
          )}
        </section>

        {/* § Top citation sources (conditional) */}
        {citations.length > 0 && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>Top citation <em>sources</em></h2></div>
            </div>
            <div className="card">
              <div className="card-body tight">
                {citations.map((c, i) => (
                  <div className="citation" key={i}>
                    <div className="cit-src">{c.source}</div>
                    <div className="cit-quote">{c.quote}</div>
                    <div className="cit-meta">{c.meta}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* § Prompt universe */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>Prompt <em>universe</em></h2></div>
            {hasResults && (
              <div className="chip-row">
                <span className={`chip${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>All</span>
                <span className={`chip${filter === 'winning' ? ' on' : ''}`} onClick={() => setFilter(filter === 'winning' ? 'all' : 'winning')}>Winning</span>
                <span className={`chip${filter === 'losing' ? ' on' : ''}`} onClick={() => setFilter(filter === 'losing' ? 'all' : 'losing')}>Losing</span>
              </div>
            )}
          </div>
          {hasResults ? (
            promptMatrix.length > 0 ? (
              <div className="card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Prompt</th>
                      {results.map(r => <th key={r.surface} className="tn">{r.surface.split(' ')[0]?.substring(0, 3).toUpperCase() ?? r.surface}</th>)}
                      <th>Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promptMatrix.map((row, i) => (
                      <tr key={i}>
                        <td><strong>{row.prompt}</strong></td>
                        {results.map(r => {
                          const pct = row.engines[r.surface] ?? 0
                          const pillClass = pct >= 50 ? 'ok' : pct >= 20 ? 'test' : 'warn'
                          return <td key={r.surface} className="tn"><span className={`pill ${pillClass}`}>{pct}%</span></td>
                        })}
                        <td><strong>{row.winner}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortHeader label="Engine" sortKey="surface" activeSortKey={llmSK} sortDir={llmSD} onSort={llmT} />
                      <SortHeader label="Mentioned" sortKey="mentioned" activeSortKey={llmSK} sortDir={llmSD} onSort={llmT} />
                      <SortHeader label="Position" sortKey="position" activeSortKey={llmSK} sortDir={llmSD} onSort={llmT} />
                      <th>Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((r) => (
                      <tr key={r.surface}>
                        <td><strong>{r.surface}</strong></td>
                        <td><span className={`pill ${r.mentioned ? 'ok' : 'warn'}`}>{r.mentioned ? 'YES' : 'NO'}</span></td>
                        <td className="tn num-big">{r.position}</td>
                        <td style={{ fontSize: 12 }}>{r.response}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No data yet</p>
              <button className="btn accent" onClick={handleRunPoll} disabled={llmGenerating}>{llmGenerating ? 'Polling...' : 'Run poll now'}</button>
            </div></div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════
            DISCOVERY MAP SECTIONS
            ═══════════════════════════════════════════════ */}

        {/* § Discovery flow map */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>Discovery <em>flow map</em></h2></div>
          </div>
          {filteredSurfaces?.length ? (
            <div className="card">
              <div className="card-body" style={{ padding: '32px 24px' }}>
                <DiscoveryFlowMap surfaces={filteredSurfaces} platform={appPlatform} />
              </div>
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>No data yet</p>
              <button className="btn accent" onClick={() => discGenerate()} disabled={discGenerating}>{discGenerating ? 'Generating...' : 'Generate'}</button>
            </div></div>
          )}
        </section>

        {/* § Surface details */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>Surface <em>details</em></h2></div>
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
                <button className="btn accent" onClick={() => discGenerate()} disabled={discGenerating}>{discGenerating ? 'Generating...' : 'Generate'}</button>
              </div></div>
            )}
          </div>
        </section>

        {/* § Discovery gaps */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>Discovery <em>gaps</em></h2></div>
          </div>
          <div className="grid-3">
            {discAnalysis?.gaps ? discAnalysis.gaps.map((gap, i) => (
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
                <button className="btn accent" onClick={() => discGenerate()} disabled={discGenerating}>{discGenerating ? 'Generating...' : 'Generate'}</button>
              </div></div>
            )}
          </div>
        </section>

        {/* § How to improve LLM visibility */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ {String(++sectionNum).padStart(2, '0')}</span><h2>How to <em>improve</em></h2></div>
          </div>
          {optimizationTips.length > 0 ? (
            <div className="grid-2">
              {optimizationTips.map((tip, i) => (
                <div className="card" key={i}>
                  <div className="card-head">
                    <h3>{tip.title}</h3>
                    <span className={`pill ${tip.priority === 'high' ? 'warn' : tip.priority === 'medium' ? 'live' : 'ok'}`}>
                      {tip.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="card-body">
                    <p style={{ fontSize: 13, color: 'var(--color-ink-2)', lineHeight: '1.5' }}>{tip.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 16 }}>Run a sync to get personalized LLM optimization tips for your app.</p>
              <button className="btn accent" onClick={() => syncAll()} disabled={syncingAll || llmGenerating}>{syncingAll ? 'Syncing...' : 'Sync All'}</button>
            </div></div>
          )}
        </section>
      </div>
    </>
  )
}
