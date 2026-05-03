'use client'

import { AdminCard } from '@/components/admin/AdminCard'

interface ApiCall {
  id: string
  created_at: string
  provider: string
  endpoint: string
  is_success: boolean
  latency_ms: number | null
  tokens_used: number | null
  cost_usd: number | null
  metadata: Record<string, unknown> | null
}

interface ApiCallHistoryTabProps {
  calls: ApiCall[]
}

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - then) / 1000)

  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export function ApiCallHistoryTab({ calls }: ApiCallHistoryTabProps) {
  if (!calls || calls.length === 0) {
    return (
      <AdminCard title="Call History" tag="0 ENTRIES">
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              marginBottom: 8,
              letterSpacing: '-0.02em',
            }}
          >
            No API calls recorded
          </div>
          <p
            style={{
              color: 'var(--color-ink-3)',
              fontSize: 13,
              maxWidth: 400,
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            API call logs will appear here once your application starts making
            requests to external providers.
          </p>
        </div>
      </AdminCard>
    )
  }

  return (
    <AdminCard
      title={
        <>
          Call <em>history</em>
        </>
      }
      tag={`${calls.length} ENTRIES`}
    >
      <table className="admin-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Provider</th>
            <th>Action</th>
            <th>Status</th>
            <th className="tn">Latency</th>
            <th className="tn">Tokens</th>
            <th className="tn">Cost</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const action =
              (call.metadata as Record<string, unknown> | null)?.action ??
              call.endpoint ??
              '\u2014'
            return (
              <tr key={call.id}>
                <td
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {relativeTime(call.created_at)}
                </td>
                <td>
                  <span className="admin-pill test">{call.provider}</span>
                </td>
                <td
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {action as string}
                </td>
                <td>
                  <span
                    className={`admin-pill ${call.is_success ? 'ok' : 'error'}`}
                  >
                    {call.is_success ? 'OK' : 'ERROR'}
                  </span>
                </td>
                <td
                  className="tn"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  {call.latency_ms != null ? `${call.latency_ms}ms` : '\u2014'}
                </td>
                <td
                  className="tn"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  {call.tokens_used != null
                    ? call.tokens_used.toLocaleString()
                    : '\u2014'}
                </td>
                <td
                  className="tn"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  {call.cost_usd != null
                    ? `$${call.cost_usd.toFixed(4)}`
                    : '\u2014'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </AdminCard>
  )
}
