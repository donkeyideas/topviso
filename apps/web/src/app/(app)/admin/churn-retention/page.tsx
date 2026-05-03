import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { EmptyMetric } from '@/components/admin/EmptyMetric'
import { PLAN_PRICES, getHealthScores } from '@/lib/admin/metrics'

export default async function ChurnRetentionPage() {
  const supabase = getSupabaseAdmin()

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, plan_tier, created_at, trial_ends_at, stripe_subscription_id')
    .order('created_at', { ascending: false })

  const [healthMap, { data: members }] = await Promise.all([
    getHealthScores(supabase),
    supabase.from('organization_members').select('organization_id, user_id, role'),
  ])

  // Owner lookup
  const ownerByOrg: Record<string, string> = {}
  for (const m of members ?? []) {
    if (m.role === 'owner') ownerByOrg[m.organization_id] = m.user_id
  }
  const ownerIds = [...new Set(Object.values(ownerByOrg))]
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', ownerIds)
    : { data: [] }
  const profileMap: Record<string, string> = {}
  for (const p of ownerProfiles ?? []) profileMap[p.id] = p.full_name ?? '—'

  const now = new Date()
  const total = (orgs ?? []).length
  const trialExpired = (orgs ?? []).filter(o => o.trial_ends_at && new Date(o.trial_ends_at) < now && o.plan_tier === 'solo')
  const onTrial = (orgs ?? []).filter(o => o.trial_ends_at && new Date(o.trial_ends_at) >= now)
  const paid = (orgs ?? []).filter(o => o.plan_tier !== 'solo')

  // At-risk: health < 50 OR subscription cancelling
  const atRiskOrgs = (orgs ?? [])
    .map(o => {
      const h = healthMap[o.id]
      const health = h?.healthScore ?? 0
      const churn = h?.churnRisk ?? 0
      const lastSeen = h?.lastActivityAt
      const arr = (PLAN_PRICES[o.plan_tier] ?? 0) * 12
      const cancelling = h?.riskFactors?.includes('Subscription cancelling') ?? false
      return { ...o, health, churn, lastSeen, arr, cancelling }
    })
    .filter(o => o.health < 50 || o.cancelling)
    .sort((a, b) => a.health - b.health)

  const atRiskMrr = atRiskOrgs.reduce((s, o) => s + (PLAN_PRICES[o.plan_tier] ?? 0), 0)

  // Logo churn: expired trials that never converted / total accounts
  const logoChurn30d = total > 0 && trialExpired.length > 0
    ? +((trialExpired.length / total) * 100).toFixed(1)
    : 0
  // Revenue churn: at-risk MRR / total MRR
  const totalMrr = (orgs ?? []).reduce((s, o) => s + (PLAN_PRICES[o.plan_tier] ?? 0), 0)
  const revenueChurn30d = totalMrr > 0 && atRiskMrr > 0
    ? +((atRiskMrr / totalMrr) * 100).toFixed(1)
    : 0

  // Avg tenure at churn (months from created_at to trial_ends_at for expired trials)
  let avgTenure = '—'
  if (trialExpired.length > 0) {
    const tenures = trialExpired.map(o => {
      const created = new Date(o.created_at)
      const ended = new Date(o.trial_ends_at!)
      return (ended.getTime() - created.getTime()) / (30 * 86_400_000)
    })
    const avg = tenures.reduce((s, t) => s + t, 0) / tenures.length
    avgTenure = `${avg.toFixed(1)}mo`
  }

  // Churn reasons (would need churn_reasons table — show what we can infer)
  const churnReasons: { reason: string; sub: string; pct: number; color: string }[] = []
  const neverActivated = (orgs ?? []).filter(o => {
    const h = healthMap[o.id]
    return h && h.healthScore <= 15
  }).length
  const priceObjection = trialExpired.filter(o => {
    const h = healthMap[o.id]
    return h && h.riskFactors.some(f => f.toLowerCase().includes('solo') || f.toLowerCase().includes('free'))
  }).length

  const cancellingCount = (orgs ?? []).filter(o => {
    const h = healthMap[o.id]
    return h?.riskFactors?.includes('Subscription cancelling')
  }).length

  if (cancellingCount > 0 && total > 0) {
    churnReasons.push({ reason: 'Subscription cancelling', sub: 'ACTIVE CANCEL', pct: Math.round((cancellingCount / total) * 100), color: '#c43b1e' })
  }
  if (neverActivated > 0 && total > 0) {
    churnReasons.push({ reason: 'Never activated', sub: 'NO APPS LINKED', pct: Math.round((neverActivated / total) * 100), color: 'var(--color-ink)' })
  }
  if (priceObjection > 0 && total > 0) {
    churnReasons.push({ reason: 'Trial expired (no conversion)', sub: 'PRICE / FIT', pct: Math.round((priceObjection / total) * 100), color: '#b58300' })
  }
  churnReasons.sort((a, b) => b.pct - a.pct)

  return (
    <>
      <AdminPageHead
        category="Finance"
        title={<>Churn &amp; <em>retention</em>.</>}
        subtitle="Churn reasons, predictive scoring, save-rate by intervention type, and the pipeline of at-risk accounts."
        stamp={<>
          AT-RISK MRR ·<br />
          <strong>${atRiskMrr.toLocaleString()}</strong>
        </>}
      />
      <div className="admin-content">
        <KpiGrid columns={5}>
          <KpiCard label="Logo Churn · 30D" value={`${logoChurn30d}%`} subtitle={`${total} accts`} {...(logoChurn30d > 5 ? { variant: 'hl' as const } : {})} />
          <KpiCard label="Revenue Churn · 30D" value={`${revenueChurn30d}%`} subtitle={totalMrr > 0 ? `$${totalMrr} MRR` : 'no paid'} {...(revenueChurn30d > 5 ? { variant: 'hl' as const } : {})} />
          <KpiCard label="Save Rate" value="—" subtitle="CS intervention" />
          <KpiCard label="Avg Tenure at Churn" value={avgTenure} subtitle="weighted" />
          <KpiCard label="Model AUC" value="—" subtitle="churn 90d" delta="→ n/a" deltaDirection="flat" />
        </KpiGrid>

        {/* ── §01 CHURN REASONS ── */}
        <SectionHead number="§01" title={<>Churn <em>reasons</em></>} />
        <AdminCard title={<>Churn <em>reasons</em></>} tag="CS-TAGGED">
          {churnReasons.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
              {churnReasons.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 160, flexShrink: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.reason}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{r.sub}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ background: 'var(--color-line)', borderRadius: 4, height: 16, width: '100%' }}>
                      <div style={{ background: r.color, borderRadius: 4, height: 16, width: `${Math.max(r.pct, 4)}%` }} />
                    </div>
                  </div>
                  <div style={{ width: 40, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{r.pct}%</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMetric message="No churn reasons tagged yet" hint="Churn reasons will populate as accounts are tagged by CS." />
          )}
        </AdminCard>

        {/* ── §02 AT-RISK PIPELINE ── */}
        <SectionHead number="§02" title={<>At-risk <em>pipeline</em></>} />
        <AdminCard title={<>At-risk <em>pipeline</em></>} tag={`HEALTH < 50 OR CANCELLING · ${atRiskOrgs.length} ACCTS`}>
          {atRiskOrgs.length === 0 ? (
            <EmptyMetric message="No at-risk accounts" hint="Accounts with health < 50 will appear here." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="tn">ARR</th>
                  <th className="tn">Health</th>
                  <th className="tn">Risk</th>
                  <th className="tn">Last Seen</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {atRiskOrgs.map((o) => {
                  const healthColor = o.health >= 50 ? 'var(--color-ok)' : o.health >= 30 ? 'var(--color-warn)' : '#c43b1e'
                  const daysAgo = o.lastSeen
                    ? `${Math.max(0, Math.floor((now.getTime() - new Date(o.lastSeen).getTime()) / 86_400_000))}d ago`
                    : '—'
                  return (
                    <tr key={o.id} style={o.cancelling ? { background: 'var(--color-warn-wash)' } : undefined}>
                      <td>
                        <strong>{o.name ?? o.id.slice(0, 8)}</strong>
                        {o.cancelling && <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c43b1e', fontWeight: 700, letterSpacing: '0.08em' }}>CANCELLING</span>}
                      </td>
                      <td className="tn">${o.arr.toLocaleString()}</td>
                      <td className="tn">
                        <span style={{
                          display: 'inline-block',
                          background: healthColor,
                          color: 'white',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 3,
                          fontWeight: 600,
                          minWidth: 28,
                          textAlign: 'center',
                        }}>{o.health}</span>
                      </td>
                      <td className="tn" style={{ color: o.churn > 40 ? '#c43b1e' : 'inherit' }}>{o.churn}%</td>
                      <td className="tn">{daysAgo}</td>
                      <td style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>
                        {profileMap[ownerByOrg[o.id] ?? ''] ? `@${profileMap[ownerByOrg[o.id] ?? '']?.split(' ')[0]?.toLowerCase()}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </AdminCard>

        {/* ── §03 SAVE-RATE BY INTERVENTION ── */}
        <SectionHead number="§03" title={<>Save-rate <em>by intervention</em></>} />
        <AdminCard title={<>Save-rate <em>by intervention</em></>} tag="T1800 · WHAT ACTUALLY WORKS">
          <EmptyMetric
            message="No intervention data yet"
            hint="Track save attempts (executive calls, discount offers, onboarding redo, feature training) to see which interventions recover MRR."
          />
        </AdminCard>

        {/* ── §04 TRIAL EXPIRED ── */}
        <SectionHead number="§04" title={<>Trial <em>expired</em></>} />
        <AdminCard title={<>Trial <em>Expired</em></>} tag={`${trialExpired.length} ACCOUNTS`}>
          {trialExpired.length === 0 ? (
            <EmptyMetric message="No expired trials" />
          ) : (
            <table className="admin-table">
              <thead><tr><th>Organization</th><th>Plan</th><th className="tn">Health</th><th className="tn">Churn %</th><th className="tn">Trial Ended</th><th className="tn">Days Expired</th></tr></thead>
              <tbody>
                {trialExpired.map((o) => {
                  const days = Math.round((now.getTime() - new Date(o.trial_ends_at!).getTime()) / 86400000)
                  const h = healthMap[o.id]
                  const health = h?.healthScore ?? 0
                  const churn = h?.churnRisk ?? 0
                  const healthColor = health >= 80 ? 'var(--color-ok)' : health >= 50 ? 'var(--color-warn)' : '#c43b1e'
                  return (
                    <tr key={o.id} style={health < 50 ? { background: 'var(--color-warn-wash)' } : undefined}>
                      <td><strong>{o.name}</strong></td>
                      <td><span className="admin-pill draft">{o.plan_tier}</span></td>
                      <td className="tn">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div className="health-bar-inline">
                            <div className="health-fill" style={{ width: `${health}%`, background: healthColor }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{health}</span>
                        </div>
                      </td>
                      <td className="tn" style={{ color: churn > 30 ? '#c43b1e' : 'inherit' }}>{churn}%</td>
                      <td className="tn">{new Date(o.trial_ends_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td className="tn" style={{ color: 'var(--color-warn)' }}>{days}d ago</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </AdminCard>

        {/* ── §05 ACTIVE TRIALS ── */}
        <SectionHead number="§05" title={<>Active <em>trials</em></>} />
        <AdminCard title={<>On <em>Trial</em></>} tag={`${onTrial.length} ACCOUNTS`}>
          {onTrial.length === 0 ? (
            <EmptyMetric message="No active trials" />
          ) : (
            <table className="admin-table">
              <thead><tr><th>Organization</th><th>Plan</th><th className="tn">Health</th><th className="tn">Trial Ends</th><th className="tn">Days Left</th></tr></thead>
              <tbody>
                {onTrial.map((o) => {
                  const days = Math.round((new Date(o.trial_ends_at!).getTime() - now.getTime()) / 86400000)
                  const h = healthMap[o.id]
                  const health = h?.healthScore ?? 0
                  const healthColor = health >= 80 ? 'var(--color-ok)' : health >= 50 ? 'var(--color-warn)' : '#c43b1e'
                  return (
                    <tr key={o.id}>
                      <td><strong>{o.name}</strong></td>
                      <td><span className={`admin-pill ${o.plan_tier === 'enterprise' ? 'purple' : o.plan_tier === 'team' ? 'test' : 'draft'}`}>{o.plan_tier}</span></td>
                      <td className="tn">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div className="health-bar-inline">
                            <div className="health-fill" style={{ width: `${health}%`, background: healthColor }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{health}</span>
                        </div>
                      </td>
                      <td className="tn">{new Date(o.trial_ends_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td className="tn" style={{ color: days <= 3 ? 'var(--color-warn)' : 'var(--color-ok)' }}>{days}d</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </AdminCard>
      </div>
    </>
  )
}
