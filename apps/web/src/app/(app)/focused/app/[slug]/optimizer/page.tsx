'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { OptimizeTitleData, OptimizeSubtitleData, OptimizeDescriptionData, OptimizeKeywordsFieldData, KeywordsData, LlmTrackData, LlmTrackItem, LlmOptimizationTip, CompetitorsData, VisibilityData, ReviewsAnalysisData } from '@/lib/analysis-types'
import { asArray } from '@/lib/analysis-types'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'

interface Snapshot {
  title?: string
  subtitle?: string
  short_description?: string
  description?: string
  keywords_field?: string
}

const GOALS = [
  { id: 'balanced', label: 'Balanced', icon: '\u2630', description: 'Equal weight across all factors' },
  { id: 'visibility', label: 'Visibility & Rankings', icon: '\u25C9', description: 'Maximize search positions and impressions' },
  { id: 'keyword-opportunities', label: 'Keyword Opportunities', icon: '\u2197', description: 'Target untapped high-volume keywords' },
  { id: 'conversion', label: 'Conversion & Downloads', icon: '\u2193', description: 'Optimize copy to convert views into installs' },
  { id: 'competitive-edge', label: 'Competitive Edge', icon: '\u2726', description: 'Differentiate from competitor listings' },
]

const GOAL_TIPS: Record<string, string[]> = {
  'balanced': [
    'Mix high-volume keywords with natural language',
    'First 3 lines should both rank and convert',
    'Include your top 3 keywords in title + subtitle',
  ],
  'visibility': [
    'Use exact-match keyword phrases in title',
    'Avoid filler words — every character counts',
    'Target compound keyword combinations',
  ],
  'keyword-opportunities': [
    'Check the Keywords page for untapped terms',
    'Focus on medium-volume, low-competition keywords',
    'Include trending terms in your category',
  ],
  'conversion': [
    'Lead with your #1 user benefit, not features',
    'Include numbers and social proof',
    'End description with a clear call to action',
  ],
  'competitive-edge': [
    'Name your unique features explicitly',
    'Use "only app that..." or "first to..." patterns',
    'Target keywords where competitors are weak',
  ],
}

