'use client'

interface CohortRow {
  label: string
  size: number
  retention: number[]
}

interface CohortHeatmapProps {
  data: CohortRow[]
  months: string[]
}

function getColorClass(value: number | undefined): string {
  if (value === undefined) return 'c-0'
  if (value >= 130) return 'c-7'
  if (value >= 120) return 'c-6'
  if (value >= 100) return 'c-6'
  if (value >= 90) return 'c-5'
  if (value >= 80) return 'c-4'
  if (value >= 70) return 'c-3'
  if (value >= 50) return 'c-2'
  if (value > 0) return 'c-1'
  return 'c-0'
}

export function CohortHeatmap({ data, months }: CohortHeatmapProps) {
  return (
    <div className="cohort">
      <table>
        <thead>
          <tr>
            <th>Cohort (size)</th>
            {months.map((m) => (
              <th key={m}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.label}>
              <td>{row.label} ({row.size})</td>
              {months.map((_, mi) => {
                const val = mi < row.retention.length ? row.retention[mi] : undefined
                return (
                  <td key={mi} className={getColorClass(val)}>
                    {val !== undefined ? `${val}%` : '\u2014'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
