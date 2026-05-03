'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DailyCostChartProps {
  data: { date: string; cost: number }[]
}

export function DailyCostChart({ data }: DailyCostChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-ink-3)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}
      >
        No cost data available for the selected period.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => {
            const parts = v.split('-')
            return `${parts[1]}-${parts[2]}`
          }}
          tick={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            fill: '#72716a',
          }}
          axisLine={{ stroke: 'var(--color-line)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `$${v.toFixed(2)}`}
          tick={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fill: '#72716a',
          }}
          axisLine={false}
          tickLine={false}
          width={54}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`$${Number(value).toFixed(4)}`, 'Cost']}
          labelFormatter={(label: any) => {
            const parts = String(label).split('-')
            return `${parts[1]}-${parts[2]}`
          }}
          contentStyle={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            background: 'var(--color-card)',
            border: '1px solid var(--color-line)',
            borderRadius: 6,
          }}
        />
        <Bar dataKey="cost" fill="#1d3fd9" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
