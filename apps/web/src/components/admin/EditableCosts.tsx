'use client'

import { useState, useTransition } from 'react'
import { saveCogs } from '@/app/(app)/admin/financials/actions'

interface CostItem {
  key: string
  name: string
  amount: number
  live?: boolean
}

export function EditableCosts({
  costs,
  revenue,
}: {
  costs: CostItem[]
  revenue: number
}) {
  const [items, setItems] = useState(costs)
  const [editing, setEditing] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const totalCogs = items.reduce((s, c) => s + c.amount, 0)
  const grossProfit = revenue - totalCogs
  const dirty = JSON.stringify(items) !== JSON.stringify(costs)

  function handleSave() {
    startTransition(async () => {
      const cogsMap: Record<string, number> = {}
      for (const item of items) cogsMap[item.key] = item.amount
      await saveCogs(cogsMap)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <>
      <table className="admin-table">
        <thead>
          <tr><th>Line Item</th><th className="tn">Amount</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Revenue (MRR)</strong></td>
            <td className="tn"><strong>${revenue.toLocaleString()}</strong></td>
          </tr>
          <tr><td colSpan={2} style={{ height: 8, padding: 0, border: 'none' }} /></tr>
          {items.map((c) => (
            <tr key={c.key}>
              <td style={{ paddingLeft: 16 }}>
                {c.name}
                {c.live && <span className="admin-pill ok" style={{ marginLeft: 8, fontSize: 9 }}>LIVE</span>}
              </td>
              <td className="tn" style={{ color: 'var(--color-warn)' }}>
                {c.live ? (
                  <span>-${c.amount.toFixed(2)}</span>
                ) : editing === c.key ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span>-$</span>
                    <input
                      type="number"
                      defaultValue={c.amount}
                      autoFocus
                      min={0}
                      style={{
                        width: 64,
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
                    -${c.amount}
                  </span>
                )}
              </td>
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid var(--color-ink)' }}>
            <td><strong>Total COGS</strong></td>
            <td className="tn"><strong>-${totalCogs.toFixed(2)}</strong></td>
          </tr>
          <tr><td colSpan={2} style={{ height: 8, padding: 0, border: 'none' }} /></tr>
          <tr style={{ borderTop: '2px solid var(--color-ink)' }}>
            <td><strong>Gross Profit</strong></td>
            <td
              className="tn"
              style={{ color: grossProfit >= 0 ? 'var(--color-ok)' : 'var(--color-warn)' }}
            >
              <strong>${grossProfit.toFixed(2)}</strong>
            </td>
          </tr>
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
