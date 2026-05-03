'use client'

import { useRouter } from 'next/navigation'

export function MonthNav({ current }: { current: string }) {
  const router = useRouter()
  const parts = current.split('-').map(Number)
  const year = parts[0] ?? 2026
  const month = parts[1] ?? 1

  const prev = month === 1
    ? `${year - 1}-12`
    : `${year}-${String(month - 1).padStart(2, '0')}`
  const next = month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, '0')}`

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const isCurrentMonth = current === currentMonth

  const label = new Date(year, month - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const btnStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid var(--color-line)',
    borderRadius: 4,
    padding: '4px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    cursor: 'pointer',
    color: 'var(--color-ink)',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button style={btnStyle} onClick={() => router.push(`?month=${prev}`)}>
        &larr;
      </button>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        minWidth: 140,
        textAlign: 'center',
      }}>
        {label}
      </span>
      {!isCurrentMonth && (
        <button style={btnStyle} onClick={() => router.push(`?month=${next}`)}>
          &rarr;
        </button>
      )}
    </div>
  )
}
