'use client'

import { useState } from 'react'

interface UsageHeatmapProps {
  /** Keys are "YYYY-MM-DD", values are 0–4 intensity levels */
  data: Record<string, number>
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const COLORS = [
  '#d5d0c3',   // 0 — no activity
  '#c8d4f0',   // 1
  '#96a8e0',   // 2
  '#5e74d0',   // 3
  '#1d3fd9',   // 4
]

function pad2(n: number) { return String(n).padStart(2, '0') }

export function UsageHeatmap({ data }: UsageHeatmapProps) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  // Navigable range from data keys
  const dataKeys = Object.keys(data).sort()
  const earliest = dataKeys.length > 0 ? dataKeys[0]! : `${viewYear}-${pad2(viewMonth + 1)}-01`
  const earliestDate = new Date(earliest)
  const earliestYear = earliestDate.getFullYear()
  const earliestMonth = earliestDate.getMonth()

  const canGoBack = viewYear > earliestYear || (viewYear === earliestYear && viewMonth > earliestMonth)
  const canGoForward = viewYear < now.getFullYear() || (viewYear === now.getFullYear() && viewMonth < now.getMonth())

  const goBack = () => {
    if (!canGoBack) return
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }
  const goForward = () => {
    if (!canGoForward) return
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Build 7 rows × totalDays columns grid — all cells filled with level 0 (beige),
  // then the row matching each day's actual DOW gets the real activity level
  const grid: number[][] = Array.from({ length: 7 }, () =>
    Array(totalDays).fill(0) as number[]
  )

  for (let day = 1; day <= totalDays; day++) {
    const dow = (new Date(viewYear, viewMonth, day).getDay() + 6) % 7 // Mon=0…Sun=6
    const key = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`
    const level = data[key] ?? 0
    grid[dow]![day - 1] = level
  }

  // Count active days
  let activeDays = 0
  for (let d = 1; d <= totalDays; d++) {
    const key = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`
    if ((data[key] ?? 0) > 0) activeDays++
  }

  return (
    <div>
      {/* Month navigator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          onClick={goBack}
          disabled={!canGoBack}
          style={{
            border: '1px solid var(--color-line)',
            background: 'var(--color-card)',
            borderRadius: 4,
            padding: '4px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            cursor: canGoBack ? 'pointer' : 'default',
            opacity: canGoBack ? 1 : 0.3,
            color: 'var(--color-ink-2)',
            letterSpacing: '0.04em',
          }}
        >
          ← PREV
        </button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, letterSpacing: '-0.01em' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </div>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          style={{
            border: '1px solid var(--color-line)',
            background: 'var(--color-card)',
            borderRadius: 4,
            padding: '4px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            cursor: canGoForward ? 'pointer' : 'default',
            opacity: canGoForward ? 1 : 0.3,
            color: 'var(--color-ink-2)',
            letterSpacing: '0.04em',
          }}
        >
          NEXT →
        </button>
      </div>

      {/* Grid: day-of-week labels on left, day columns */}
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Day-of-week labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 6 }}>
          {DAY_LABELS.map(label => (
            <div key={label} style={{
              width: 28,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              color: 'var(--color-ink-3)',
              letterSpacing: '0.08em',
              lineHeight: 1,
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* Heatmap cells: 7 rows × totalDays cols */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${totalDays}, 1fr)`,
          gridTemplateRows: 'repeat(7, 18px)',
          gap: 3,
          flex: 1,
        }}>
          {grid.map((row, rowIdx) =>
            row.map((level, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                style={{
                  borderRadius: 3,
                  background: COLORS[level] ?? COLORS[0],
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Day number labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `34px repeat(${totalDays}, 1fr)`,
        gap: 3,
        marginTop: 4,
      }}>
        <div /> {/* spacer for day labels column */}
        {Array.from({ length: totalDays }, (_, i) => (
          <div key={i} style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 7,
            color: 'var(--color-ink-3)',
            letterSpacing: '0.04em',
            textAlign: 'center',
            lineHeight: 1,
          }}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* Legend + stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '0 2px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--color-ink-3)',
          letterSpacing: '0.1em',
        }}>
          <span style={{ marginRight: 2 }}>LESS</span>
          {COLORS.map((bg, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: bg, flexShrink: 0 }} />
          ))}
          <span style={{ marginLeft: 2 }}>MORE</span>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.08em' }}>
          ACTIVE DAYS: <strong style={{ color: 'var(--color-ink)', fontWeight: 600 }}>{activeDays}</strong> / {totalDays}
        </div>
      </div>
    </div>
  )
}
