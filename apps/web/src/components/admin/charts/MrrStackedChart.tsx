'use client'

interface MonthData {
  month: string
  solo: number
  team: number
  enterprise: number
}

interface MrrStackedChartProps {
  data: MonthData[]
}

export function MrrStackedChart({ data }: MrrStackedChartProps) {
  const W = 780
  const H = 260
  const padLeft = 48
  const padBottom = 30
  const padTop = 12
  const chartW = W - padLeft - 10
  const chartH = H - padTop - padBottom

  const maxTotal = Math.max(...data.map(d => d.solo + d.team + d.enterprise), 1)
  const ceil = Math.ceil(maxTotal / 1000) * 1000
  const gridLines = [0.25, 0.5, 0.75, 1].map(f => Math.round(ceil * f))

  const barW = Math.min(40, (chartW / data.length) * 0.65)
  const gap = (chartW - barW * data.length) / (data.length + 1)

  const y = (v: number) => padTop + chartH - (v / ceil) * chartH
  const fmt = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`

  const totalSolo = data.reduce((s, d) => s + d.solo, 0)
  const totalTeam = data.reduce((s, d) => s + d.team, 0)
  const totalEnt = data.reduce((s, d) => s + d.enterprise, 0)
  const lastMonth = data[data.length - 1]
  const lastTotal = lastMonth ? lastMonth.solo + lastMonth.team + lastMonth.enterprise : 0

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Grid lines */}
        {gridLines.map(v => {
          const yy = y(v)
          if (yy < padTop || yy > padTop + chartH) return null
          return (
            <g key={v}>
              <line x1={padLeft} y1={yy} x2={padLeft + chartW} y2={yy} stroke="var(--color-line-soft, #e4e0d3)" strokeWidth="0.5" />
              <text x={padLeft - 6} y={yy + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="var(--color-ink-4, #a8a69b)" letterSpacing="0.06em">
                {fmt(v)}
              </text>
            </g>
          )
        })}

        {/* Baseline */}
        <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} stroke="var(--color-line, #d8d3c4)" strokeWidth="0.5" />

        {/* Stacked bars */}
        {data.map((d, i) => {
          const x = padLeft + gap + i * (barW + gap)
          const soloH = (d.solo / ceil) * chartH
          const teamH = (d.team / ceil) * chartH
          const entH = (d.enterprise / ceil) * chartH
          const isLast = i === data.length - 1

          return (
            <g key={i}>
              {/* Enterprise (bottom) */}
              {d.enterprise > 0 && (
                <rect x={x} y={padTop + chartH - entH} width={barW} height={entH} fill="#071a66" rx="1" />
              )}
              {/* Team (middle) */}
              {d.team > 0 && (
                <rect x={x} y={padTop + chartH - entH - teamH} width={barW} height={teamH} fill="var(--color-accent, #1d3fd9)" rx="1" />
              )}
              {/* Solo (top) */}
              {d.solo > 0 && (
                <rect x={x} y={padTop + chartH - entH - teamH - soloH} width={barW} height={soloH} fill="var(--color-ink-3, #72716a)" rx="1" />
              )}
              {/* Current month highlight */}
              {isLast && (
                <rect x={x - 2} y={padTop + chartH - entH - teamH - soloH - 2} width={barW + 4} height={entH + teamH + soloH + 4} fill="none" stroke="var(--color-ink, #0e0e0c)" strokeWidth="1.5" strokeDasharray="3 2" rx="2" />
              )}
              {/* X-axis label */}
              <text x={x + barW / 2} y={padTop + chartH + 16} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--color-ink-4, #a8a69b)" letterSpacing="0.08em">
                {d.month}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, padding: '10px 0 0 48px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-ink-3, #72716a)', display: 'inline-block' }} />
          Solo <b style={{ color: 'var(--color-ink)' }}>{fmt(totalSolo > 0 ? data[data.length - 1]?.solo ?? 0 : 0)}</b>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-accent, #1d3fd9)', display: 'inline-block' }} />
          Team <b style={{ color: 'var(--color-ink)' }}>{fmt(totalTeam > 0 ? data[data.length - 1]?.team ?? 0 : 0)}</b>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#071a66', display: 'inline-block' }} />
          Enterprise <b style={{ color: 'var(--color-ink)' }}>{fmt(totalEnt > 0 ? data[data.length - 1]?.enterprise ?? 0 : 0)}</b>
        </span>
        <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--color-ink)' }}>
          Total {fmt(lastTotal)}
        </span>
      </div>
    </div>
  )
}
