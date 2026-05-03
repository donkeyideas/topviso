'use client'

interface SparklineChartProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export function SparklineChart({
  data,
  color = '#1d3fd9',
  width = 100,
  height = 24,
}: SparklineChartProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' L')

  return (
    <svg
      className="spark"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
    >
      <path d={`M${points}`} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}
