'use client'

import { useState } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import type { FeatureRow } from './page'

interface FeatureMatrixProps {
  features: FeatureRow[]
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  HIT:      { bg: 'var(--color-ok-wash, #dff0e3)', color: 'var(--color-ok, #1a6b3c)' },
  'ON TRACK': { bg: 'var(--color-accent-wash, #e8ecfa)', color: 'var(--color-accent, #1d3fd9)' },
  WATCH:    { bg: '#fef3cd', color: '#856404' },
  MISS:     { bg: 'var(--color-warn-wash, #f7e6df)', color: 'var(--color-warn, #c0392b)' },
  SUNSET:   { bg: 'var(--color-warn-wash, #f7e6df)', color: 'var(--color-warn, #c0392b)' },
}

type Filter = 'ALL' | 'HITS' | 'MISSES'

export function FeatureMatrix({ features }: FeatureMatrixProps) {
  const [filter, setFilter] = useState<Filter>('ALL')

  const filtered = features.filter(f => {
    if (filter === 'HITS') return f.status === 'HIT'
    if (filter === 'MISSES') return f.status === 'MISS' || f.status === 'SUNSET'
    return true
  })

  const pills: { label: string; value: Filter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Hits', value: 'HITS' },
    { label: 'Misses', value: 'MISSES' },
  ]

  return (
    <AdminCard
      title={<>Feature <em>matrix</em></>}
      actions={
        <div style={{ display: 'flex', gap: 4 }}>
          {pills.map(p => (
            <button
              key={p.value}
              onClick={() => setFilter(p.value)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.1em',
                padding: '4px 12px',
                borderRadius: 20,
                border: '1px solid var(--color-line)',
                background: filter === p.value ? 'var(--color-ink)' : 'var(--color-card)',
                color: filter === p.value ? 'white' : 'var(--color-ink-3)',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      {filtered.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-ink-3)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>No features match this filter.</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Module</th>
              <th className="tn">Shipped</th>
              <th className="tn">Adoption</th>
              <th className="tn">δ Retention</th>
              <th className="tn">δ Expansion</th>
              <th className="tn">Corr NPS</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => {
              const st = STATUS_STYLES[f.status] ?? STATUS_STYLES['WATCH']!
              return (
                <tr key={f.type}>
                  <td><strong>{f.label}</strong></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)' }}>{f.module}</td>
                  <td className="tn">{f.shippedAgo}</td>
                  <td className="tn">{f.adoption}%</td>
                  <td className="tn" style={{ color: 'var(--color-ink-4)' }}>—</td>
                  <td className="tn" style={{ color: 'var(--color-ink-4)' }}>—</td>
                  <td className="tn" style={{ color: 'var(--color-ink-4)' }}>—</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      padding: '3px 8px',
                      borderRadius: 3,
                      letterSpacing: '0.12em',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      background: st.bg,
                      color: st.color,
                    }}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </AdminCard>
  )
}
