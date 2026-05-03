'use client'

interface MomWaterfallChartProps {
  start: number
  newMrr: number
  expansion: number
  contraction: number
  churned: number
}

export function MomWaterfallChart({ start, newMrr, expansion, contraction, churned }: MomWaterfallChartProps) {
  const end = start + newMrr + expansion - contraction - churned
  const W = 380
  const H = 200
  const padLeft = 10
  const padRight = 10
  const padTop = 16
  const padBottom = 28
  const chartW = W - padLeft - padRight
  const chartH = H - padTop - padBottom

  const maxVal = Math.max(start, end) * 1.15
  const barW = chartW / 8

  const y = (v: number) => padTop + chartH - (v / maxVal) * chartH
  const fmt = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`

  const items: { label: string; value: number; bottom: number; color: string; sign: string }[] = []

  // START bar
  items.push({ label: 'START', value: start, bottom: 0, color: 'var(--color-ink, #0e0e0c)', sign: '' })

  // NEW bar (floats above start level minus churn space)
  let running = start
  items.push({ label: '+NEW', value: newMrr, bottom: running, color: 'var(--color-ok, #1f6a3a)', sign: '+' })
  running += newMrr

  items.push({ label: 'EXPAND', value: expansion, bottom: running, color: '#0d7e87', sign: '+' })
  running += expansion

  // Contraction (drops down)
  running -= contraction
  items.push({ label: 'CONTRACT', value: contraction, bottom: running, color: 'var(--color-gold, #b58300)', sign: '−' })

  running -= churned
  items.push({ label: 'CHURN', value: churned, bottom: running, color: 'var(--color-warn, #c43b1e)', sign: '−' })

  items.push({ label: 'END', value: end, bottom: 0, color: 'var(--color-accent, #1d3fd9)', sign: '' })

  const gap = (chartW - barW * items.length) / (items.length + 1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => {
        const v = Math.round(maxVal * f)
        const yy = y(v)
        if (yy < padTop) return null
        return (
          <line key={f} x1={padLeft} y1={yy} x2={W - padRight} y2={yy} stroke="var(--color-line-soft, #e4e0d3)" strokeWidth="0.5" />
        )
      })}
      <line x1={padLeft} y1={padTop + chartH} x2={W - padRight} y2={padTop + chartH} stroke="var(--color-line, #d8d3c4)" strokeWidth="0.5" />

      {items.map((item, i) => {
        const x = padLeft + gap + i * (barW + gap)
        const barH = (item.value / maxVal) * chartH
        const barY = y(item.bottom + item.value)

        return (
          <g key={i}>
            <rect x={x} y={barY} width={barW} height={Math.max(barH, 1)} fill={item.color} rx="2" />
            {/* Value label above bar */}
            <text x={x + barW / 2} y={barY - 5} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8.5" fill="var(--color-ink, #0e0e0c)" fontWeight="600">
              {item.sign}{fmt(item.value)}
            </text>
            {/* X-axis label */}
            <text x={x + barW / 2} y={padTop + chartH + 16} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="var(--color-ink-4, #a8a69b)" letterSpacing="0.08em">
              {item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
