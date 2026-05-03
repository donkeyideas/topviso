interface GeoRowProps {
  code: string
  name: string
  customers: number
  mrr: number
  delta: string
}

export function GeoRow({ code, name, customers, mrr, delta }: GeoRowProps) {
  const isNeg = delta.startsWith('\u2212') || delta.startsWith('-')
  const mrrFormatted = mrr >= 1000 ? `$${(mrr / 1000).toFixed(0)}K` : `$${mrr}`

  return (
    <div className="geo-row">
      <div className={`country-flag ${code}`}>{code.toUpperCase()}</div>
      <div className="geo-info">
        <strong>{name}</strong>
        <small>{customers} CUST</small>
      </div>
      <div className="geo-mrr">{mrrFormatted}</div>
      <div className={`geo-delta${isNeg ? ' neg' : ''}`}>{delta}</div>
    </div>
  )
}
