'use client'

import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { LlmTrackData, LlmTrackItem, LlmCitation, LlmPromptRow } from '@/lib/analysis-types'
import { useTableSort } from '@/hooks/useTableSort'
import { SortHeader } from '@/components/dashboard/SortHeader'
import { useMemo, useState } from 'react'

const posRank = (p: string) => p === '1st' ? 4 : p === '2nd' ? 3 : p === '3rd' ? 2 : 1

export default function LLMTrackerPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData } = useApp(slug)
  const appId = slug
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<LlmTrackData>(appId, 'llm-track')
  const { generate, generating } = useGenerate(appId, 'llm-track', { onSuccess: refetch })

  const [prompt, setPrompt] = useState('')
  const [filter, setFilter] = useState<'all' | 'winning' | 'losing'>('all')

  const rawResults = analysis
  const results = Array.isArray(rawResults) ? rawResults : (rawResults?.results ?? []) as LlmTrackItem[]
  const citations = Array.isArray(rawResults) ? [] : ((rawResults as Exclude<LlmTrackData, LlmTrackItem[]>)?.citations ?? [])
  const promptMatrix = Array.isArray(rawResults) ? [] : ((rawResults as Exclude<LlmTrackData, LlmTrackItem[]>)?.promptMatrix ?? [])
  const hasResults = results.length > 0

  const citationSectionNum = 2
  const promptSectionNum = citations.length > 0 ? 3 : 2

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
    generate(prompt ? { prompt } : undefined)
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName ?? '—' },
          { label: 'Discovery' },
          { label: 'LLM Tracker', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" disabled={generating} onClick={handleRunPoll}>
            {generating ? 'Polling...' : 'Run poll now'}
          </button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Rank tracking for <em>AI answers</em>.</>}
        subtitle="40% of users now ask ChatGPT, Claude, Gemini, or Perplexity for app recommendations before opening the store. Your Keywords tab tracks store ranking — this tracks AI ranking."
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
        {/* Prompt input */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Enter a prompt to test (e.g. &quot;best streaming app for movies&quot;)..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !generating) handleRunPoll() }}
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
            <button className="btn accent" disabled={generating} onClick={handleRunPoll}>
              {generating ? 'Polling...' : 'Test prompt'}
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

        {/* § 01 Recommendation rate by engine */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 01</span><h2>Recommendation rate <em>by engine</em></h2></div>
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
              <button className="btn accent" onClick={handleRunPoll} disabled={generating}>{generating ? 'Polling...' : 'Run poll now'}</button>
            </div></div>
          )}
        </section>

        {/* Citations */}
        {citations.length > 0 && (
          <section>
            <div className="section-head">
              <div className="section-head-left"><span className="section-num">§ 02</span><h2>Top citation <em>sources</em></h2></div>
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
            <div className="section-head-left"><span className="section-num">§ {String(promptSectionNum).padStart(2, '0')}</span><h2>Prompt <em>universe</em></h2></div>
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
              <button className="btn accent" onClick={handleRunPoll} disabled={generating}>{generating ? 'Polling...' : 'Run poll now'}</button>
            </div></div>
          )}
        </section>
      </div>
    </>
  )
}
