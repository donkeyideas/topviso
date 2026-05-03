import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { EditablePricing } from '@/components/admin/EditablePricing'
import { PlanMixStack } from '@/components/admin/PlanMixStack'
import { getPlanConfig, getPlanPrices } from '@/lib/plan-config'

const PLAN_PILL: Record<string, string> = {
  solo: 'draft',
  team: 'test',
  enterprise: 'warn',
}

function utilColor(pct: number): string {
  if (pct >= 90) return 'var(--color-warn)'
  if (pct >= 70) return 'var(--color-ink-2)'
  return 'var(--color-ok)'
}

function utilBarClass(pct: number): string {
  if (pct >= 90) return 'fill warn'
  if (pct >= 70) return 'fill gold'
  return 'fill ok'
}

export default async function PricingAdminPage() {
  const supabase = getSupabaseAdmin()

  const [config, prices, { data: orgs }, { data: apps }, { data: keywords }, { data: members }] =
    await Promise.all([
      getPlanConfig(),
      getPlanPrices(),
      supabase
        .from('organizations')
        .select('id, name, plan_tier, app_limit, seat_limit, trial_ends_at, created_at'),
      supabase.from('apps').select('organization_id, is_active'),
      supabase.from('keywords').select('organization_id'),
      supabase.from('organization_members').select('organization_id'),
    ])

  const allOrgs = (orgs ?? []) as {
    id: string
    name: string
    plan_tier: string
    app_limit: number
    seat_limit: number
    keyword_limit?: number
    trial_ends_at: string | null
    created_at: string
  }[]

  // ── KPI computations ──
  const planCounts: Record<string, number> = { solo: 0, team: 0, enterprise: 0 }
  let mrr = 0
  const nowDate = new Date()
  let trialActive = 0

  for (const o of allOrgs) {
    const tier = o.plan_tier ?? 'solo'
    planCounts[tier] = (planCounts[tier] ?? 0) + 1
    mrr += prices[tier] ?? 0
    if (o.trial_ends_at && new Date(o.trial_ends_at) > nowDate) trialActive++
  }

  const totalOrgs = allOrgs.length
  const paidCount = totalOrgs - (planCounts['solo'] ?? 0)
  const arpu = paidCount > 0 ? Math.round(mrr / paidCount) : 0
  const conversionPct = totalOrgs > 0 ? +((paidCount / totalOrgs) * 100).toFixed(1) : 0

  const teamMrr = (planCounts['team'] ?? 0) * (prices['team'] ?? 0)
  const entMrr = (planCounts['enterprise'] ?? 0) * (prices['enterprise'] ?? 0)

  // ── Per-org resource counts ──
  const appsByOrg: Record<string, number> = {}
  for (const a of apps ?? []) {
    if (a.is_active) appsByOrg[a.organization_id] = (appsByOrg[a.organization_id] ?? 0) + 1
  }

  const kwByOrg: Record<string, number> = {}
  for (const k of keywords ?? []) {
    kwByOrg[k.organization_id] = (kwByOrg[k.organization_id] ?? 0) + 1
  }

  const membersByOrg: Record<string, number> = {}
  for (const m of members ?? []) {
    membersByOrg[m.organization_id] = (membersByOrg[m.organization_id] ?? 0) + 1
  }

  // ── Per-tier utilization averages ──
  const tierStats: Record<string, { count: number; avgApps: number; avgAppLimit: number; avgKw: number; avgKwLimit: number; avgSeats: number; avgSeatLimit: number }> = {}

  for (const tier of ['solo', 'team', 'enterprise'] as const) {
    const tierOrgs = allOrgs.filter(o => o.plan_tier === tier)
    const count = tierOrgs.length
    if (count === 0) {
      tierStats[tier] = { count: 0, avgApps: 0, avgAppLimit: 0, avgKw: 0, avgKwLimit: 0, avgSeats: 0, avgSeatLimit: 0 }
      continue
    }
    const sumApps = tierOrgs.reduce((s, o) => s + (appsByOrg[o.id] ?? 0), 0)
    const sumAppLimit = tierOrgs.reduce((s, o) => s + (o.app_limit ?? 1), 0)
    const sumKw = tierOrgs.reduce((s, o) => s + (kwByOrg[o.id] ?? 0), 0)
    const sumKwLimit = tierOrgs.reduce((s, o) => s + (o.keyword_limit ?? config[tier].keywords), 0)
    const sumSeats = tierOrgs.reduce((s, o) => s + (membersByOrg[o.id] ?? 0), 0)
    const sumSeatLimit = tierOrgs.reduce((s, o) => s + (o.seat_limit ?? 1), 0)
    tierStats[tier] = {
      count,
      avgApps: +(sumApps / count).toFixed(1),
      avgAppLimit: +(sumAppLimit / count).toFixed(0),
      avgKw: +(sumKw / count).toFixed(0),
      avgKwLimit: +(sumKwLimit / count).toFixed(0),
      avgSeats: +(sumSeats / count).toFixed(1),
      avgSeatLimit: +(sumSeatLimit / count).toFixed(0),
    }
  }

  // ── Per-org utilization rows sorted by max utilization ──
  const orgRows = allOrgs.map(o => {
    const usedApps = appsByOrg[o.id] ?? 0
    const limitApps = o.app_limit ?? 1
    const usedKw = kwByOrg[o.id] ?? 0
    const limitKw = o.keyword_limit ?? config[o.plan_tier as 'solo' | 'team' | 'enterprise']?.keywords ?? 50
    const usedSeats = membersByOrg[o.id] ?? 0
    const limitSeats = o.seat_limit ?? 1

    const pctApps = limitApps > 0 ? (usedApps / limitApps) * 100 : 0
    const pctKw = limitKw > 0 ? (usedKw / limitKw) * 100 : 0
    const pctSeats = limitSeats > 0 ? (usedSeats / limitSeats) * 100 : 0
    const maxPct = Math.max(pctApps, pctKw, pctSeats)

    return {
      id: o.id,
      name: o.name,
      plan: o.plan_tier ?? 'solo',
      usedApps, limitApps, pctApps,
      usedKw, limitKw, pctKw,
      usedSeats, limitSeats, pctSeats,
      maxPct,
    }
  }).sort((a, b) => b.maxPct - a.maxPct)

  // ── Editable tiers ──
  const tiers = (['solo', 'team', 'enterprise'] as const).map(key => ({
    key,
    name: config[key].name,
    priceMonthly: config[key].priceMonthly,
    apps: config[key].apps,
    keywords: config[key].keywords,
    seats: config[key].seats,
  }))

  const planMixData = {
    solo: { count: planCounts['solo'] ?? 0, mrr: 0 },
    team: { count: planCounts['team'] ?? 0, mrr: teamMrr },
    enterprise: { count: planCounts['enterprise'] ?? 0, mrr: entMrr },
  }

  const fmtK = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`

  return (
    <>
      <AdminPageHead
        category="Finance"
        title={<>Pricing <em>configuration</em>.</>}
        subtitle="Plan tiers, prices, and resource limits. Changes reflect on the homepage and enforce at runtime."
      />
      <div className="admin-content">

        {/* ────── KPI STRIP ────── */}
        <KpiGrid columns={5}>
          <KpiCard
            label="MRR"
            value={fmtK(mrr)}
            variant="hl"
            miniTag="LIVE"
            miniTagLive
            subtitle={`${totalOrgs} accounts`}
          />
          <KpiCard
            label="PAID ACCOUNTS"
            value={String(paidCount)}
            subtitle={`of ${totalOrgs} total`}
          />
          <KpiCard
            label="BLENDED ARPU"
            value={paidCount > 0 ? `$${arpu}` : '—'}
            subtitle="Paid only"
          />
          <KpiCard
            label="FREE → PAID %"
            value={`${conversionPct}%`}
            variant={conversionPct >= 10 ? 'ok-hl' : 'default'}
            subtitle="Conversion rate"
          />
          <KpiCard
            label="ACTIVE TRIALS"
            value={String(trialActive)}
            subtitle="Not yet expired"
          />
        </KpiGrid>

        {/* ────── §01  PLAN TIERS ────── */}
        <SectionHead index="01" title="Plan Tiers" />
        <AdminCard title={<>Plan <em>pricing &amp; limits</em></>} tag="EDITABLE">
          <EditablePricing tiers={tiers} />
        </AdminCard>

        {/* ────── §02  PLAN DISTRIBUTION ────── */}
        <SectionHead index="02" title={<>Plan <em>distribution</em></>} />
        <div className="admin-grid-2">
          <AdminCard title={<>Customers by <em>plan</em></>} tag="MRR SPLIT">
            <PlanMixStack data={planMixData} />
          </AdminCard>

          <AdminCard title={<>Resource <em>utilization</em> by plan</>} tag="AVG PER TIER">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>PLAN</th>
                  <th className="tn">ACCOUNTS</th>
                  <th className="tn">AVG APPS</th>
                  <th className="tn">AVG KEYWORDS</th>
                  <th className="tn">AVG SEATS</th>
                </tr>
              </thead>
              <tbody>
                {(['solo', 'team', 'enterprise'] as const).map(tier => {
                  const s = tierStats[tier]!
                  const appPct = s.avgAppLimit > 0 ? (s.avgApps / s.avgAppLimit) * 100 : 0
                  const kwPct = s.avgKwLimit > 0 ? (s.avgKw / s.avgKwLimit) * 100 : 0
                  const seatPct = s.avgSeatLimit > 0 ? (s.avgSeats / s.avgSeatLimit) * 100 : 0
                  return (
                    <tr key={tier}>
                      <td>
                        <span className={`admin-pill ${PLAN_PILL[tier]}`}>
                          {tier.toUpperCase()}
                        </span>
                      </td>
                      <td className="tn"><strong>{s.count}</strong></td>
                      <td className="tn" style={{ color: utilColor(appPct) }}>
                        {s.avgApps} / {s.avgAppLimit} ({appPct.toFixed(0)}%)
                      </td>
                      <td className="tn" style={{ color: utilColor(kwPct) }}>
                        {s.avgKw} / {s.avgKwLimit} ({kwPct.toFixed(0)}%)
                      </td>
                      <td className="tn" style={{ color: utilColor(seatPct) }}>
                        {s.avgSeats} / {s.avgSeatLimit} ({seatPct.toFixed(0)}%)
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </AdminCard>
        </div>

        {/* ────── §03  PER-ORG LIMIT USAGE ────── */}
        <SectionHead index="03" title={<>Account-level <em>limit usage</em></>} />
        <AdminCard title={<>Per-account <em>utilization</em></>} tag={`${orgRows.length} ACCOUNTS`}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ORGANIZATION</th>
                <th>PLAN</th>
                <th className="tn">APPS</th>
                <th className="tn">KEYWORDS</th>
                <th className="tn">SEATS</th>
              </tr>
            </thead>
            <tbody>
              {orgRows.map(row => (
                <tr
                  key={row.id}
                  {...(row.maxPct >= 90 ? { style: { background: 'var(--color-warn-wash, #fff5f2)' } } : {})}
                >
                  <td>
                    <strong style={{ fontSize: 13 }}>{row.name}</strong>
                  </td>
                  <td>
                    <span className={`admin-pill ${PLAN_PILL[row.plan] ?? 'draft'}`}>
                      {row.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="tn">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 12, color: utilColor(row.pctApps) }}>
                        {row.usedApps}/{row.limitApps}
                      </span>
                      <div className="admin-bar" style={{ width: 48 }}>
                        <div
                          className={utilBarClass(row.pctApps)}
                          style={{ width: `${Math.min(100, row.pctApps)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="tn">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 12, color: utilColor(row.pctKw) }}>
                        {row.usedKw}/{row.limitKw}
                      </span>
                      <div className="admin-bar" style={{ width: 48 }}>
                        <div
                          className={utilBarClass(row.pctKw)}
                          style={{ width: `${Math.min(100, row.pctKw)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="tn">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 12, color: utilColor(row.pctSeats) }}>
                        {row.usedSeats}/{row.limitSeats}
                      </span>
                      <div className="admin-bar" style={{ width: 48 }}>
                        <div
                          className={utilBarClass(row.pctSeats)}
                          style={{ width: `${Math.min(100, row.pctSeats)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>

      </div>
    </>
  )
}
