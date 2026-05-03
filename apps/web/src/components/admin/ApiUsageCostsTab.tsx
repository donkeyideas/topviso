'use client'

import { AdminCard } from '@/components/admin/AdminCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { DailyCostChart } from '@/components/admin/charts/DailyCostChart'

interface ProviderBreakdown {
  provider: string
  calls: number
  cost: number
  errors: number
}

interface ChartDataPoint {
  date: string
  cost: number
}

interface ApiUsageCostsTabProps {
  chartData: ChartDataPoint[]
  providerBreakdown: ProviderBreakdown[]
}

export function ApiUsageCostsTab({
  chartData,
  providerBreakdown,
}: ApiUsageCostsTabProps) {
  const totalCalls = providerBreakdown.reduce((s, p) => s + p.calls, 0)
  const totalCost = providerBreakdown.reduce((s, p) => s + p.cost, 0)
  const totalErrors = providerBreakdown.reduce((s, p) => s + p.errors, 0)

  const peakDay = chartData.reduce(
    (best, d) => (d.cost > best.cost ? d : best),
    { date: '\u2014', cost: 0 },
  )
  const avgPerDay =
    chartData.length > 0
      ? chartData.reduce((s, d) => s + d.cost, 0) / chartData.length
      : 0

  return (
    <>
      <SectionHead number="01" title="Provider Breakdown" />
      <AdminCard
        title={
          <>
            Provider <em>costs</em>
          </>
        }
        tag={`${providerBreakdown.length} PROVIDERS`}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th className="tn">Calls</th>
              <th className="tn">Errors</th>
              <th className="tn">Error Rate</th>
              <th className="tn">Cost</th>
            </tr>
          </thead>
          <tbody>
            {providerBreakdown.map((p) => (
              <tr key={p.provider}>
                <td>
                  <strong>{p.provider}</strong>
                </td>
                <td
                  className="tn"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  {p.calls.toLocaleString()}
                </td>
                <td
                  className="tn"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  {p.errors.toLocaleString()}
                </td>
                <td
                  className="tn"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  {p.calls > 0 ? ((p.errors / p.calls) * 100).toFixed(1) : '0.0'}%
                </td>
                <td
                  className="tn"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  ${p.cost.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr
              style={{
                borderTop: '2px solid var(--color-line)',
              }}
            >
              <td>
                <strong>Totals</strong>
              </td>
              <td
                className="tn"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
              >
                <strong>{totalCalls.toLocaleString()}</strong>
              </td>
              <td
                className="tn"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
              >
                <strong>{totalErrors.toLocaleString()}</strong>
              </td>
              <td
                className="tn"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
              >
                <strong>
                  {totalCalls > 0
                    ? ((totalErrors / totalCalls) * 100).toFixed(1)
                    : '0.0'}
                  %
                </strong>
              </td>
              <td
                className="tn"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
              >
                <strong>${totalCost.toFixed(4)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </AdminCard>

      <SectionHead number="02" title="Daily Cost Trend" />
      <AdminCard
        title={
          <>
            Cost <em>chart</em>
          </>
        }
        tag="30 DAYS"
      >
        <div
          style={{
            display: 'flex',
            gap: 24,
            padding: '0 0 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-ink-3)',
          }}
        >
          <span>
            Total calls:{' '}
            <strong style={{ color: 'var(--color-ink)' }}>
              {totalCalls.toLocaleString()}
            </strong>
          </span>
          <span>
            Peak day:{' '}
            <strong style={{ color: 'var(--color-ink)' }}>
              {peakDay.date} (${peakDay.cost.toFixed(4)})
            </strong>
          </span>
          <span>
            Avg/day:{' '}
            <strong style={{ color: 'var(--color-ink)' }}>
              ${avgPerDay.toFixed(4)}
            </strong>
          </span>
        </div>
        <DailyCostChart data={chartData} />
      </AdminCard>
    </>
  )
}
