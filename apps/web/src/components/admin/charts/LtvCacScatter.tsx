'use client'

interface LtvCacScatterProps {
  data: { label: string; cac: number; ltv: number; customers: number }[]
}

export function LtvCacScatter({ data }: LtvCacScatterProps) {
  const W = 400
  const H = 260
  const padLeft = 52
  const padRight = 20
  const padTop = 20
  const padBottom = 40
  const chartW = W - padLeft - padRight
  const chartH = H - padTop - padBottom

  const maxCac = Math.max(...data.map(d => d.cac)) * 1.2
  const maxLtv = Math.max(...data.map(d => d.ltv)) * 1.15

  const xScale = (cac: number) => padLeft + (cac / maxCac) * chartW
  const yScale = (ltv: number) => padTop + chartH - (ltv / maxLtv) * chartH
  const rScale = (customers: number) => Math.max(4, Math.min(20, Math.sqrt(customers) * 0.8))

  const colors = ['#2a8c4e', '#0d7e87', '#1d3fd9', '#b58300', '#4a5cc4', '#c43b1e']

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* Grid lines */}
      {[500, 1000, 1500, 2000].map((v) => {
        const y = yScale(v)
        if (y < padTop || y > padTop + chartH) return null
        return (
          <g key={`y-${v}`}>
            <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="#d8d3c4" strokeWidth="0.5" />
            <text x={padLeft - 6} y={y + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="8" fill="#72716a">
              ${(v / 1000).toFixed(v >= 1000 ? 0 : 1)}K
            </text>
          </g>
        )
      })}

      {/* X axis */}
      <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} stroke="#d8d3c4" strokeWidth="0.5" />
      {[100, 300, 500].map((v) => {
        const x = xScale(v)
        if (x > padLeft + chartW) return null
        return (
          <text key={`x-${v}`} x={x} y={padTop + chartH + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="#72716a">
            ${v}
          </text>
        )
      })}

      {/* Axis labels */}
      <text x={padLeft + chartW / 2} y={H - 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="#72716a" letterSpacing="0.1em">
        CAC →
      </text>
      <text x={10} y={padTop + chartH / 2} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8" fill="#72716a" letterSpacing="0.1em" transform={`rotate(-90, 10, ${padTop + chartH / 2})`}>
        LTV →
      </text>

      {/* Bubbles */}
      {data.map((d, i) => {
        const cx = xScale(d.cac)
        const cy = yScale(d.ltv)
        const r = rScale(d.customers)
        return (
          <g key={d.label}>
            <circle cx={cx} cy={cy} r={r} fill={colors[i % colors.length]} opacity={0.7} />
            <text
              x={cx}
              y={cy - r - 4}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="7"
              fill="#0e0e0c"
              fontWeight="600"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