export default function OptimizerPage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const isIOS = appData?.platform === 'ios'

  // Fetch current metadata snapshot
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  useEffect(() => {
    if (!slug) return
    fetch(`/api/app-data?appId=${encodeURIComponent(slug)}&include=snapshot`)
      .then(r => r.json())
      .then(d => setSnapshot(d.snapshot ?? null))
      .catch(err => console.error('[optimizer] Failed to fetch snapshot:', err))
  }, [slug])

  // Analysis data
  const { data: titleData, refetch: refetchTitle } = useAnalysis<OptimizeTitleData>(slug, 'optimize-title')
  const { data: subtitleData, refetch: refetchSubtitle } = useAnalysis<OptimizeSubtitleData>(slug, 'optimize-subtitle')
  const { data: descData, refetch: refetchDesc } = useAnalysis<OptimizeDescriptionData>(slug, 'optimize-description')
  const { data: kwFieldData, refetch: refetchKw } = useAnalysis<OptimizeKeywordsFieldData>(slug, 'optimize-keywords-field')
  const { data: keywordsData } = useAnalysis<KeywordsData>(slug, 'keywords')
  const { data: llmTrackData, refetch: refetchLlm } = useAnalysis<LlmTrackData>(slug, 'llm-track')
  const { data: competitorsData } = useAnalysis<CompetitorsData>(slug, 'competitors')
  const { data: visibilityData } = useAnalysis<VisibilityData>(slug, 'visibility')
  const { data: reviewsData } = useAnalysis<ReviewsAnalysisData>(slug, 'reviews-analysis')
  const { generate: genLlm, generating: g5 } = useGenerate(slug, 'llm-track', { onSuccess: refetchLlm })

  const { generate: genTitle, generating: g1 } = useGenerate(slug, 'optimize-title', { onSuccess: refetchTitle })
  const { generate: genSubtitle, generating: g2 } = useGenerate(slug, 'optimize-subtitle', { onSuccess: refetchSubtitle })
  const { generate: genDesc, generating: g3 } = useGenerate(slug, 'optimize-description', { onSuccess: refetchDesc })
  const { generate: genKw, generating: g4 } = useGenerate(slug, 'optimize-keywords-field', { onSuccess: refetchKw })

  const isGenerating = g1 || g2 || g3 || g4

  // Optimization goal — persisted to DB
  const [selectedGoal, setSelectedGoal] = useState('balanced')
  useEffect(() => {
    if (appData?.optimization_goal) setSelectedGoal(appData.optimization_goal)
  }, [appData])

  const handleGoalChange = useCallback((goal: string) => {
    setSelectedGoal(goal)
    if (slug) {
      fetch(`/api/apps/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimization_goal: goal }),
      }).catch(err => console.error('[optimizer] Failed to save goal:', err))
    }
  }, [slug])

  // Selected variant indices
  const [selTitle, setSelTitle] = useState(0)
  const [selSubtitle, setSelSubtitle] = useState(0)

  // Reset selection when new data arrives
  useEffect(() => { setSelTitle(0) }, [titleData])
  useEffect(() => { setSelSubtitle(0) }, [subtitleData])

  // Platform-specific limits
  const limits = useMemo(() => ({
    title: 30,
    subtitle: isIOS ? 30 : 80,
    keywords: 100,
    promo: 170,
    description: 4000,
  }), [isIOS])

  // Current field values
  const titles = titleData?.titles ?? []
  const subtitles = subtitleData?.subtitles ?? []
  const curTitle = titles[selTitle]?.title ?? ''
  const curSubtitle = subtitles[selSubtitle]?.subtitle ?? ''
  const curKeywords = kwFieldData?.keywordField ?? ''
  const curPromo = descData?.shortDescription ?? ''
  const curDesc = descData?.fullDescription ?? ''

  // Tracked keywords for scoring
  const trackedKws = useMemo(() => asArray(keywordsData), [keywordsData])

  // LLM results normalization
  const llmResults: LlmTrackItem[] = useMemo(() => {
    if (!llmTrackData) return []
    if (Array.isArray(llmTrackData)) return llmTrackData
    return llmTrackData.results ?? []
  }, [llmTrackData])

  const llmTips: LlmOptimizationTip[] = useMemo(() => {
    if (!llmTrackData || Array.isArray(llmTrackData)) return []
    return llmTrackData.optimizationTips ?? []
  }, [llmTrackData])

  // Score a single field
  const scoreField = useCallback((value: string, limit: number): number => {
    if (!value) return 0
    let s = 25 // has content
    s += value.length <= limit ? 25 : 0 // within limit
    const utilization = Math.min(1, value.length / (limit * 0.6))
    s += Math.round(utilization * 25) // utilization
    if (trackedKws.length > 0) {
      const lower = value.toLowerCase()
      const matches = trackedKws.filter(k => lower.includes(k.keyword.toLowerCase())).length
      s += Math.round(Math.min(25, (matches / Math.max(1, trackedKws.length)) * 100))
    } else {
      s += 15
    }
    return Math.min(100, s)
  }, [trackedKws])

  // Per-field scores
  const fieldScores = useMemo(() => {
    const scores: { label: string; score: number; weight: number }[] = [
      { label: 'Title', score: scoreField(curTitle, limits.title), weight: 30 },
      { label: isIOS ? 'Subtitle' : 'Short description', score: scoreField(curSubtitle, limits.subtitle), weight: 20 },
    ]
    if (isIOS) {
      scores.push(
        { label: 'Keywords field', score: scoreField(curKeywords, limits.keywords), weight: 20 },
        { label: 'Promo text', score: scoreField(curPromo, limits.promo), weight: 10 },
        { label: 'Description', score: scoreField(curDesc, limits.description), weight: 20 },
      )
    } else {
      scores.push(
        { label: 'Description', score: scoreField(curDesc, limits.description), weight: 50 },
      )
    }
    return scores
  }, [curTitle, curSubtitle, curKeywords, curPromo, curDesc, limits, isIOS, scoreField])

  // Only score generated fields — don't penalize fields not yet generated
  const asoScore = useMemo(() => {
    const generated = fieldScores.filter(f => f.score > 0)
    if (generated.length === 0) return 0
    const totalWeight = generated.reduce((s, f) => s + f.weight, 0)
    return Math.round(generated.reduce((s, f) => s + f.score * f.weight, 0) / totalWeight)
  }, [fieldScores])

  const fieldsComplete = [curTitle, curSubtitle, isIOS ? curKeywords : null, isIOS ? curPromo : null, curDesc].filter(Boolean).length
  const totalFields = isIOS ? 5 : 3

  // AI-recommended goal based on app's weak spots
  const recommendedGoal = useMemo(() => {
    const hasData = visibilityData || competitorsData || reviewsData || trackedKws.length > 0
    if (!hasData) return null

    // Score each goal area — higher score = weaker area = should prioritize
    const scores = { visibility: 0, 'keyword-opportunities': 0, 'competitive-edge': 0, conversion: 0, balanced: 0 }

    // Low visibility score → suggest visibility
    const visScore = (visibilityData && !Array.isArray(visibilityData)) ? visibilityData.overallScore : null
    if (visScore != null && visScore < 40) scores.visibility += 3
    else if (visScore != null && visScore < 60) scores.visibility += 1

    // Many unranked or low-rank keywords → suggest keyword opportunities
    if (trackedKws.length > 0) {
      const unranked = trackedKws.filter(k => !k.rank || k.rank > 50).length
      const ratio = unranked / trackedKws.length
      if (ratio > 0.6) scores['keyword-opportunities'] += 3
      else if (ratio > 0.3) scores['keyword-opportunities'] += 1
    }

    // Keyword gaps vs competitors → suggest competitive edge
    const compList = Array.isArray(competitorsData) ? competitorsData : competitorsData?.competitors ?? []
    if (compList.length > 0) {
      const totalGaps = compList.reduce((sum, c) => sum + (c.keywordGaps?.length ?? 0), 0)
      const highThreats = compList.filter(c => c.threatLevel === 'high').length
      if (totalGaps > 10 || highThreats >= 2) scores['competitive-edge'] += 3
      else if (totalGaps > 5 || highThreats >= 1) scores['competitive-edge'] += 1
    }

    // Low reviews / low rating → suggest conversion
    if (reviewsData) {
      const rating = reviewsData.averageRating
      const reviewCount = reviewsData.realReviewCount
      if ((rating != null && rating < 3.5) || (reviewCount != null && reviewCount < 50)) scores.conversion += 3
      else if ((rating != null && rating < 4.0) || (reviewCount != null && reviewCount < 200)) scores.conversion += 1
    }

    // Find highest-scoring goal
    let best = 'balanced'
    let bestScore = 0
    for (const [goal, score] of Object.entries(scores)) {
      if (score > bestScore) { bestScore = score; best = goal }
    }

    return bestScore > 0 ? best : 'balanced'
  }, [visibilityData, competitorsData, reviewsData, trackedKws])

  // Ring SVG
  const circumference = 2 * Math.PI * 60
  const dashOffset = circumference * (1 - asoScore / 100)

  // Char color helper
  const charColor = (len: number, limit: number) => {
    if (len === 0) return 'var(--color-ink-3)'
    if (len > limit) return '#ef4444'
    if (len > limit * 0.9) return '#d97706'
    return '#22c55e'
  }

  // Sequential generation to avoid DeepSeek rate limits dropping requests
  async function handleFullRewrite() {
    const params = { goal: selectedGoal }
    await genTitle(params)
    await genSubtitle(params)
    await genDesc(params)
    if (isIOS) {
      await genKw(params)
    }
  }

  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Optimizer', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 400, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '—' },
          { label: 'Optimizer', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          <button className="btn accent" onClick={handleFullRewrite} disabled={isGenerating}>
            {isGenerating ? 'Optimizing...' : 'Optimize all fields'}
          </button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Metadata, <em>scored</em> live.</>}
        subtitle="AI-powered ASO metadata editor with live scoring, keyword analysis, and one-click optimized listing generation."
        meta={
          <>
            ASO SCORE · <strong>{asoScore > 0 ? asoScore : '—'}</strong><br />
            FIELDS COMPLETE · <strong>{fieldsComplete} / {totalFields}</strong><br />
            PLATFORM · <strong>{isIOS ? 'iOS' : 'Android'}</strong>
          </>
        }
      />

      <div className="content">
        {/* Optimization Goal selector */}
        <section>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Optimization Goal
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-ink-3)', marginBottom: 14 }}>
            Choose what to prioritize — AI will tailor all generated content to this goal.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 24 }}>
            {GOALS.map(g => {
              const isSelected = selectedGoal === g.id
              const isRecommended = recommendedGoal === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => handleGoalChange(g.id)}
                  style={{
                    padding: '16px 10px',
                    background: isSelected ? 'var(--color-ink)' : 'var(--color-card, var(--color-paper-2))',
                    color: isSelected ? 'var(--color-paper)' : 'var(--color-ink)',
                    border: isSelected
                      ? '2px solid var(--color-ink)'
                      : isRecommended
                        ? '2px solid #22c55e'
                        : '1px solid var(--color-line)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                    fontSize: 12,
                    fontWeight: 600,
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{g.icon}</div>
                  <div>{g.label}</div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 400,
                    marginTop: 4,
                    color: isSelected ? 'var(--color-ink-4)' : 'var(--color-ink-3)',
                    lineHeight: '1.3',
                  }}>
                    {g.description}
                  </div>
                  {isRecommended && (
                    <div style={{
                      marginTop: 8,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: isSelected ? '#4ade80' : '#22c55e',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      ★ Recommended
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* AI Store Listing Optimizer CTA */}
        <section>
          <div className="card" style={{ borderLeft: '3px solid var(--color-accent)' }}>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--color-ink-3)', marginBottom: 6, textTransform: 'uppercase' }}>
                  AI Store Listing Optimizer
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-ink-2)' }}>
                  AI analyzes your keywords, competitors, reviews, and locale data to maximize organic visibility and downloads.
                </div>
              </div>
              <button
                className="btn accent"
                onClick={handleFullRewrite}
                disabled={isGenerating}
                style={{ whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 20 }}
              >
                {isGenerating ? 'Generating...' : 'Generate Optimized Listing'}
              </button>
            </div>
          </div>
        </section>

        <div className="grid-2-1">
          {/* Left: metadata fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Title */}
            <FieldCard
              label="Title"
              value={curTitle}
              limit={limits.title}
              charColor={charColor}
              snapshot={snapshot?.title}
              reasoning={titles[selTitle]?.reasoning}
              generating={g1}
              onGenerate={() => genTitle({ goal: selectedGoal })}
              variants={titles.map(t => t.title)}
              selectedVariant={selTitle}
              onSelectVariant={setSelTitle}
            />

            {/* Subtitle / Short description */}
            <FieldCard
              label={isIOS ? 'Subtitle' : 'Short description'}
              value={curSubtitle}
              limit={limits.subtitle}
              charColor={charColor}
              snapshot={isIOS ? snapshot?.subtitle : snapshot?.short_description}
              reasoning={subtitles[selSubtitle]?.reasoning}
              generating={g2}
              onGenerate={() => genSubtitle({ goal: selectedGoal })}
              variants={subtitles.map(s => s.subtitle)}
              selectedVariant={selSubtitle}
              onSelectVariant={setSelSubtitle}
            />

            {/* Keywords (iOS only) */}
            {isIOS && (
              <FieldCard
                label="Keywords field"
                value={curKeywords}
                limit={limits.keywords}
                charColor={charColor}
                snapshot={snapshot?.keywords_field}
                reasoning={kwFieldData?.reasoning}
                generating={g4}
                onGenerate={() => genKw({ goal: selectedGoal })}
                mono
              />
            )}

            {/* Promotional text (iOS only) */}
            {isIOS && (
              <FieldCard
                label="Promotional text"
                value={curPromo}
                limit={limits.promo}
                charColor={charColor}
                generating={g3}
                onGenerate={() => genDesc({ goal: selectedGoal })}
              />
            )}

            {/* Description */}
            <FieldCard
              label="Description"
              value={curDesc}
              limit={limits.description}
              charColor={charColor}
              snapshot={snapshot?.description}
              generating={g3}
              onGenerate={() => genDesc({ goal: selectedGoal })}
              multiline
            />

            {/* Keywords used */}
            {descData?.keywordsUsed && descData.keywordsUsed.length > 0 && (
              <div className="card">
                <div className="card-head"><h3>Keywords woven into description</h3></div>
                <div className="card-body">
                  <div className="topic-chips">
                    {descData.keywordsUsed.map((kw, i) => (
                      <div key={i} className="topic-chip on">{kw}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: score sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ASO Score ring */}
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div className="score-ring" style={{ margin: '0 auto 16px' }}>
                  <svg viewBox="0 0 140 140">
                    <circle className="ring-bg" cx={70} cy={70} r={60} />
                    {asoScore > 0 && (
                      <circle
                        className="ring-fg"
                        cx={70} cy={70} r={60}
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                    )}
                  </svg>
                  <div className="score-val">
                    <span className="sv-num">{asoScore > 0 ? asoScore : '—'}</span>
                    <span className="sv-label">ASO score</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>
                  {asoScore === 0
                    ? 'Run AI full rewrite to generate all fields.'
                    : fieldsComplete < totalFields
                    ? `${asoScore} across ${fieldsComplete} field${fieldsComplete > 1 ? 's' : ''}. Generate remaining fields.`
                    : asoScore >= 80
                    ? 'Strong metadata. Fine-tune individual fields.'
                    : asoScore >= 50
                    ? 'Good start. Regenerate fields to improve.'
                    : 'Needs work. Regenerate fields for a stronger listing.'}
                </div>
              </div>
            </div>

            {/* LLM Discovery */}
            <LlmReadinessCard results={llmResults} tips={llmTips} onSync={() => genLlm()} syncing={g5} />

            {/* Score breakdown */}
            <div className="card">
              <div className="card-head"><h3>Score breakdown</h3></div>
              <div className="card-body">
                {fieldScores.map((f, i) => (
                  <div key={f.label} style={{ marginBottom: i < fieldScores.length - 1 ? 12 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span>{f.label}</span>
                      <strong style={{ color: f.score >= 75 ? '#22c55e' : f.score >= 50 ? '#d97706' : f.score > 0 ? '#ef4444' : 'var(--color-ink-3)' }}>
                        {f.score > 0 ? f.score : '—'}
                      </strong>
                    </div>
                    <div className="bar">
                      <div
                        className="fill"
                        style={{
                          width: `${f.score}%`,
                          background: f.score >= 75 ? '#22c55e' : f.score >= 50 ? '#d97706' : '#ef4444',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Goal tips */}
            <div className="card">
              <div className="card-head"><h3>Goal tips</h3></div>
              <div className="card-body">
                {(GOAL_TIPS[selectedGoal] ?? GOAL_TIPS['balanced'])!.map((tip, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, fontSize: 12, color: 'var(--color-ink-2)',
                    marginBottom: i < 2 ? 8 : 0,
                  }}>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform limits reference */}
            <div className="card">
              <div className="card-head"><h3>{isIOS ? 'iOS App Store' : 'Google Play'} limits</h3></div>
              <div className="card-body" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Title</span><span>{limits.title} chars</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{isIOS ? 'Subtitle' : 'Short desc'}</span><span>{limits.subtitle} chars</span>
                </div>
                {isIOS && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Keywords</span><span>{limits.keywords} chars</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Promo text</span><span>{limits.promo} chars</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Description</span><span>{limits.description.toLocaleString()} chars</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── LLM Readiness sidebar card ── */

function LlmReadinessCard({ results, tips, onSync, syncing }: { results: LlmTrackItem[]; tips: LlmOptimizationTip[]; onSync: () => void; syncing: boolean }) {
  if (results.length === 0) {
    return (
      <div className="card">
        <div className="card-head"><h3>LLM discovery</h3></div>
        <div className="card-body" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginBottom: 12 }}>
            No LLM tracking data yet. Run a poll to see how AI assistants discover this app.
          </p>
          <button className="btn accent" onClick={onSync} disabled={syncing} style={{ fontSize: 12, padding: '6px 14px' }}>
            {syncing ? 'Polling...' : 'Run LLM poll'}
          </button>
        </div>
      </div>
    )
  }

  const mentionedCount = results.filter(r => r.mentioned).length
  const totalEngines = results.length
  const pct = Math.round((mentionedCount / totalEngines) * 100)
  const highTips = tips.filter(t => t.priority === 'high').slice(0, 3)

  return (
    <div className="card">
      <div className="card-head">
        <h3>LLM discovery</h3>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: pct >= 60 ? 'var(--color-ok)' : pct >= 20 ? 'var(--color-gold)' : 'var(--color-warn)' }}>
          {pct}%
        </span>
      </div>
      <div className="card-body">
        {results.map((r, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '5px 0', fontSize: 12,
            borderBottom: i < results.length - 1 ? '1px solid var(--color-line)' : 'none',
          }}>
            <span>{r.surface}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: r.mentioned ? 'var(--color-ok)' : 'var(--color-warn)',
              fontWeight: 600,
            }}>
              {r.mentioned ? r.position.toUpperCase() : 'NOT LISTED'}
            </span>
          </div>
        ))}

        {/* Optimization tips from LLM poll */}
        {highTips.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-line)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.1em', marginBottom: 6 }}>TOP ACTIONS</div>
            {highTips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--color-ink-2)', marginBottom: i < highTips.length - 1 ? 6 : 0 }}>
                <span style={{ color: 'var(--color-accent)', fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                <span>{tip.title}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>
            {mentionedCount < 3 ? 'Low LLM visibility.' : 'Good LLM presence.'}
          </span>
          <button className="chip" onClick={onSync} disabled={syncing} style={{ fontSize: 10 }}>
            {syncing ? '...' : 'Re-poll'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── FieldCard sub-component ── */

function FieldCard({
  label,
  value,
  limit,
  charColor,
  snapshot,
  reasoning,
  generating,
  onGenerate,
  variants,
  selectedVariant,
  onSelectVariant,
  mono,
  multiline,
}: {
  label: string
  value: string
  limit: number
  charColor: (len: number, limit: number) => string
  snapshot?: string | undefined
  reasoning?: string | undefined
  generating: boolean
  onGenerate: () => void
  variants?: string[] | undefined
  selectedVariant?: number | undefined
  onSelectVariant?: ((i: number) => void) | undefined
  mono?: boolean | undefined
  multiline?: boolean | undefined
}) {
  const len = value.length
  const overLimit = len > limit
  const [copied, setCopied] = useState(false)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = useCallback(() => {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopied(false), 1500)
    })
  }, [value])

  return (
    <div className="card">
      <div className="card-body">
        {/* Header: label + copy + char count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {label}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleCopy}
              disabled={!value}
              style={{
                background: 'none',
                border: '1px solid var(--color-line)',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                cursor: value ? 'pointer' : 'default',
                color: copied ? '#22c55e' : 'var(--color-ink-3)',
                opacity: value ? 1 : 0.4,
                transition: 'color 0.2s',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: charColor(len, limit), fontWeight: overLimit ? 700 : 400 }}>
              {len > 0 ? `${len} / ${limit.toLocaleString()}` : `— / ${limit.toLocaleString()}`}
              {overLimit && <span style={{ color: '#ef4444' }}> OVER by {len - limit}</span>}
            </span>
          </div>
        </div>

        {/* Field value or empty state */}
        {value ? (
          <>
            <div style={{
              padding: '12px 14px',
              background: overLimit ? '#ef444410' : 'var(--color-paper-2)',
              border: overLimit ? '1px solid #ef444433' : 'none',
              borderRadius: 4,
              fontSize: multiline ? 13 : 15,
              fontWeight: multiline ? 400 : 600,
              fontFamily: mono ? 'var(--font-mono)' : undefined,
              color: multiline ? 'var(--color-ink-2)' : undefined,
              wordBreak: mono ? 'break-all' : undefined,
              ...(multiline ? { maxHeight: 140, overflow: 'hidden', position: 'relative' as const } : {}),
            }}>
              {value}
              {multiline && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(180deg, transparent, var(--color-paper-2))' }} />
              )}
            </div>

            {/* Variant picker */}
            {variants && variants.length > 1 && onSelectVariant && (
              <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.08em', marginRight: 2 }}>VARIANTS:</span>
                {variants.map((v, i) => (
                  <button
                    key={i}
                    className={`chip${i === selectedVariant ? ' on' : ''}`}
                    onClick={() => onSelectVariant(i)}
                    title={v}
                    style={{ fontSize: 11, minWidth: 28, textAlign: 'center' }}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="chip"
                  onClick={onGenerate}
                  disabled={generating}
                  style={{ fontSize: 11, marginLeft: 4 }}
                >
                  {generating ? '...' : 'New set'}
                </button>
              </div>
            )}

            {/* Single field regenerate */}
            {(!variants || variants.length <= 1) && (
              <div style={{ marginTop: 8 }}>
                <button className="chip" onClick={onGenerate} disabled={generating} style={{ fontSize: 11 }}>
                  {generating ? 'Generating...' : 'Regenerate'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{
            padding: '12px 14px',
            background: 'var(--color-paper-2)',
            borderRadius: 4,
            fontSize: 14,
            color: 'var(--color-ink-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>—</span>
            <button className="btn accent" onClick={onGenerate} disabled={generating} style={{ fontSize: 12, padding: '4px 12px' }}>
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        )}

        {/* Current store value */}
        {snapshot && snapshot !== value && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--color-line)', borderRadius: 4, fontSize: 11 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.08em' }}>CURRENT IN STORE: </span>
            <span style={{ color: 'var(--color-ink-2)' }}>{snapshot.length > 120 ? snapshot.slice(0, 120) + '...' : snapshot}</span>
          </div>
        )}

        {/* Reasoning */}
        {reasoning && (
          <div className="callout ok" style={{ marginTop: 8 }}>
            <div className="callout-label">AI reasoning</div>
            <p style={{ fontSize: 12 }}>{reasoning}</p>
          </div>
        )}
      </div>
    </div>
  )
}
