'use client'

import { useState, useTransition } from 'react'
import { saveOpex } from '@/app/(app)/admin/financials/actions'

interface OpexItem {
  key: string
  label: string
  amount: number
}

export function EditableOpex({
  items: initialItems,
}: {
  items: OpexItem[]
}) {
  const [items, setItems] = useState(initialItems)
  const [editing, setEditing] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const dirty = JSON.stringify(items) !== JSON.stringify(initialItems)

  function handleSave() {
    startTransition(async () => {
      const map: Record<string, number> = {}
      for (const item of items) map[item.key] = item.amount
      await saveOpex(map)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <>
      <table className="admin-table">
        <thead>
          <tr><th>Category</th><th className="tn">Monthly Amount</th></tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.key}>
              <td>{c.label}</td>
              <td className="tn" style={{ color: 'var(--color-warn)' }}>
                {editing === c.key ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span>$</span>
                    <input
                      type="number"
                      defaultValue={c.amount}
                      autoFocus
                      min={0}
                      style={{
                        width: 80,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13,
                        border: '1px solid var(--color-accent)',
                        borderRadius: 4,
                        padding: '2px 6px',
                        textAlign: 'right',
                        outline: 'none',
                      }}
                      onBlur={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0)
                        setItems(prev => prev.map(i => i.key === c.key ? { ...i, amount: val } : i))
                        setEditing(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                        if (e.key === 'Escape') setEditing(null)
                      }}
                    />
                  </span>
                ) : (
                  <span
                    onClick={() => setEditing(c.key)}
                    title="Click to edit"
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px dashed var(--color-ink-4)',
                      paddingBottom: 1,
                    }}
                  >
                    ${c.amount.toLocaleString()}
                  </span>
                )}
              </td>
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
            {isPending ? 'Saving…' : 'Save OpEx'}
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
