interface RevBlockProps {
  name: string
  accentName?: boolean
  accounts: number
  price: string
  arr: string
  pctOfTotal: number
  growth: string
  barPct: number
  barColor?: string
}

export function RevBlock({
  name,
  accentName,
  accounts,
  price,
  arr,
  pctOfTotal,
  growth,
  barPct,
  barColor = '',
}: RevBlockProps) {
  const fillClass = `fill${barColor ? ` ${barColor}` : ''}`

  return (
    <div className="rev-block">
      <div className="rev-head">
        <div className="rev-name">{accentName ? <em>{name}</em> : name}</div>
        <div className="rev-meta">{accounts} accts &middot; {price}</div>
      </div>
      <div className="bar">
        <div className={fillClass} style={{ width: `${barPct}%` }} />
      </div>
      <div className="rev-stats">
        <span>ARR <b>{arr}</b></span>
        <span>{pctOfTotal}%</span>
        <span style={{ color: 'var(--color-ok)' }}>{growth}</span>
      </div>
    </div>
  )
}
