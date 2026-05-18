'use client'

import { useEffect } from 'react'

interface Term {
  label: string
  shortFor?: string
  description: string
  range?: string
}

const TERMS: Term[] = [
  {
    label: 'Keyword',
    description: 'The search query users type in the app store. Each row is a tracked keyword.',
  },
  {
    label: 'Rank',
    description: 'Your app\'s position in app store search results for this keyword. #1 is the top result. Lower is better.',
    range: '#1–#250+',
  },
  {
    label: 'Vol.',
    shortFor: 'Search Volume',
    description: 'Estimated monthly searches for this keyword in the app store. Higher means more potential traffic.',
    range: '0–100K+',
  },
  {
    label: 'Diff.',
    shortFor: 'Difficulty',
    description: 'How hard it is to rank in the top 10 for this keyword. Based on competitor strength and ranking density.',
    range: '0 (easy) – 100 (hard)',
  },
  {
    label: 'Δ 7d',
    shortFor: 'Delta 7 Days',
    description: 'Change in your rank over the last 7 days. Positive (green) means moved up; negative (red) means dropped.',
  },
  {
    label: 'KEI',
    shortFor: 'Keyword Effectiveness Index',
    description: 'A composite score weighing search volume against difficulty. High KEI = high opportunity (lots of searches, low competition). Calculated as (Volume² ÷ Difficulty).',
    range: '0–1000+',
  },
  {
    label: 'Top Competitor',
    description: 'The app currently ranking #1 for this keyword. Useful for identifying who you need to outrank.',
  },
  {
    label: 'Rel.',
    shortFor: 'Relevance',
    description: 'How relevant this keyword is to your app\'s actual category and feature set. Higher means a better match.',
    range: '0–100',
  },
  {
    label: 'Intent',
    description: 'The user\'s motivation when searching this keyword.',
  },
]

const INTENT_TYPES = [
  { label: 'Informational', description: 'User wants to learn (e.g., "how to track keywords")' },
  { label: 'Navigational', description: 'User is looking for a specific app or brand' },
  { label: 'Commercial', description: 'User is comparing options before downloading' },
  { label: 'Transactional', description: 'User is ready to download or buy now' },
]

export function KeywordGlossaryModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--color-paper)',
          border: '1px solid var(--color-line)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 640,
          maxHeight: '85vh',
          overflow: 'auto',
          padding: '32px 32px 28px',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'transparent', border: 'none',
            fontSize: 24, lineHeight: 1, color: 'var(--color-ink-3)',
            cursor: 'pointer', padding: 4,
          }}
        >
          ×
        </button>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            Glossary
          </div>
          <h2 className="font-display" style={{ fontSize: 28, letterSpacing: '-0.02em', margin: 0 }}>
            Keyword <em>terms</em>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-ink-2)', marginTop: 8 }}>
            Quick reference for the metrics in the keyword intelligence table.
          </p>
        </div>

        <dl style={{ margin: 0 }}>
          {TERMS.map((t) => (
            <div
              key={t.label}
              style={{
                paddingBottom: 16,
                marginBottom: 16,
                borderBottom: '1px solid var(--color-line)',
              }}
            >
              <dt style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 14, color: 'var(--color-ink)' }}>{t.label}</strong>
                {t.shortFor && (
                  <span style={{ fontSize: 11, color: 'var(--color-ink-3)', fontStyle: 'italic' }}>
                    ({t.shortFor})
                  </span>
                )}
                {t.range && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', marginLeft: 'auto' }}>
                    {t.range}
                  </span>
                )}
              </dt>
              <dd style={{ margin: 0, fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.6 }}>
                {t.description}
              </dd>
            </div>
          ))}
        </dl>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
            Intent types
          </div>
          {INTENT_TYPES.map((i) => (
            <div key={i.label} style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 12 }}>
              <strong style={{ minWidth: 110, color: 'var(--color-ink)' }}>{i.label}</strong>
              <span style={{ color: 'var(--color-ink-2)' }}>{i.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
