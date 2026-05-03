import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { EmptyMetric } from '@/components/admin/EmptyMetric'

const SEV_MAP: Record<string, { label: string; color: string }> = {
  sev1: { label: 'P1', color: '#c43b1e' },
  sev2: { label: 'P2', color: '#b58300' },
  sev3: { label: 'P3', color: '#1d3fd9' },
  sev4: { label: 'P4', color: 'var(--color-ink-3)' },
}

const STATUS_MAP: Record<string, string> = {
  investigating: 'INVESTIGATING',
  identified: 'IDENTIFIED',
  monitoring: 'MONITORING',
  resolved: 'RESOLVED',
  postmortem: 'POSTMORTEM',
}

interface Incident {
  id: string
  title: string
  description: string | null
  severity: string
  status: string
  started_at: string
  resolved_at: string | null
  postmortem_url: string | null
  created_at: string
}

export default async function IncidentsPage() {
  const supabase = getSupabaseAdmin()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: incidents } = await (supabase as any)
    .from('incidents')
    .select('id, title, description, severity, status, started_at, resolved_at, postmortem_url, created_at')
    .order('started_at', { ascending: false }) as { data: Incident[] | null }

  const all = incidents ?? []

  // Stats
  const open = all.filter(i => i.status === 'investigating' || i.status === 'identified' || i.status === 'monitoring').length
  const resolved = all.filter(i => i.status === 'resolved' || i.status === 'postmortem')

  // MTTR: mean time to resolve (for resolved incidents with both started_at and resolved_at)
  const resolvedWithTimes = resolved.filter(i => i.started_at && i.resolved_at)
  const durations = resolvedWithTimes.map(i => {
    const start = new Date(i.started_at).getTime()
    const end = new Date(i.resolved_at!).getTime()
    return Math.max(0, (end - start) / 60000) // minutes
  })
  const mttr = durations.length > 0
    ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
    : null
  const mttrLabel = mttr !== null ? `${mttr} min` : '—'

  // SLA breaches: incidents > 4h duration (240 min)
  const slaBreaches = durations.filter(d => d > 240).length

  // Split into T90D and older
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000)
  const recent = all.filter(i => new Date(i.started_at) >= ninetyDaysAgo)
  const totalCount = all.length

  return (
    <>
      <AdminPageHead
        category="Operations"
        title={<>What <em>broke</em>.</>}
        subtitle="Incident log, MTTR, post-mortems, SLA breach tracker."
        stamp={<>
          OPEN ·<br />
          <strong>{open}</strong>
          MTTR ·<br />
          <strong>{mttrLabel}</strong>
          SLA BREACHES ·<br />
          <strong>{slaBreaches}</strong>
        </>}
      />

      <div className="admin-content">
        {/* ── §01 INCIDENT LOG ── */}
        <SectionHead number="§01" title={<>Incident <em>log</em></>} />
        <AdminCard title={<>Incident <em>log</em></>} tag={recent.length > 0 ? `T90D · ${recent.length} INCIDENTS` : 'ALL TIME'}>
          {all.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th className="tn">Duration</th>
                  <th>Root Cause</th>
                  <th className="tn">Post-Mortem</th>
                </tr>
              </thead>
              <tbody>
                {all.map(i => {
                  const sev = SEV_MAP[i.severity] ?? SEV_MAP.sev3!
                  const startDate = new Date(i.started_at)
                  const when = startDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })

                  // Duration
                  let durationStr = '—'
                  if (i.resolved_at) {
                    const mins = Math.round((new Date(i.resolved_at).getTime() - startDate.getTime()) / 60000)
                    durationStr = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`
                  } else if (i.status !== 'resolved' && i.status !== 'postmortem') {
                    durationStr = 'ongoing'
                  }

                  // Post-mortem status
                  const hasPostmortem = !!i.postmortem_url || i.status === 'postmortem'
                  const pmLabel = hasPostmortem ? 'PUBLISHED' : i.status === 'resolved' ? 'PENDING' : '—'

                  return (
                    <tr key={i.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{when}</td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          background: sev.color,
                          color: '#fff',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 3,
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                        }}>
                          {sev.label}
                        </span>
                      </td>
                      <td><strong>{i.title}</strong></td>
                      <td className="tn" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{durationStr}</td>
                      <td style={{ fontSize: 12, color: 'var(--color-ink-2, var(--color-ink))' }}>
                        {i.description ?? '—'}
                      </td>
                      <td className="tn">
                        {hasPostmortem ? (
                          i.postmortem_url ? (
                            <a
                              href={i.postmortem_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-pill ok"
                              style={{ fontSize: 9, textDecoration: 'none' }}
                            >
                              PUBLISHED
                            </a>
                          ) : (
                            <span className="admin-pill ok" style={{ fontSize: 9 }}>PUBLISHED</span>
                          )
                        ) : pmLabel === 'PENDING' ? (
                          <span className="admin-pill test" style={{ fontSize: 9 }}>PENDING</span>
                        ) : (
                          <span style={{ color: 'var(--color-ink-4)', fontSize: 11 }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <EmptyMetric
              message="No incidents recorded"
              hint="Incidents will appear here when added to the incidents table. All systems operational."
            />
          )}
        </AdminCard>

        {/* ── §02 MTTR & SLA ── */}
        <SectionHead number="§02" title={<>MTTR &amp; <em>SLA compliance</em></>} />
        <div className="admin-grid-2">
          <AdminCard title={<>Mean time to <em>resolve</em></>} tag="MTTR">
            {resolvedWithTimes.length > 0 ? (
              <div style={{ padding: '16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 400, letterSpacing: '-0.03em' }}>
                    {mttr}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)', letterSpacing: '0.1em' }}>
                    MINUTES
                  </span>
                </div>
                {/* Per-severity MTTR */}
                {(['sev1', 'sev2', 'sev3', 'sev4'] as const).map(sev => {
                  const sevIncidents = resolvedWithTimes.filter(i => i.severity === sev)
                  if (sevIncidents.length === 0) return null
                  const sevDurations = sevIncidents.map(i =>
                    Math.round((new Date(i.resolved_at!).getTime() - new Date(i.started_at).getTime()) / 60000)
                  )
                  const sevMttr = Math.round(sevDurations.reduce((s, d) => s + d, 0) / sevDurations.length)
                  const sevInfo = SEV_MAP[sev]!
                  return (
                    <div key={sev} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--color-line)', fontSize: 12 }}>
                      <span>
                        <span style={{
                          display: 'inline-block',
                          background: sevInfo.color,
                          color: '#fff',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          padding: '1px 6px',
                          borderRadius: 3,
                          fontWeight: 700,
                          marginRight: 8,
                        }}>
                          {sevInfo.label}
                        </span>
                        {sevIncidents.length} incident{sevIncidents.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{sevMttr}m avg</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyMetric message="No resolved incidents yet" hint="MTTR calculates from started_at to resolved_at." />
            )}
          </AdminCard>

          <AdminCard title={<>SLA <em>compliance</em></>} tag={`${slaBreaches} BREACHES`}>
            <div style={{ padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 400, letterSpacing: '-0.03em', color: slaBreaches === 0 ? 'var(--color-ok)' : 'var(--color-warn)' }}>
                  {totalCount > 0 ? Math.round(((totalCount - slaBreaches) / totalCount) * 100) : 100}%
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)', letterSpacing: '0.1em' }}>
                  COMPLIANCE
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--color-line)', fontSize: 12 }}>
                <span style={{ color: 'var(--color-ink-3)' }}>Total incidents</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{totalCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--color-line)', fontSize: 12 }}>
                <span style={{ color: 'var(--color-ink-3)' }}>Resolved within SLA (&lt;4h)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-ok)' }}>{durations.filter(d => d <= 240).length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--color-line)', fontSize: 12 }}>
                <span style={{ color: 'var(--color-ink-3)' }}>SLA breaches (&gt;4h)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: slaBreaches > 0 ? 'var(--color-warn)' : 'var(--color-ok)' }}>{slaBreaches}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--color-line)', fontSize: 12 }}>
                <span style={{ color: 'var(--color-ink-3)' }}>Post-mortems published</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {all.filter(i => i.postmortem_url || i.status === 'postmortem').length}
                </span>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </>
  )
}
