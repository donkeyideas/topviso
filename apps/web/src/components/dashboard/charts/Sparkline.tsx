interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export function Sparkline({ data, color = 'var(--color-accent)', width = 200, height = 30 }: SparklineProps) {
  if (!data.length) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x} ${y}`
  })

  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={areaPath} fill={color} opacity={0.1} />
      <path d={linePath} stroke={color} strokeWidth={1.5} fill="none" />
    </svg>
  )
}
