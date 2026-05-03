interface RetentionBarsChartProps {
  data: { modules: string; retention: number }[]
}

const BAR_COLORS = [
  '#c43b1e', // warn – for <50%
  '#b58300', // orange
  '#0d7e87', // teal
  '#1d3fd9', // blue
  '#4a5cc4', // blue-light
  '#0a1f8a', // accent-2 deep
]

function getBarColor(retention: number, index: number, total: number): string {
  if (retention < 50) return BAR_COLORS[0] ?? '#c43b1e'
  const gradientIndex = Math.min(
    Math.floor(((index) / Math.max(total - 1, 1)) * (BAR_COLORS.length - 2)) + 1,
    BAR_COLORS.length - 1
  )
  return BAR_COLORS[gradientIndex] ?? '#1d3fd9'
}

export function RetentionBarsChart({ data }: RetentionBarsChartProps) {
  return (
    <div>
      <div className="ret-bars">
        {data.map((item, i) => {
          const heightPct = Math.max(0, Math.min(100, ((item.retention - 40) / 60) * 100))
          const color = getBarColor(item.retention, i, data.length)

          return (
            <div key={item.modules} className="ret-bar-col">
              <div
                className="ret-bar"
                style={{
                  height: `${heightPct}%`,
                  background: color,
                }}
              >
                <div className="ret-label">{item.retention}%</div>
              </div>
              <div className="ret-bar-x">{item.modules}</div>
            </div>
          )
        })}
      </div>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--color-ink-3)',
          letterSpacing: '0.04em',
          lineHeight: 1.6,
          padding: '14px 10px 4px',
        }}
      >
        Customers using 4+ modules retain at 86%+. The rule of thumb: push every
        account to 4 modules by day 14.
      </p>
    </div>
  )
}
