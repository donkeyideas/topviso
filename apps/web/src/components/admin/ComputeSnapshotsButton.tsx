'use client'

import { useState } from 'react'

export function ComputeSnapshotsButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleCompute() {
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/admin/compute-snapshots', { method: 'POST' })
      const json = await res.json()
      if (json.ok) {
        setStatus('success')
        setMessage(`Snapshots computed for ${json.computed}`)
      } else {
        setStatus('error')
        setMessage(json.errors?.join(', ') ?? 'Unknown error')
      }
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : 'Network error')
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={handleCompute}
        disabled={status === 'loading'}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '10px 20px',
          border: '1px solid var(--color-accent)',
          borderRadius: 4,
          background: status === 'loading' ? 'var(--color-line)' : 'var(--color-accent)',
          color: status === 'loading' ? 'var(--color-ink-3)' : '#fff',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'loading' ? 'Computing...' : 'Compute Analytics Snapshots'}
      </button>
      {message && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: status === 'success' ? 'var(--color-ok)' : '#c43b1e',
          }}
        >
          {message}
        </span>
      )}
    </div>
  )
}
