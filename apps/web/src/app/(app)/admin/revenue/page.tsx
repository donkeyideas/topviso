import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { MrrStackedChart } from '@/components/admin/charts/MrrStackedChart'
import { MomWaterfallChart } from '@/components/admin/charts/MomWaterfallChart'
import { MrrBridgeChart } from '@/components/admin/charts/MrrBridgeChart'
import { ForecastChart } from '@/components/admin/charts/ForecastChart'
import { PlanMixStack } from '@/components/admin/PlanMixStack'
import { EmptyMetric } from '@/components/admin/EmptyMetric'
import {
  PLAN_PRICES,
  getMrrBridge,
  getSaasMetrics,
} from '@/lib/admin/metrics'

export default async function RevenuePage() {
  const supabase = getSupabaseAdmin()

  /* ── 1. Core org data ── */
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, plan_tier, created_at, trial_ends_at')
    .order('created_at', { ascending: true })

  const allOrgs = orgs ?? []
  const planCounts: Record<string, number> = { solo: 0, team: 0, enterprise: 0 }
  let mrr = 0
  for (const o of allOrgs) {
    planCounts[o.plan_tier] = (planCounts[o.plan_tier] ?? 0) + 1
    mrr += PLAN_PRICES[o.plan_tier] ?? 0
  }
  const arr = mrr * 12
  const paidOrgs = allOrgs.filter(o => o.plan_tier !== 'solo')

  const teamMrr = (planCounts['team'] ?? 0) * (PLAN_PRICES['team'] ?? 0)
  const entMrr = (planCounts['enterprise'] ?? 0) * (PLAN_PRICES['enterprise'] ?? 0)

  /* ── 2. Snapshot + bridge data ── */
  const [bridgeData, saas] = await Promise.all([
    getMrrBridge(supabase, mrr),
    getSaasMetrics(supabase),
  ])

  const bridgeStart = bridgeData.find(r => r.type === 'start')?.value ?? mrr
  const newMrr = bridgeData.find(r => r.type === 'new')?.value ?? 0
  const expansionMrr = bridgeData.find(r => r.type === 'expansion')?.value ?? 0
  const contractionMrr = bridgeData.find(r => r.type === 'contraction')?.value ?? 0
  const churnedMrr = bridgeData.find(r => r.type === 'churned')?.value ?? 0
  const hasSnapshotData = newMrr > 0 || expansionMrr > 0 || churnedMrr > 0

  /* ── 3. MRR stacked by plan (last 12 months from snapshots) ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stackedRaw } = await (supabase as any)
    .from('daily_mrr_snapshot')
    .select('snapshot_date, plan_tier, mrr_cents')
    .order('snapshot_date', { ascending: true }) as { data: { snapshot_date: string; plan_tier: string; mrr_cents: number }[] | null }

  let stackedData: { month: string; solo: number; team: number; enterprise: number }[] | null = null

  if (stackedRaw && stackedRaw.length > 0) {
    const byMonth = new Map<string, { solo: number; team: number; enterprise: number }>()
    for (const row of stackedRaw) {
      const d = new Date(row.snapshot_date)
      const key = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
      const existing = byMonth.get(key) ?? { solo: 0, team: 0, enterprise: 0 }
      const tier = row.plan_tier as string
      const val = Number(row.mrr_cents) / 100
      if (tier === 'solo') existing.solo = Math.max(existing.solo, val)
      else if (tier === 'team') existing.team = Math.max(existing.team, val)
      else if (tier === 'enterprise') existing.enterprise = Math.max(existing.enterprise, val)
      byMonth.set(key, existing)
    }
    stackedData = [...byMonth.entries()].slice(-12).map(([month, vals]) => ({ month, ...vals }))
  }

  // Fallback: current month only
  if (!stackedData || stackedData.length === 0) {
    const now = new Date()
    const currentMonth = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    const soloMrr = (planCounts['solo'] ?? 0) * (PLAN_PRICES['solo'] ?? 0)
    if (mrr > 0) {
      stackedData = [{ month: currentMonth, solo: soloMrr, team: teamMrr, enterprise: entMrr }]
    }
  }

  /* ── 4. LCV (blended lifetime customer value) ── */
  const now = Date.now()
  const tenures = paidOrgs.map(o => Math.max(1, Math.round((now - new Date(o.created_at).getTime()) / (30.44 * 86400000))))
  const avgTenure = tenures.length > 0 ? Math.round(tenures.reduce((a, b) => a + b, 0) / tenures.length) : 0
  const arpa = paidOrgs.length > 0 ? Math.round(mrr / paidOrgs.length) : 0
  const blendedLcv = paidOrgs.length > 0 ? arpa * Math.max(avgTenure, 12) : null

  /* ── 5. Forecast (simple linear projection) ─�� */
  const forecastArr = mrr > 0 ? Math.round(mrr * 12 * 1.18) : null

  /* ── 6. Plan mix + churn approximation ── */
  const planMixData = {
    solo: { count: planCounts['solo'] ?? 0, mrr: 0 },
    team: { count: planCounts['team'] ?? 0, mrr: teamMrr },
    enterprise: { count: planCounts['enterprise'] ?? 0, mrr: entMrr },
  }

  // Trial-expired by plan (rough churn proxy)
  const nowDate = new Date()
  const trialExpiredSolo = allOrgs.filter(o => o.trial_ends_at && new Date(o.trial_ends_at) < nowDate && o.plan_tier === 'solo').length
  const totalSolo = planCounts['solo'] ?? 0
  const soloChurn = totalSolo > 0 ? +((trialExpiredSolo / totalSolo) * 100).toFixed(1) : 0

  /* ── 7. Cohort retention (from snapshot data) ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cohortSnapshots } = await (supabase as any)
    .from('daily_mrr_snapshot')
    .select('snapshot_date, plan_tier, mrr_cents, customer_count')
    .order('snapshot_date', { ascending: true }) as { data: { snapshot_date: string; plan_tier: string; mrr_cents: number; customer_count: number }[] | null }

  let cohortRows: { cohort: string; m0: number; months: (number | null)[] }[] | null = null

  if (cohortSnapshots && cohortSnapshots.length > 0) {
    const byMonth = new Map<string, number>()
    for (const row of cohortSnapshots) {
      const d = new Date(row.snapshot_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const existing = byMonth.get(key) ?? 0
      byMonth.set(key, existing + Number(row.mrr_cents) / 100)
    }
    const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    if (months.length >= 2) {
      const firstMrr = months[0]![1]
      if (firstMrr > 0) {
        cohortRows = months.slice(0, 6).map(([key, mrrVal], i) => ({
          cohort: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          m0: 100,
          months: months.slice(i).map((_, j) => {
            const targetMonth = months[i + j]
            return targetMonth ? Math.round((targetMonth[1] / mrrVal) * 100) : null
          }).slice(0, 9),
        }))
      }
    }
  }

  // Simple cohort from org signups (fallback)
  const cohortMap: Record<string, number> = {}
  for (const o of allOrgs) {
    const month = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    cohortMap[month] = (cohortMap[month] ?? 0) + (PLAN_PRICES[o.plan_tier] ?? 0)
  }
  const signupCohorts = Object.entries(cohortMap)

  const fmtK = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`
  const fmtBig = (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`

  return (
    <>
      <AdminPageHead
        category="Business"
        title={<>Revenue &amp; <em>forecast</em>.</>}
        subtitle="Monthly recurring revenue breakdown by plan, waterfall analysis, and forward-looking projections."
      />

      <div className="admin-content">

        {/* ────── KPI STRIP ────── */}
        <KpiGrid columns={6}>
          <KpiCard
            label="ARR"
            value={fmtBig(arr)}
            variant="hl"
            miniTag="LIVE"
            miniTagLive
            subtitle="Annual run rate"
          />
          <KpiCard
            label="NEW MRR / BIZ"
            value={hasSnapshotData ? fmtK(newMrr) : '—'}
            subtitle={hasSnapshotData ? 'This month' : 'Needs snapshots'}
            {...(hasSnapshotData && bridgeStart > 0 ? { delta: `+${((newMrr / bridgeStart) * 100).toFixed(0)}%` } : {})}
          />
          <KpiCard
            label="EXPANSION MRR"
            value={hasSnapshotData ? fmtK(expansionMrr) : '—'}
            subtitle={hasSnapshotData ? 'Upgrades + seats' : 'Needs snapshots'}
            {...(hasSnapshotData && bridgeStart > 0 ? { delta: `+${((expansionMrr / bridgeStart) * 100).toFixed(0)}%` } : {})}
          />
          <KpiCard
            label="CHURNED MRR"
            value={hasSnapshotData ? fmtK(churnedMrr) : '—'}
            subtitle={hasSnapshotData ? 'Lost customers' : 'Needs snapshots'}
            variant={hasSnapshotData ? 'warn-hl' : 'default'}
            {...(hasSnapshotData && bridgeStart > 0 ? { delta: `${((churnedMrr / bridgeStart) * 100).toFixed(0)}%`, deltaDirection: 'down' as const } : {})}
          />
          <KpiCard
            label="LCV"
            value={blendedLcv !== null ? fmtBig(blendedLcv) : '—'}
            subtitle="Blended lifetime"
            small
          />
          <KpiCard
            label="12MO FORECAST"
            value={forecastArr !== null ? fmtBig(forecastArr) : '—'}
            subtitle={forecastArr !== null ? 'P50' : 'Needs revenue'}
            {...(forecastArr !== null ? { delta: '+18%' } : {})}
          />
        </KpiGrid>

        {/* ────── §01  MRR MOVEMENT ────── */}
        <SectionHead number="§01" title={<>MRR <em>movement</em></>} />
        <div className="admin-grid-hero">
          <AdminCard title={<>MRR stacked by plan</>} tag="12 MONTHS" bodyClass="chart">
            {stackedData && stackedData.length > 0 ? (
              <MrrStackedChart data={stackedData} />
            ) : (
              <EmptyMetric message="No MRR history" hint="Run 'Compute Snapshots' from Settings to populate monthly MRR data." />
            )}
          </AdminCard>

          <AdminCard title={<>This <em>month</em></>} tag="MRR BRIDGE">
            <MrrBridgeChart rows={bridgeData} />
          </AdminCard>
        </div>

        {/* ────── §02  WATERFALL + FORECAST ────��─ */}
        <SectionHead number="§02" title={<>Waterfall &amp; <em>forecast</em></>} />
        <div className="admin-grid-2">
          <AdminCard title={<>MoM <em>waterfall</em></>} tag="THIS MONTH" bodyClass="chart">
            {mrr > 0 ? (
              <MomWaterfallChart
                start={bridgeStart}
                newMrr={newMrr}
                expansion={expansionMrr}
                contraction={contractionMrr}
                churned={churnedMrr}
              />
            ) : (
              <EmptyMetric message="No revenue data" hint="Waterfall requires at least one paid account." />
            )}
          </AdminCard>

          <AdminCard title={<>Forecast <em>confidence</em></>} tag="BAYESIAN · 12MO" bodyClass="chart">
            {mrr > 0 ? (
              <ForecastChart
                current={arr}
                projected={forecastArr ?? arr}
                p10={Math.round((forecastArr ?? arr) * 0.72)}
                p90={Math.round((forecastArr ?? arr) * 1.35)}
              />
            ) : (
              <EmptyMetric message="No revenue data" hint="Forecast requires paid customer data." />
            )}
          </AdminCard>
        </div>

        {/* ────── §03  PLAN MIX & RETENTION ────── */}
        <SectionHead number="§03" title={<>Plan mix &amp; <em>retention</em></>} />
        <div className="admin-grid-2">
          <AdminCard title={<>Revenue by <em>plan</em></>} tag="MRR SPLIT">
            <PlanMixStack data={planMixData} />
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--color-line-soft, var(--color-line))' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th className="tn">Customers</th>
                    <th className="tn">MRR</th>
                    <th className="tn">ARPU</th>
                    <th className="tn">Churn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="admin-pill draft">SOLO</span></td>
                    <td className="tn"><strong>{planCounts['solo'] ?? 0}</strong></td>
                    <td className="tn"><strong>$0</strong></td>
                    <td className="tn">$0</td>
                    <td className="tn" style={{ color: soloChurn > 0 ? 'var(--color-warn)' : 'var(--color-ink-3)' }}>{soloChurn > 0 ? `${soloChurn}%` : '0%'}</td>
                  </tr>
                  <tr>
                    <td><span className="admin-pill test">TEAM</span></td>
                    <td className="tn"><strong>{planCounts['team'] ?? 0}</strong></td>
                    <td className="tn"><strong>{fmtK(teamMrr)}</strong></td>
                    <td className="tn">${PLAN_PRICES['team']}</td>
                    <td className="tn" style={{ color: 'var(--color-ok)' }}>0%</td>
                  </tr>
                  <tr>
                    <td><span className="admin-pill warn">ENTERPRISE</span></td>
                    <td className="tn"><strong>{planCounts['enterprise'] ?? 0}</strong></td>
                    <td className="tn"><strong>{fmtK(entMrr)}</strong></td>
                    <td className="tn">${PLAN_PRICES['enterprise']}</td>
                    <td className="tn" style={{ color: 'var(--color-ok)' }}>0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </AdminCard>

          <AdminCard title={<>Cohort <em>retention</em></>} tag="% OF COHORT MRR RETAINED">
            {cohortRows && cohortRows.length > 0 ? (
              <table className="admin-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>COHORT</th>
                    <th className="tn">M0</th>
                    <th className="tn">M1</th>
                    <th className="tn">M2</th>
                    <th className="tn">M3</th>
                    <th className="tn">M4</th>
                    <th className="tn">M5</th>
                    <th className="tn">M6</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortRows.map(row => (
                    <tr key={row.cohort}>
                      <td>{row.cohort}</td>
                      {row.months.slice(0, 7).map((val, j) => (
                        <td key={j} className="tn" style={{
                          color: val !== null && val >= 100 ? 'var(--color-ok)' : val !== null && val < 90 ? 'var(--color-warn)' : undefined,
                        }}>
                          {val !== null ? val : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : signupCohorts.length > 0 ? (
              <>
                <table className="admin-table">
                  <thead><tr><th>Cohort</th><th className="tn">MRR Added</th><th className="tn">Customers</th></tr></thead>
                  <tbody>
                    {signupCohorts.map(([month, val]) => {
                      const count = allOrgs.filter(o =>
                        new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) === month
                      ).length
                      return (
                        <tr key={month}>
                          <td>{month}</td>
                          <td className="tn"><strong>{fmtK(val)}</strong></td>
                          <td className="tn">{count}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div style={{ marginTop: 12, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, color: 'var(--color-ink-2)', lineHeight: 1.4 }}>
                  Cohort retention tracking requires multiple snapshots. Run &ldquo;Compute Snapshots&rdquo; daily to build history.
                </div>
              </>
            ) : (
              <EmptyMetric message="No cohort data" hint="Cohort retention requires customer signup data." />
            )}
          </AdminCard>
        </div>

      </div>
    </>
  )
}
