'use client'

interface ForecastChartProps {
  current: number
  projected: number
  p10: number
  p90: number
}

export function ForecastChart({ current, projected, p10, p90 }: ForecastChartProps) {
  const W = 320
  const H = 180
  const padLeft = 48
  const padRight = 16
  const padTop = 16
  const padBottom = 44
  const chartW = W - padLeft - padRight
  const chartH = H - padTop - padBottom

  // Y-axis domain: compute nice bounds from all values
  const allVals = [current, projected, p10, p90]
  const maxVal = Math.max(...allVals, 1) * 1.15
  const gridLines = [500000, 300000, 100000]

  const yScale = (v: number) => padTop + chartH - (v / maxVal) * chartH
  const xScale = (frac: number) => padLeft + frac * chartW

  // Key x positions
  const xToday = xScale(1 / 3)
  const xEnd = xScale(1)

  // Current and projected y positions
  const yCurrent = yScale(current)
  const yProjected = yScale(projected)
  const yP10 = yScale(p10)
  const yP90 = yScale(p90)

  // Historical line: flat-ish leading to current
  const xStart = xScale(0)
  const yHistStart = yScale(current * 0.85)
  const historicalPath = `M${xStart},${yHistStart} L${xToday},${yCurrent}`

  // Projected dashed line from current to projected
  const projectedPath = `M${xToday},${yCurrent} L${xEnd},${yProjected}`

  // Confidence band: triangle-ish shape from current to p10/p90 at end
  const bandPath = [
    `M${xToday},${yCurrent}`,
    `L${xEnd},${yP90}`,
    `L${xEnd},${yP10}`,
    `Z`,
  ].join(' ')

  const fmt = (v: number) => `$${(v / 1000).toFixed(0)}K`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', maxWidth: W }}
    >
      {/* Grid lines */}
      {gridLines.map((v) => {
        const y = yScale(v)
        if (y < padTop || y > padTop + chartH) return null
        return (
          <g key={v}>
            <line
              x1={padLeft}
              y1={y}
              x2={padLeft + chartW}
              y2={y}
              stroke="#d8d3c4"
              strokeWidth="0.5"
            />
            <text
              x={padLeft - 6}
              y={y + 3}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize="8"
              fill="#72716a"
              letterSpacing="0.06em"
            >
              {fmt(v)}
            </text>
          </g>
        )
      })}

      {/* Baseline */}
      <line
        x1={padLeft}
        y1={padTop + chartH}
        x2={padLeft + chartW}
        y2={padTop + chartH}
        stroke="#d8d3c4"
        strokeWidth="0.5"
      />

      {/* Confidence band */}
      <path d={bandPath} fill="#1d3fd9" opacity="0.10" />

      {/* Historical solid line */}
      <path
        d={historicalPath}
        fill="none"
        stroke="#0e0e0c"
        strokeWidth="1.5"
      />

      {/* Projected dashed line */}
      <path
        d={projectedPath}
        fill="none"
        stroke="#1d3fd9"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />

      {/* P10 / P90 boundary lines (subtle) */}
      <path
        d={`M${xToday},${yCurrent} L${xEnd},${yP10}`}
        fill="none"
        stroke="#1d3fd9"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        opacity="0.4"
      />
      <path
        d={`M${xToday},${yCurrent} L${xEnd},${yP90}`}
        fill="none"
        stroke="#1d3fd9"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        opacity="0.4"
      />

      {/* Current point marker */}
      <circle cx={xToday} cy={yCurrent} r="3.5" fill="#0e0e0c" />
      <circle cx={xToday} cy={yCurrent} r="1.5" fill="white" />

      {/* Projected point marker */}
      <circle cx={xEnd} cy={yProjected} r="3.5" fill="#1d3fd9" />
      <circle cx={xEnd} cy={yProjected} r="1.5" fill="white" />

      {/* TODAY label */}
      <text
        x={xToday}
        y={padTop + chartH + 14}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="8"
        fill="#72716a"
        letterSpacing="0.12em"
      >
        TODAY
      </text>

      {/* APR '27 label */}
      <text
        x={xEnd}
        y={padTop + chartH + 14}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="8"
        fill="#72716a"
        letterSpacing="0.12em"
      >
        {"APR '27"}
      </text>

      {/* Bottom stats */}
      <text
        x={padLeft}
        y={H - 6}
        fontFamily="var(--font-mono)"
        fontSize="7.5"
        fill="#72716a"
        letterSpacing="0.06em"
      >
        <tspan fontWeight="600" fill="#1d3fd9">P50 {fmt(projected)}</tspan>
        <tspan dx="8">P10 {fmt(p10)}</tspan>
        <tspan dx="8">P90 {fmt(p90)}</tspan>
      </text>
    </svg>
  )
}
