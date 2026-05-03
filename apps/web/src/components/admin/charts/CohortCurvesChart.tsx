'use client'

interface CohortCurve {
  label: string
  data: number[]
}

interface CohortCurvesChartProps {
  curves: CohortCurve[]
}

const LINE_COLORS = ['#1d3fd9', '#4a5cc4', '#4a5cc4', '#8894db', '#8894db', '#c3cbed']
const LINE_OPACITIES = [1.0, 0.85, 0.75, 0.6, 0.6, 0.5]

export function CohortCurvesChart({ curves }: CohortCurvesChartProps) {
  const W = 500
  const H = 260
  const padLeft = 42
  const padRight = 16
  const padTop = 16
  const padBottom = 28
  const chartW = W - padLeft - padRight
  const chartH = H - padTop - padBottom

  // Y-axis: 50% to 140%
  const yMin = 50
  const yMax = 140
  const yRange = yMax - yMin
  const yGridLines = [140, 110, 80, 50]

  // X-axis: find max data length
  const maxLen = Math.max(...curves.map((c) => c.data.length), 1)

  const yScale = (v: number) => padTop + chartH - ((v - yMin) / yRange) * chartH
  const xScale = (i: number) => padLeft + (i / Math.max(maxLen - 1, 1)) * chartW

  // 100% reference line
  const y100 = yScale(100)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', maxWidth: W }}
    >
      {/* Grid lines */}
      {yGridLines.map((v) => (
        <g key={v}>
          <line
            x1={padLeft}
            y1={yScale(v)}
            x2={padLeft + chartW}
            y2={yScale(v)}
            stroke="#d8d3c4"
            strokeWidth="0.5"
          />
          <text
            x={padLeft - 6}
            y={yScale(v) + 3}
            textAnchor="end"
            fontFamily="var(--font-mono)"
            fontSize="8"
            fill="#72716a"
            letterSpacing="0.06em"
          >
            {v}%
          </text>
        </g>
      ))}

      {/* 100% reference dashed red line */}
      <line
        x1={padLeft}
        y1={y100}
        x2={padLeft + chartW}
        y2={y100}
        stroke="#c43b1e"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.6"
      />
      <text
        x={padLeft + chartW + 2}
        y={y100 + 3}
        fontFamily="var(--font-mono)"
        fontSize="7"
        fill="#c43b1e"
        opacity="0.7"
      >
        100%
      </text>

      {/* Cohort curves (render in reverse so first curve is on top) */}
      {[...curves].reverse().map((curve, ri) => {
        const i = curves.length - 1 - ri
        const color = LINE_COLORS[i % LINE_COLORS.length]
        const opacity = LINE_OPACITIES[i % LINE_OPACITIES.length]

        if (curve.data.length < 2) return null

        const pathD = curve.data
          .map((v, j) => {
            const x = xScale(j)
            const y = yScale(v)
            return `${j === 0 ? 'M' : 'L'}${x},${y}`
          })
          .join(' ')

        return (
          <g key={curve.label}>
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              opacity={opacity}
            />
            {/* Label at the end of each line */}
            <text
              x={xScale(curve.data.length - 1) + 4}
              y={yScale(curve.data[curve.data.length - 1] ?? 100) + 3}
              fontFamily="var(--font-mono)"
              fontSize="7"
              fill={color}
              opacity={opacity}
            >
              {curve.label}
            </text>
          </g>
        )
      })}

      {/* X-axis labels */}
      {[0, 5, 10].map((m) => {
        if (m >= maxLen) return null
        return (
          <text
            key={m}
            x={xScale(m)}
            y={H - 6}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="8"
            fill="#72716a"
            letterSpacing="0.1em"
          >
            M{m}
          </text>
        )
      })}
    </svg>
  )
}
