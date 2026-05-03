'use client'

interface DataPoint {
  month: string
  wau: number
  seats: number
}

interface Milestone {
  monthIndex: number
  label: string
}

interface EngagementTrajectoryChartProps {
  data: DataPoint[]
  milestones?: Milestone[]
  trialEndIndex?: number // index at which trial ended
}

export function EngagementTrajectoryChart({
  data,
  milestones = [],
  trialEndIndex,
}: EngagementTrajectoryChartProps) {
  if (data.length === 0) return null

  const W = 760
  const H = 260
  const PAD = { top: 30, right: 50, bottom: 30, left: 30 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.map(d => Math.max(d.wau, d.seats)), 10)
  const gridMax = Math.ceil(maxVal / 5) * 5
  const gridLines = [0, Math.round(gridMax * 0.25), Math.round(gridMax * 0.5), Math.round(gridMax * 0.75), gridMax]

  const xStep = data.length > 1 ? plotW / (data.length - 1) : plotW
  const toX = (i: number) => PAD.left + i * xStep
  const toY = (v: number) => PAD.top + plotH - (v / gridMax) * plotH

  // WAU line path
  const wauPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.wau)}`).join(' ')

  // WAU filled area
  const wauArea = `${wauPath} L${toX(data.length - 1)},${toY(0)} L${toX(0)},${toY(0)} Z`

  // Seats step line
  const seatSegments: string[] = []
  for (let i = 0; i < data.length; i++) {
    const x = toX(i)
    const y = toY(data[i]!.seats)
    if (i === 0) {
      seatSegments.push(`M${x},${y}`)
    } else {
      // Step: horizontal then vertical
      seatSegments.push(`L${x},${toY(data[i - 1]!.seats)}`)
      seatSegments.push(`L${x},${y}`)
    }
  }
  const seatPath = seatSegments.join(' ')

  // Trial area (shaded region before trial end)
  const trialEnd = trialEndIndex ?? -1
  let trialArea: string | null = null
  if (trialEnd > 0 && trialEnd < data.length) {
    const trialWau = data.slice(0, trialEnd + 1).map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(d.wau)}`).join(' ')
    trialArea = `${trialWau} L${toX(trialEnd)},${toY(0)} L${toX(0)},${toY(0)} Z`
  }

  // Latest values
  const lastD = data[data.length - 1]!

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12, paddingLeft: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--color-ink-3)' }}>
          <div style={{ width: 16, height: 2, background: '#1d3fd9' }} /> WAU
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--color-ink-3)' }}>
          <div style={{ width: 16, height: 2, background: 'var(--color-ink)' }} /> SEATS ALLOCATED
        </div>
        {trialEnd > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--color-ink-3)' }}>
            <div style={{ width: 16, height: 2, background: 'var(--color-ink-4, #aaa)' }} /> TRIAL-ONLY
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Grid lines */}
        {gridLines.map(v => (
          <g key={v}>
            <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)} stroke="var(--color-line, #d8d3c4)" strokeWidth="0.5" />
            <text x={PAD.left - 6} y={toY(v) + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="var(--color-ink-4, #aaa)">
              {v}
            </text>
          </g>
        ))}

        {/* Trial area (lighter shade) */}
        {trialArea && (
          <path d={trialArea} fill="var(--color-ink-4, #ccc)" opacity="0.12" />
        )}

        {/* WAU filled area */}
        <path d={wauArea} fill="#1d3fd9" opacity="0.08" />

        {/* WAU line */}
        <path d={wauPath} fill="none" stroke="#1d3fd9" strokeWidth="2" />

        {/* Seats step line */}
        <path d={seatPath} fill="none" stroke="var(--color-ink)" strokeWidth="1.5" />

        {/* Milestones */}
        {milestones.map((ms, i) => {
          if (ms.monthIndex < 0 || ms.monthIndex >= data.length) return null
          const d = data[ms.monthIndex]!
          const x = toX(ms.monthIndex)
          const y = Math.min(toY(d.wau), toY(d.seats)) - 8
          return (
            <g key={i}>
              <circle cx={x} cy={toY(d.seats)} r={4} fill="#c0392b" stroke="white" strokeWidth="1.5" />
              <text x={x} y={y - 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="var(--color-ok, #1a6b3c)" fontWeight="700" letterSpacing="0.06em">
                {ms.label}
              </text>
            </g>
          )
        })}

        {/* End dot + label */}
        <circle cx={toX(data.length - 1)} cy={toY(lastD.wau)} r={4} fill="#1d3fd9" />
        <text x={toX(data.length - 1) + 8} y={toY(lastD.wau) + 4} fontFamily="var(--font-mono)" fontSize="10" fill="var(--color-ink)" fontWeight="700">
          {lastD.wau}/{lastD.seats}
        </text>

        {/* Month labels */}
        {data.map((d, i) => {
          // Show every 3rd label or first/last
          if (i !== 0 && i !== data.length - 1 && i % 3 !== 0) return null
          return (
            <text key={i} x={toX(i)} y={H - 6} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="var(--color-ink-4, #aaa)" letterSpacing="0.06em">
              {d.month}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
