interface FunnelStageProps {
  label: string
  sublabel: string
  count: number
  maxCount: number
  rate: string
  rateLabel: string
  barVariant?: string
}

export function FunnelStage({
  label,
  sublabel,
  count,
  maxCount,
  rate,
  rateLabel,
  barVariant = '',
}: FunnelStageProps) {
  const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0
  const barClass = `funnel-bar${barVariant ? ` ${barVariant}` : ''}`

  return (
    <div className="funnel-stage">
      <div className="fs-label">
        {label}
        <small>{sublabel}</small>
      </div>
      <div className="funnel-bar-wrap">
        <div className={barClass} style={{ width: `${barWidth}%` }}>
          {count.toLocaleString()}
        </div>
      </div>
      <div className="fs-rate">
        {rate}
        <small>{rateLabel}</small>
      </div>
    </div>
  )
}
