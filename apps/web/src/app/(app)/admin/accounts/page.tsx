import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { EmptyMetric } from '@/components/admin/EmptyMetric'
import { getHealthScores, computeLtv, formatLtv, PLAN_PRICES } from '@/lib/admin/metrics'

export default async function AccountsPage() {
  const supabase = getSupabaseAdmin()

  /* ── 1. Parallel data fetch ── */
  const [
    healthMap,
    { data: orgs },
    { data: members },
    { data: apps },
    { data: analysisResults },
    { data: allProfiles },
  ] = await Promise.all([
    getHealthScores(supabase),
    supabase.from('organizations').select('id, name, slug, plan_tier, seat_limit, created_at, trial_ends_at').order('created_at', { ascending: false }),
    supabase.from('organization_members').select('organization_id, user_id, role'),
    supabase.from('apps').select('organization_id, id').eq('is_active', true),
    supabase.from('analysis_results').select('organization_id, created_at').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }),
  ])

  /* ── 2. Build lookup maps ── */
  const membersByOrg: Record<string, number> = {}
  const ownerByOrg: Record<string, string> = {}
  for (const m of members ?? []) {
    membersByOrg[m.organization_id] = (membersByOrg[m.organization_id] ?? 0) + 1
    if (m.role === 'owner') ownerByOrg[m.organization_id] = m.user_id
  }

  const appsByOrg: Record<string, number> = {}
  for (const a of apps ?? []) {
    appsByOrg[a.organization_id] = (appsByOrg[a.organization_id] ?? 0) + 1
  }

  // Owner profiles
  const ownerIds = [...new Set(Object.values(ownerByOrg))]
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', ownerIds)
    : { data: [] }
  const profileMap: Record<string, string> = {}
  for (const p of ownerProfiles ?? []) {
    profileMap[p.id] = p.full_name ?? '—'
  }

  // Last seen per org (batch from analysis_results)
  const lastSeenByOrg: Record<string, string> = {}
  const now = Date.now()
  for (const a of analysisResults ?? []) {
    if (!lastSeenByOrg[a.organization_id]) {
      // First occurrence = most recent (ordered desc)
      const diff = now - new Date(a.created_at).getTime()
      if (diff < 3600000) lastSeenByOrg[a.organization_id] = `${Math.round(diff / 60000)}m ago`
      else if (diff < 86400000) lastSeenByOrg[a.organization_id] = `${Math.round(diff / 3600000)}h ago`
      else lastSeenByOrg[a.organization_id] = `${Math.round(diff / 86400000)}d ago`
    }
  }

  /* ── 3. KPI calculations ── */
  const allOrgs = orgs ?? []
  const total = allOrgs.length
  const planCounts = { solo: 0, team: 0, enterprise: 0 }
  const planArr = { solo: 0, team: 0, enterprise: 0 }
  let trialCount = 0
  let trialConverted = 0

  for (const o of allOrgs) {
    const tier = o.plan_tier as keyof typeof planCounts
    planCounts[tier] = (planCounts[tier] ?? 0) + 1
    planArr[tier] = (planArr[tier] ?? 0) + (PLAN_PRICES[tier] ?? 0) * 12
    if (o.trial_ends_at) {
      if (o.plan_tier !== 'solo') trialConverted++
      else trialCount++
    }
  }

  const atRiskCount = allOrgs.filter(org => {
    const score = healthMap[org.id]?.healthScore
    return score != null && score < 40
  }).length

  const fmtArr = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`

  /* ── 4. Compute signals per org ── */
  function getSignal(org: typeof allOrgs[0]): { label: string; cls: string } {
    const health = healthMap[org.id]?.healthScore ?? null
    const tenure = Math.round((now - new Date(org.created_at).getTime()) / 86400000)

    // NEW: created within last 14 days
    if (tenure <= 14) return { label: 'NEW', cls: 'draft' }

    // JUST UPGRADED: paid plan + created recently (within 30 days)
    if (org.plan_tier !== 'solo' && tenure <= 30) return { label: '↑ JUST UPGRADED', cls: 'test' }

    if (health === null) return { label: '—', cls: '' }

    // Health-based signals
    if (health >= 90) return { label: '↑ STRONG', cls: 'ok' }
    if (health >= 80) return { label: '↑ EXPAND', cls: 'ok' }
    if (health >= 50) return { label: 'STABLE', cls: 'test' }
    if (health >= 30) return { label: 'WATCH', cls: 'warn-pill' }
    return { label: '↓ AT RISK', cls: 'warn' }
  }

  // Unattached users
  const attachedUserIds = new Set((members ?? []).map(m => m.user_id))
  const unattachedUsers = (allProfiles ?? []).filter(p => !attachedUserIds.has(p.id))

  return (
    <>
      <AdminPageHead
        category="Customers"
        title={<>Every <em>account</em>, ranked and scored.</>}
        subtitle="The entire book. Filter by plan, segment, health, owner, source. Click any row to jump to full 360°."
      />
      <div className="admin-content">

        {/* ── KPI STRIP ── */}
        <KpiGrid columns={6}>
          <KpiCard
            label="TOTAL"
            value={total.toLocaleString()}
            subtitle="paying + trial"
            variant="hl"
          />
          <KpiCard
            label="ENTERPRISE"
            value={planCounts.enterprise.toString()}
            subtitle={`${fmtArr(planArr.enterprise)} ARR`}
          />
          <KpiCard
            label="TEAM"
            value={planCounts.team.toString()}
            subtitle={`${fmtArr(planArr.team)} ARR`}
          />
          <KpiCard
            label="SOLO"
            value={planCounts.solo.toString()}
            subtitle={`${fmtArr(planArr.solo)} ARR`}
          />
          <KpiCard
            label="TRIAL"
            value={trialCount.toString()}
            subtitle={trialCount + trialConverted > 0 ? `${Math.round((trialConverted / (trialCount + trialConverted)) * 100)}% convert` : '—'}
          />
          <KpiCard
            label="AT RISK"
            value={atRiskCount.toString()}
            subtitle="health < 40"
            variant={atRiskCount > 0 ? 'warn-hl' : 'default'}
          />
        </KpiGrid>

        {/* ── ACCOUNTS TABLE ── */}
        <AdminCard title={<>All <em>accounts</em></>} tag={`${total} TOTAL`}>
          {!allOrgs.length ? (
            <EmptyMetric message="No accounts yet" hint="Organizations will appear here once users sign up." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Plan</th>
                  <th className="tn">Seats</th>
                  <th className="tn">MRR</th>
                  <th className="tn">Health</th>
                  <th className="tn">Churn Risk</th>
                  <th className="tn">LTV (P50)</th>
                  <th className="tn">Last Seen</th>
                  <th>Owner</th>
                  <th>Signals</th>
                </tr>
              </thead>
              <tbody>
                {allOrgs.map((org) => {
                  const ownerId = ownerByOrg[org.id]
                  const ownerName = ownerId ? profileMap[ownerId] ?? '—' : '—'
                  const health = healthMap[org.id]?.healthScore ?? null
                  const churn = healthMap[org.id]?.churnRisk ?? null
                  const tenureMonths = Math.max(1, Math.round((now - new Date(org.created_at).getTime()) / (30.44 * 86400000)))
                  const tenureDays = Math.round((now - new Date(org.created_at).getTime()) / 86400000)
                  const ltv = computeLtv(org.plan_tier, tenureMonths)
                  const orgMrr = PLAN_PRICES[org.plan_tier] ?? 0
                  const seats = membersByOrg[org.id] ?? 0
                  const seatLimit = org.seat_limit ?? '—'
                  const signal = getSignal(org)
                  const lastSeen = lastSeenByOrg[org.id] ?? '—'

                  const tenureLabel = tenureDays < 30 ? `${tenureDays}d` : `${tenureMonths}mo`

                  const healthColor =
                    health == null ? 'var(--color-ink-3)'
                    : health >= 80 ? 'var(--color-ok)'
                    : health >= 50 ? 'var(--color-gold, #b58300)'
                    : '#c43b1e'

                  return (
                    <tr
                      key={org.id}
                      style={health != null && health < 40 ? { background: 'var(--color-warn-wash)' } : undefined}
                    >
                      <td>
                        <Link
                          href={`/admin/accounts/${org.id}`}
                          style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}
                        >
                          {org.name}
                        </Link>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--color-ink-3)', letterSpacing: '0.04em', marginTop: 1 }}>
                          {org.plan_tier === 'enterprise' ? 'Agency' : 'Direct'} · {tenureLabel}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-pill ${org.plan_tier === 'enterprise' ? 'warn' : org.plan_tier === 'team' ? 'test' : 'draft'}`}>
                          {org.plan_tier.toUpperCase()}
                        </span>
                      </td>
                      <td className="tn" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {seats}/{seatLimit}
                      </td>
                      <td className="tn" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>
                        ${orgMrr.toLocaleString()}
                      </td>
                      <td className="tn">
                        {health != null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div className="health-bar-inline">
                              <div className="health-fill" style={{ width: `${health}%`, background: healthColor }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{health}</span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)' }}>—</span>
                        )}
                      </td>
                      <td className="tn">
                        {churn != null ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: churn > 30 ? '#c43b1e' : undefined }}>
                            {churn.toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)' }}>—</span>
                        )}
                      </td>
                      <td className="tn">
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{formatLtv(ltv)}</span>
                      </td>
                      <td className="tn" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {lastSeen}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {ownerName}
                      </td>
                      <td>
                        {signal.label !== '—' ? (
                          <span className={`admin-pill ${signal.cls}`} style={{ fontSize: 9, letterSpacing: '0.06em' }}>
                            {signal.label}
                          </span>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </AdminCard>

        {/* ── UNATTACHED USERS ── */}
        {unattachedUsers.length > 0 && (
          <AdminCard title={<>Unattached <em>Users</em></>} tag={`${unattachedUsers.length} USERS`}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.06em', marginBottom: 12, textTransform: 'uppercase' }}>
              Signed up but have not created or joined an organization.
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>User ID</th>
                  <th className="tn">Signed Up</th>
                </tr>
              </thead>
              <tbody>
                {unattachedUsers.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.full_name ?? '—'}</strong></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)' }}>
                      {u.id.slice(0, 8)}…
                    </td>
                    <td className="tn">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminCard>
        )}

      </div>
    </>
  )
}
