interface AreaChartProps {
  data: number[]
  labels?: string[]
  annotations?: Array<{ index: number; label: string }>
  color?: string
  height?: number
}

export function AreaChart({
  data,
  labels = [],
  annotations = [],
  color = 'var(--color-accent)',
  height = 240,
}: AreaChartProps) {
  const width = 800
  const padTop = 40
  const padBottom = 20

  if (!data.length) {
    return (
      <div className="chart-frame">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="var(--color-ink-3)" fontFamily="var(--font-mono)" fontSize="12">
            No data yet
          </text>
        </svg>
      </div>
    )
  }

  const max = Math.max(...data)
  const min = 0
  const range = max - min || 1
  const step = width / (data.length - 1)

  const toY = (v: number) => padTop + (1 - (v - min) / range) * (height - padTop - padBottom)

  const points = data.map((v, i) => `${i * step} ${toY(v)}`)
  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`

  // Grid lines
  const gridCount = 4
  const gridLines = Array.from({ length: gridCount }, (_, i) => {
    const y = padTop + (i / (gridCount - 1)) * (height - padTop - padBottom)
    const val = Math.round(max - (i / (gridCount - 1)) * range)
    return { y, val }
  })

  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <g stroke="var(--color-line-soft, #e4e0d3)" strokeWidth={1}>
          {gridLines.map((g, i) => (
            <line key={i} x1={0} y1={g.y} x2={width} y2={g.y} />
          ))}
        </g>

        {/* Grid labels */}
        <g fontFamily="JetBrains Mono" fontSize={10} fill="var(--color-ink-4)">
          {gridLines.map((g, i) => (
            <text key={i} x={6} y={g.y - 4}>{g.val}</text>
          ))}
        </g>

        {/* Area + line */}
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} />

        {/* Annotations */}
        {annotations.map((a, i) => {
          const x = a.index * step
          const y = toY(data[a.index]!)
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={5} fill={color} />
              <line x1={x} y1={y} x2={x} y2={padTop} stroke={color} strokeWidth={1} strokeDasharray="2 3" />
              <text x={x + 4} y={padTop - 4} fontFamily="Inter Tight" fontSize={11} fill={color}>{a.label}</text>
            </g>
          )
        })}

        {/* Bottom labels */}
        {labels.length > 0 && (
          <g fontFamily="JetBrains Mono" fontSize={10} fill="var(--color-ink-4)">
            {labels.map((l, i) => {
              const x = (i / (labels.length - 1)) * width
              return <text key={i} x={x} y={height - 2}>{l}</text>
            })}
          </g>
        )}
      </svg>
    </div>
  )
}
