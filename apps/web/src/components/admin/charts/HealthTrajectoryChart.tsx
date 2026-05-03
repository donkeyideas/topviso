'use client'

interface HealthPoint {
  month: string
  score: number
  avg: number
}

interface HealthTrajectoryChartProps {
  data: HealthPoint[]
}

export function HealthTrajectoryChart({ data }: HealthTrajectoryChartProps) {
  const W = 500
  const H = 240
  const padLeft = 38
  const padRight = 16
  const padTop = 16
  const padBottom = 28
  const chartW = W - padLeft - padRight
  const chartH = H - padTop - padBottom

  const yMin = 0
  const yMax = 100
  const yGridLines = [100, 75, 50, 25]

  const yScale = (v: number) => padTop + chartH - ((v - yMin) / (yMax - yMin)) * chartH
  const xScale = (i: number) =>
    padLeft + (i / Math.max(data.length - 1, 1)) * chartW

  if (data.length === 0) return null

  // Healthy zone rect (>90)
  const yHealthyTop = yScale(100)
  const yHealthyBottom = yScale(90)
  const healthyZoneHeight = yHealthyBottom - yHealthyTop

  // Build health line path
  const healthPath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.score)}`)
    .join(' ')

  // Build area fill path (health line down to baseline)
  const areaPath = [
    ...data.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.score)}`),
    `L${xScale(data.length - 1)},${yScale(0)}`,
    `L${xScale(0)},${yScale(0)}`,
    'Z',
  ].join(' ')

  // Build avg dashed line path
  const avgPath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.avg)}`)
    .join(' ')

  // Gradient ID
  const gradId = 'health-area-grad'

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', maxWidth: W }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f6a3a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1f6a3a" stopOpacity="0.02" />
        </linearGradient>
      </defs>

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
            {v}
          </text>
        </g>
      ))}

      {/* Healthy zone */}
      <rect
        x={padLeft}
        y={yHealthyTop}
        width={chartW}
        height={healthyZoneHeight}
        fill="#1f6a3a"
        opacity="0.07"
      />
      <text
        x={padLeft + 6}
        y={yHealthyTop + 10}
        fontFamily="var(--font-mono)"
        fontSize="7"
        fill="#1f6a3a"
        letterSpacing="0.1em"
        opacity="0.7"
      >
        {'HEALTHY ZONE (>90)'}
      </text>

      {/* Area fill under health line */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Category average dashed line */}
      <path
        d={avgPath}
        fill="none"
        stroke="#a8a69b"
        strokeWidth="1"
        strokeDasharray="4 3"
      />

      {/* Health score solid line */}
      <path
        d={healthPath}
        fill="none"
        stroke="#1f6a3a"
        strokeWidth="2"
      />

      {/* Data point markers on health line */}
      {data.map((p, i) => (
        <circle
          key={i}
          cx={xScale(i)}
          cy={yScale(p.score)}
          r="2"
          fill="#1f6a3a"
        />
      ))}

      {/* X-axis month labels (show a subset) */}
      {data.map((p, i) => {
        // Show every 3rd label or first/last to avoid crowding
        if (i !== 0 && i !== data.length - 1 && i % 3 !== 0) return null
        return (
          <text
            key={i}
            x={xScale(i)}
            y={H - 6}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="7.5"
            fill="#72716a"
            letterSpacing="0.08em"
          >
            {p.month}
          </text>
        )
      })}

      {/* Legend */}
      <line
        x1={padLeft + chartW - 120}
        y1={padTop + 6}
        x2={padLeft + chartW - 108}
        y2={padTop + 6}
        stroke="#1f6a3a"
        strokeWidth="2"
      />
      <text
        x={padLeft + chartW - 104}
        y={padTop + 9}
        fontFamily="var(--font-mono)"
        fontSize="7"
        fill="#72716a"
        letterSpacing="0.06em"
      >
        HEALTH
      </text>

      <line
        x1={padLeft + chartW - 60}
        y1={padTop + 6}
        x2={padLeft + chartW - 48}
        y2={padTop + 6}
        stroke="#a8a69b"
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      <text
        x={padLeft + chartW - 44}
        y={padTop + 9}
        fontFamily="var(--font-mono)"
        fontSize="7"
        fill="#72716a"
        letterSpacing="0.06em"
      >
        AVG
      </text>
    </svg>
  )
}
