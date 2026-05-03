'use client'

import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { AgentReadyData } from '@/lib/analysis-types'

const statePill = (s: string) => {
  if (s === 'pass') return 'ok'
  if (s === 'partial' || s === 'draft') return 'test'
  return 'draft'
}
const stateLabel = (s: string) => {
  if (s === 'pass') return 'READY'
  if (s === 'partial') return 'PARTIAL'
  if (s === 'draft') return 'DRAFT'
  return 'MISSING'
}

export default function AgentReadyPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData } = useApp(slug)
  const appId = slug
  const appName = appData?.name ?? ''
  const { data: analysis, refetch } = useAnalysis<AgentReadyData>(appId, 'agent-ready')
  const { generate, generating } = useGenerate(appId, 'agent-ready', { onSuccess: refetch })

  const score = analysis?.overallScore ?? 0
  const checks = analysis?.checks ?? []
  const hasData = checks.length > 0
  const circumference = 2 * Math.PI * 60
  const dashOffset = circumference - (circumference * score) / 100
  const manifest = analysis?.manifest

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName ?? '—' },
          { label: 'Measure' },
          { label: 'Agent Ready', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn" disabled={generating} onClick={() => generate()}>{generating ? 'Generating...' : 'Generate manifest'}</button>
        </div>
      </TopStrip>

      <PageHero
        title={<>When ChatGPT <em>installs</em> for you.</>}
        subtitle={analysis?.summary ?? 'Agentic commerce means LLMs will soon install, onboard, and transact for users. "Being recommended" and "being installable" become two separate problems.'}
        meta={
          hasData ? (
            <>
              SCORE <strong>{score} / 100</strong><br />
              CATEGORY AVG <strong>{analysis?.categoryAvg ?? '—'}</strong><br />
              ETA TO 95+ <strong>{analysis?.etaTo95 ?? '—'}</strong>
            </>
          ) : (
            <>
              SCORE <strong>0 / 100</strong><br />
              CATEGORY AVG <strong>—</strong><br />
              ETA TO 95+ <strong>—</strong>
            </>
          )
        }
      />

      <div className="content">
        {/* § 01 Readiness checklist */}
        <section>
          <div className="section-head">
            <div className="section-head-left"><span className="section-num">§ 01</span><h2>Readiness <em>checklist</em></h2></div>
            <div className="chip-row">
              <span className="chip on">OpenAI Apps SDK</span>
              <span className="chip">Anthropic</span>
              <span className="chip">Google</span>
            </div>
          </div>

          <div className="grid-2-1">
            <div className="card"><div className="card-body tight">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>State</th>
                    <th className="tn">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {hasData ? checks.map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.check}</strong></td>
                      <td><span className={`pill ${statePill(c.status)}`}>{stateLabel(c.status)}</span></td>
                      <td className="tn num-big">{c.weight ?? 10}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-ink-3)' }}>
                      No data yet. Generate a manifest to see readiness.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Score ring */}
              <div className="card"><div className="card-body" style={{ textAlign: 'center' }}>
                <div className="score-ring" style={{ margin: '0 auto 16px' }}>
                  <svg viewBox="0 0 140 140">
                    <circle className="ring-bg" cx="70" cy="70" r="60" />
                    <circle className="ring-fg" cx="70" cy="70" r="60" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
                  </svg>
                  <div className="score-val"><span className="sv-num">{score}</span><span className="sv-label">ready score</span></div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontStyle: 'italic', color: 'var(--color-ink-2)', lineHeight: 1.45 }}>
                  {analysis?.profileDescription ?? '—'}
                </div>
              </div></div>

              {/* 30-day projection */}
              <div className="callout">
                <div className="callout-label">30-day projection</div>
                <p>{analysis?.projection ?? 'No action plan yet. Generate an analysis to see recommendations.'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* § 02 Example manifest */}
        {manifest && (
          <section>
            <div className="section-head"><div className="section-head-left"><span className="section-num">§ 02</span><h2>Example manifest</h2></div></div>
            <div className="code-block">
              <span className="c-comment"># /.well-known/ai-plugin.json — auto-generated</span>{'\n'}
              {'{'}{'\n'}
              {'  '}<span className="c-key">&quot;schema_version&quot;</span>: <span className="c-str">&quot;v2&quot;</span>,{'\n'}
              {'  '}<span className="c-key">&quot;name&quot;</span>: <span className="c-str">&quot;{manifest.name}&quot;</span>,{'\n'}
              {'  '}<span className="c-key">&quot;description&quot;</span>: <span className="c-str">&quot;{manifest.description}&quot;</span>,{'\n'}
              {'  '}<span className="c-key">&quot;install_url&quot;</span>: <span className="c-str">&quot;{manifest.installUrl}&quot;</span>,{'\n'}
              {'  '}<span className="c-key">&quot;capabilities&quot;</span>: [
              {manifest.capabilities.map((c, i) => (
                <span key={c}><span className="c-str">&quot;{c}&quot;</span>{i < manifest.capabilities.length - 1 ? ', ' : ''}</span>
              ))}],{'\n'}
              {'  '}<span className="c-key">&quot;pricing&quot;</span>: {'{ '}<span className="c-key">&quot;plans&quot;</span>: [
              {manifest.plans.map((p, i) => (
                <span key={p.id}>
                  {'{ '}<span className="c-key">&quot;id&quot;</span>: <span className="c-str">&quot;{p.id}&quot;</span>
                  {p.priceMonthly != null && <>{', '}<span className="c-key">&quot;price_monthly&quot;</span>: <span className="c-num">{p.priceMonthly}</span></>}
                  {' }'}
                  {i < manifest.plans.length - 1 ? ', ' : ''}
                </span>
              ))}] {'}'}{'\n'}
              {'}'}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
