'use client'

import { useState, useTransition } from 'react'
import { savePricing } from '@/app/(app)/admin/pricing/actions'

interface TierData {
  key: string
  name: string
  priceMonthly: number
  apps: number
  keywords: number
  seats: number
}

const EDITABLE_FIELDS = [
  { key: 'priceMonthly', label: 'Price/mo' },
  { key: 'apps', label: 'App Limit' },
  { key: 'keywords', label: 'Keyword Limit' },
  { key: 'seats', label: 'Seat Limit' },
] as const

type FieldKey = (typeof EDITABLE_FIELDS)[number]['key']

export function EditablePricing({ tiers: initialTiers }: { tiers: TierData[] }) {
  const [tiers, setTiers] = useState(initialTiers)
  const [editing, setEditing] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const dirty = JSON.stringify(tiers) !== JSON.stringify(initialTiers)

  function updateField(tierKey: string, field: FieldKey, value: number) {
    setTiers(prev => prev.map(t =>
      t.key === tierKey ? { ...t, [field]: value } : t
    ))
  }

  function handleSave() {
    startTransition(async () => {
      const map: Record<string, { priceMonthly: number; apps: number; keywords: number; seats: number }> = {}
      for (const t of tiers) {
        map[t.key] = {
          priceMonthly: t.priceMonthly,
          apps: t.apps,
          keywords: t.keywords,
          seats: t.seats,
        }
      }
      await savePricing(map)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function renderCell(tier: TierData, field: FieldKey) {
    const editKey = `${tier.key}.${field}`
    const value = tier[field]
    const prefix = field === 'priceMonthly' ? '$' : ''

    if (editing === editKey) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          {prefix && <span>{prefix}</span>}
          <input
            type="number"
            defaultValue={value}
            autoFocus
            min={0}
            style={{
              width: 72,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              border: '1px solid var(--color-accent)',
              borderRadius: 4,
              padding: '2px 6px',
              textAlign: 'right',
              outline: 'none',
            }}
            onBlur={(e) => {
              const val = Math.max(0, parseInt(e.target.value) || 0)
              updateField(tier.key, field, val)
              setEditing(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setEditing(null)
            }}
          />
        </span>
      )
    }

    return (
      <span
        onClick={() => setEditing(editKey)}
        title="Click to edit"
        style={{
          cursor: 'pointer',
          borderBottom: '1px dashed var(--color-ink-4)',
          paddingBottom: 1,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {prefix}{value.toLocaleString()}
      </span>
    )
  }

  return (
    <>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Tier</th>
            {EDITABLE_FIELDS.map(f => (
              <th key={f.key} className="tn">{f.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tiers.map(tier => (
            <tr key={tier.key}>
              <td>
                <strong>{tier.name}</strong>
                {tier.priceMonthly === 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-4)', marginLeft: 8 }}>FREE</span>
                )}
              </td>
              {EDITABLE_FIELDS.map(f => (
                <td key={f.key} className="tn">
                  {renderCell(tier, f.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {dirty && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0 0' }}>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="btn-ghost"
            style={{
              background: 'var(--color-ink)',
              color: '#fff',
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: isPending ? 'wait' : 'pointer',
            }}
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      {saved && (
        <div style={{
          textAlign: 'right',
          fontSize: 11,
          color: 'var(--color-ok)',
          fontFamily: 'var(--font-mono)',
          paddingTop: 4,
        }}>
          Saved
        </div>
      )}
    </>
  )
}
