interface KpiCardProps {
  label: string
  value: string
  subtitle?: string
  delta?: string
  deltaDirection?: 'up' | 'down' | 'flat'
  variant?: 'default' | 'hl' | 'warn-hl' | 'ok-hl'
  miniTag?: string
  miniTagLive?: boolean
  small?: boolean
  sparkline?: React.ReactNode
}

export function KpiCard({
  label,
  value,
  subtitle,
  delta,
  deltaDirection = 'up',
  variant = 'default',
  miniTag,
  miniTagLive,
  small,
  sparkline,
}: KpiCardProps) {
  const variantClass = variant === 'default' ? '' : ` ${variant}`
  const deltaClass =
    deltaDirection === 'down' ? 'delta down' : deltaDirection === 'flat' ? 'delta flat' : 'delta'

  return (
    <div className={`kpi${variantClass}`}>
      <div className="lbl">
        {label}
        {miniTag && (
          <span className={`mini-tag${miniTagLive ? ' live' : ''}`}>{miniTag}</span>
        )}
      </div>
      <div className={`val${small ? ' sm' : ''}`}>{value}</div>
      {(subtitle || delta) && (
        <div className="sub">
          <span>{subtitle}</span>
          {delta && <span className={deltaClass}>{delta}</span>}
        </div>
      )}
      {sparkline}
    </div>
  )
}

interface KpiGridProps {
  columns?: 4 | 5 | 6
  children: React.ReactNode
}

export function KpiGrid({ columns = 4, children }: KpiGridProps) {
  const cls = columns === 4 ? 'kpi-grid' : `kpi-grid g${columns}`
  return <div className={cls}>{children}</div>
}
