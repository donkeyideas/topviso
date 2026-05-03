'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

interface RadarScoreChartProps {
  data: { subject: string; score: number }[]
}

export function RadarScoreChart({ data }: RadarScoreChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid strokeDasharray="3 3" stroke="var(--color-line, #e5e5e0)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: 11, fill: 'var(--color-ink-3, #999)' }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: 'var(--color-ink-4, #bbb)' }}
        />
        <Radar
          dataKey="score"
          stroke="#27ae60"
          fill="#27ae60"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
