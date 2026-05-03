'use client'

import { useEffect, useState } from 'react'

interface GenerateModalProps {
  phase: 'idle' | 'generating' | 'done' | 'error'
  action: string
  error: string | null
  onClose?: () => void
}

const ACTION_LABELS: Record<string, { label: string; steps: string[] }> = {
  sync: { label: 'Full Data Sync', steps: ['Fetching store listing data', 'Importing real user reviews', 'Generating keyword suggestions', 'Checking real keyword rankings', 'Discovering competitors', 'Calculating visibility score', 'Computing ASO score', 'Writing analysis results'] },
  overview: { label: 'Overview Analysis', steps: ['Fetching app metadata', 'Analyzing surfaces', 'Generating priorities'] },
  keywords: { label: 'Keyword Discovery', steps: ['Scanning store listings', 'Analyzing search terms', 'Scoring relevance & difficulty'] },
  competitors: { label: 'Competitor Discovery', steps: ['Identifying category rivals', 'Analyzing threat levels', 'Mapping strengths & weaknesses'] },
  visibility: { label: 'Visibility Analysis', steps: ['Measuring search presence', 'Scoring surface coverage', 'Identifying quick wins'] },
  'reviews-analysis': { label: 'Reviews Analysis', steps: ['Parsing review corpus', 'Clustering themes', 'Generating reply templates'] },
  'store-intel': { label: 'Store Intelligence', steps: ['Analyzing category trends', 'Scoring algorithm factors', 'Finding featuring opportunities'] },
  recommendations: { label: 'Recommendations', steps: ['Auditing all surfaces', 'Scoring impact vs effort', 'Prioritizing actions'] },
  'optimize-title': { label: 'Title Optimization', steps: ['Analyzing current title', 'Generating AI variants'] },
  'optimize-subtitle': { label: 'Subtitle Optimization', steps: ['Analyzing current subtitle', 'Generating AI variants'] },
  'optimize-description': { label: 'Description Optimization', steps: ['Analyzing current description', 'Generating AI rewrite'] },
  'optimize-keywords-field': { label: 'Keywords Field Optimization', steps: ['Analyzing keyword field', 'Optimizing character usage'] },
  strategy: { label: 'Strategy Plan', steps: ['Assessing current position', 'Defining goals', 'Building weekly action plan'] },
  localization: { label: 'Localization Analysis', steps: ['Scanning market opportunities', 'Estimating locale impact', 'Prioritizing languages'] },
  'update-impact': { label: 'Update Impact Analysis', steps: ['Reviewing version history', 'Analyzing rating changes', 'Planning next release'] },
  'discovery-map': { label: 'Discovery Map', steps: ['Mapping all surfaces', 'Identifying gaps', 'Scoring coverage'] },
  'llm-track': { label: 'LLM Tracker', steps: ['Probing AI engines', 'Scoring recommendation rate', 'Analyzing prompts'] },
  'intent-map': { label: 'Intent Mapping', steps: ['Clustering user intents', 'Mapping to surfaces', 'Finding gaps'] },
  'ad-intel': { label: 'Ad Intelligence', steps: ['Scanning ad platforms', 'Analyzing competitor spend', 'Generating campaign ideas'] },
  'creative-lab': { label: 'Creative Lab', steps: ['Analyzing screenshots', 'Scoring visual elements', 'Generating A/B tests'] },
  cpps: { label: 'Custom Pages', steps: ['Analyzing audience segments', 'Designing page layouts'] },
  attribution: { label: 'Attribution Analysis', steps: ['Mapping install channels', 'Estimating causal impact'] },
  'reviews-plus': { label: 'Reviews+ Analysis', steps: ['Deep-parsing reviews', 'Clustering topics', 'Building reply strategy'] },
  'agent-ready': { label: 'Agent Ready Check', steps: ['Auditing structured data', 'Scoring AI readiness', 'Building action plan'] },
  'market-intel': { label: 'Market Intelligence', steps: ['Sizing market', 'Mapping top players', 'Analyzing growth trends'] },
  'feature-image-score': { label: 'Feature Image Score', steps: ['Fetching feature graphic', 'Analyzing image metrics', 'Scoring with AI', 'Fetching competitor graphics'] },
}

export function GenerateModal({ phase, action, error, onClose }: GenerateModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const info = ACTION_LABELS[action] ?? { label: action, steps: ['Processing...'] }

  // Animate through steps while generating
  useEffect(() => {
    if (phase !== 'generating') {
      setCurrentStep(0)
      return
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < info.steps.length - 1) return prev + 1
        return prev
      })
    }, 2500)

    return () => clearInterval(interval)
  }, [phase, info.steps.length])

  if (phase === 'idle') return null

  return (
    <div className="gen-modal-backdrop" onClick={phase === 'error' ? onClose : undefined}>
      <div className="gen-modal" onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div className="gen-modal-icon">
          {phase === 'error' ? (
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="var(--color-warn)" strokeWidth="2" />
              <path d="M14 14l12 12M26 14L14 26" stroke="var(--color-warn)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : phase === 'done' ? (
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="var(--color-ok)" strokeWidth="2" />
              <path d="M12 20l6 6 10-12" stroke="var(--color-ok)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <div className="gen-spinner" />
          )}
        </div>

        {/* Title */}
        <h3 className="gen-modal-title">
          {phase === 'error' ? 'Generation failed' : phase === 'done' ? 'Done!' : info.label}
        </h3>

        {/* Steps (only while generating) */}
        {phase === 'generating' && (
          <div className="gen-modal-steps">
            {info.steps.map((step, i) => (
              <div
                key={i}
                className={`gen-step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}
              >
                <span className="gen-step-dot" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {phase === 'error' && error && (
          <div className="gen-modal-error">{error}</div>
        )}

        {/* Close button on error */}
        {phase === 'error' && (
          <button className="btn ghost" onClick={onClose} style={{ marginTop: 16 }}>
            Close
          </button>
        )}
      </div>
    </div>
  )
}
