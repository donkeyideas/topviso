'use client'

import { useEffect } from 'react'

export interface GlossaryTerm {
  label: string
  shortFor?: string
  description: string
  range?: string
}

export interface GlossarySection {
  heading?: string
  terms: GlossaryTerm[]
  /** Compact rows (label + description on one line) — for enum-style lists like intents/threat levels. */
  compact?: boolean
}

interface GlossaryModalProps {
  title: string
  subtitle?: string
  sections: GlossarySection[]
  onClose: () => void
}

export function GlossaryModal({ title, subtitle, sections, onClose }: GlossaryModalProps) {
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
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: 13, color: 'var(--color-ink-2)', marginTop: 8 }}>
              {subtitle}
            </p>
          )}
        </div>

        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: idx < sections.length - 1 ? 20 : 0 }}>
            {section.heading && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
                {section.heading}
              </div>
            )}
            {section.compact ? (
              <div>
                {section.terms.map((t) => (
                  <div key={t.label} style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 12 }}>
                    <strong style={{ minWidth: 110, color: 'var(--color-ink)' }}>{t.label}</strong>
                    <span style={{ color: 'var(--color-ink-2)' }}>{t.description}</span>
                  </div>
                ))}
              </div>
            ) : (
              <dl style={{ margin: 0 }}>
                {section.terms.map((t, i) => (
                  <div
                    key={t.label}
                    style={{
                      paddingBottom: 16,
                      marginBottom: 16,
                      borderBottom: i < section.terms.length - 1 ? '1px solid var(--color-line)' : 'none',
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
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface GlossaryButtonProps {
  onClick: () => void
  label?: string
}

export function GlossaryButton({ onClick, label = '? What do these mean' }: GlossaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="What do these terms mean?"
      title="What do these terms mean?"
      className="chip"
      style={{ fontSize: 11, padding: '4px 10px', cursor: 'pointer', alignSelf: 'center' }}
    >
      {label}
    </button>
  )
}
