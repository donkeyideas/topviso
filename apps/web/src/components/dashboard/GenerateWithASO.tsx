'use client'

import { useState } from 'react'

interface GenerateWithASOProps {
  appId: string
  action: string
  locale?: string
  label?: string
  onResult: (data: unknown) => void
}

export function GenerateWithASO({
  appId,
  action,
  locale,
  label = 'Generate with Top Viso',
  onResult,
}: GenerateWithASOProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, appId, locale }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }

      const { result } = await res.json()
      onResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn accent"
        style={loading ? { background: 'var(--color-ink-3)', cursor: 'not-allowed' } : undefined}
      >
        {loading ? (
          <>
            <span className="generate-spinner" />
            Generating...
          </>
        ) : (
          label
        )}
      </button>
      {error && (
        <p style={{ color: 'var(--color-warn)', fontSize: '13px', marginTop: '8px' }}>
          {error}
        </p>
      )}
    </>
  )
}
