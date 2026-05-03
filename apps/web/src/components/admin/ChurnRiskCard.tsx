interface ChurnRiskCardProps {
  name: string
  avatarColor: string
  mrr: string
  health: number
  signals: string
  riskLevel: 'high' | 'watch'
}

export function ChurnRiskCard({ name, avatarColor, signals, riskLevel }: ChurnRiskCardProps) {
  const initial = name.charAt(0).toUpperCase()
  const badgeLabel = riskLevel === 'high' ? 'HIGH RISK' : 'WATCH'

  return (
    <div className="churn-risk-card">
      <div className="crc-head">
        <div className="crc-left">
          <div className="crc-avatar" style={{ background: avatarColor }}>{initial}</div>
          <div className="crc-name">{name}</div>
        </div>
        <span className={`crc-badge ${riskLevel}`}>{badgeLabel}</span>
      </div>
      <div className="crc-meta" dangerouslySetInnerHTML={{ __html: signals }} />
    </div>
  )
}
