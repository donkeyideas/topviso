interface BarFillProps {
  percent: number
  variant?: 'default' | 'accent' | 'ok' | 'warn' | 'gold'
}

export function BarFill({ percent, variant = 'default' }: BarFillProps) {
  const cls = variant === 'default' ? 'fill' : `fill ${variant}`
  return (
    <div className="bar">
      <div className={cls} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  )
}
