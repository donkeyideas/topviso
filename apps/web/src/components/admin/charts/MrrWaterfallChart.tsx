'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface WaterfallItem {
  label: string
  newMrr: number
  expansion: number
  contraction: number
  churned: number
}

interface MrrWaterfallChartProps {
  data: WaterfallItem[]
}

export function MrrWaterfallChart({ data }: MrrWaterfallChartProps) {
  const chartData = data.map((d) => ({
    name: d.label,
    new: d.newMrr,
    expansion: d.expansion,
    contraction: -d.contraction,
    churned: -d.churned,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} barCategoryGap="20%">
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#72716a' }}
          tickLine={false}
          axisLine={{ stroke: '#d8d3c4' }}
        />
        <YAxis
          tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#72716a' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip
          contentStyle={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            borderRadius: 4,
            border: '1px solid #d8d3c4',
          }}
          formatter={(value, name) => [
            `$${Math.abs(Number(value)).toLocaleString()}`,
            String(name).charAt(0).toUpperCase() + String(name).slice(1),
          ]}
        />
        <Bar dataKey="new" stackId="a" fill="#2a8c4e" radius={[2, 2, 0, 0]} />
        <Bar dataKey="expansion" stackId="a" fill="#0d7e87" />
        <Bar dataKey="contraction" stackId="b" fill="#b58300" />
        <Bar dataKey="churned" stackId="b" fill="#c43b1e" radius={[0, 0, 2, 2]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
