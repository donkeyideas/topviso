import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { CohortHeatmap } from '@/components/admin/CohortHeatmap'
import { CohortCurvesChart } from '@/components/admin/charts/CohortCurvesChart'
import { EmptyMetric } from '@/components/admin/EmptyMetric'
import { PLAN_PRICES, getCohortRetention, getSaasMetrics } from '@/lib/admin/metrics'

export default async function CohortRetentionPage() {
  const supabase = getSupabaseAdmin()

  /* ── 1. Org data for cohort table ── */
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, plan_tier, created_at')
    .order('created_at', { ascending: true })

  const allOrgs = orgs ?? []
  const cohorts: Record<string, { total: number; paid: number; mrr: number }> = {}
  for (const o of allOrgs) {
    const month = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    if (!cohorts[month]) cohorts[month] = { total: 0, paid: 0, mrr: 0 }
    cohorts[month]!.total++
    if (o.plan_tier !== 'solo') {
      cohorts[month]!.paid++
      cohorts[month]!.mrr += PLAN_PRICES[o.plan_tier] ?? 0
    }
  }
  const entries = Object.entries(cohorts)

  /* ── 2. Cohort retention + SaaS metrics ── */
  const [cohortRetention, saas] = await Promise.all([
    getCohortRetention(supabase),
    getSaasMetrics(supabase),
  ])

  /* Build heatmap months header */
  const maxRetentionLen = cohortRetention
    ? Math.max(...cohortRetention.map((c) => c.retention.length), 1)
    : 0
  const heatmapMonths = Array.from({ length: maxRetentionLen }, (_, i) => `M${i}`)

  /* Cohort curves (first 6 with enough data) */
  const cohortCurves = cohortRetention
    ? cohortRetention
        .filter((c) => c.retention.length >= 2)
        .slice(0, 6)
        .map((c) => ({ label: c.label, data: c.retention }))
    : []

  /* ── 3. Expansion mix (real signals from org data) ── */
  const { data: members } = await supabase
    .from('organization_members')
    .select('organization_id')

  const { data: analysisData } = await supabase
    .from('analysis_results')
    .select('organization_id, analysis_type')

  const { data: appsData } = await supabase
    .from('apps')
    .select('organization_id')

  // Count expansion signals
  const orgMemberCounts = new Map<string, number>()
  for (const m of members ?? []) {
    orgMemberCounts.set(m.organization_id, (orgMemberCounts.get(m.organization_id) ?? 0) + 1)
  }
  const orgAppCounts = new Map<string, number>()
  for (const a of appsData ?? []) {
    orgAppCounts.set(a.organization_id, (orgAppCounts.get(a.organization_id) ?? 0) + 1)
  }
  const orgModuleCounts = new Map<string, Set<string>>()
  for (const a of analysisData ?? []) {
    if (!orgModuleCounts.has(a.organization_id)) orgModuleCounts.set(a.organization_id, new Set())
    orgModuleCounts.get(a.organization_id)!.add(a.analysis_type)
  }

  const paidOrgs = allOrgs.filter(o => o.plan_tier !== 'solo')
  const paidCount = paidOrgs.length

  // Seat additions: paid orgs with 2+ members (team growing)
  const seatExpansion = paidCount > 0
    ? paidOrgs.filter(o => (orgMemberCounts.get(o.id) ?? 0) >= 2).length
    : 0
  // Plan upgrade potential: solo orgs that are active (have apps)
  const upgradeSignal = allOrgs.filter(o => o.plan_tier === 'solo' && (orgAppCounts.get(o.id) ?? 0) > 0).length
  // Module expansion: paid orgs using 2+ analysis types
  const moduleExpansion = paidCount > 0
    ? paidOrgs.filter(o => (orgModuleCounts.get(o.id)?.size ?? 0) >= 2).length
    : 0
  // Multi-app: orgs tracking 2+ apps
  const multiApp = allOrgs.filter(o => (orgAppCounts.get(o.id) ?? 0) >= 2).length

  const expansionTotal = seatExpansion + upgradeSignal + moduleExpansion + multiApp
  const expansionMix = [
    {
      label: 'Seat additions',
      sublabel: 'TEAM GROWING + SELF-SERVE',
      count: seatExpansion,
      pct: expansionTotal > 0 ? Math.round((seatExpansion / expansionTotal) * 100) : 0,
    },
    {
      label: 'Plan upgrade',
      sublabel: 'SOLO → TEAM → ENT',
      count: upgradeSignal,
      pct: expansionTotal > 0 ? Math.round((upgradeSignal / expansionTotal) * 100) : 0,
    },
    {
      label: 'Add-on modules',
      sublabel: 'MULTI-MODULE USAGE',
      count: moduleExpansion,
      pct: expansionTotal > 0 ? Math.round((moduleExpansion / expansionTotal) * 100) : 0,
    },
    {
      label: 'More apps tracked',
      sublabel: 'USAGE-BASED TIER',
      count: multiApp,
      pct: expansionTotal > 0 ? Math.round((multiApp / expansionTotal) * 100) : 0,
    },
  ]

  return (
    <>
      <AdminPageHead
        category="Business"
        title={<>Cohort <em>retention</em>.</>}
        subtitle="Monthly cohort breakdown showing signup volume, paid conversion, and MRR contribution."
      />

      <div className="admin-content">
        {/* ── KPI strip ── */}
        <KpiGrid columns={5}>
          <KpiCard
            label="GRR"
            value={saas.grr !== null ? `${saas.grr}%` : '—'}
            variant={saas.grr !== null ? 'ok-hl' : 'default'}
            subtitle="Gross revenue retention"
          />
          <KpiCard
            label="NRR"
            value={saas.nrr !== null ? `${saas.nrr}%` : '—'}
            variant={saas.nrr !== null ? 'hl' : 'default'}
            subtitle="Net revenue retention"
          />
          <KpiCard
            label="Quick Ratio"
            value={saas.quickRatio !== null ? `${saas.quickRatio}` : '—'}
            subtitle="New+Exp / Cont+Churn"
          />
          <KpiCard
            label="Magic Number"
            value={saas.magicNumber !== null ? `${saas.magicNumber}` : '—'}
            subtitle="Net new ARR / S&M spend"
          />
          <KpiCard
            label="Expansion %"
            value={saas.expansionPct !== null ? `${saas.expansionPct}%` : '—'}
            subtitle="Expansion revenue share"
          />
        </KpiGrid>

        {/* ── §01 MRR retention heatmap ── */}
        <SectionHead number="§01" title={<>MRR retention · monthly <em>cohorts</em></>} />

        <AdminCard>
          {cohortRetention && cohortRetention.length > 0 ? (
            <CohortHeatmap data={cohortRetention} months={heatmapMonths} />
          ) : (
            <EmptyMetric message="No cohort retention data" hint="Cohort heatmap will populate as organizations age and retention is tracked over time." />
          )}
        </AdminCard>

        {/* ── Cohort curves + Expansion mix (side by side) ── */}
        <div className="admin-grid-2">
          <div>
            <SectionHead number="§02" title={<>Cohort <em>curves</em></>} />
            <AdminCard title={<>Cohort <em>curves</em></>} tag="LAST 6 COHORTS" bodyClass="chart">
              {cohortCurves.length > 0 ? (
                <CohortCurvesChart curves={cohortCurves} />
              ) : (
                <EmptyMetric message="No curve data" hint="Cohort curves require at least 2 months of retention data per cohort." />
              )}
            </AdminCard>
          </div>

          <div>
            <SectionHead number="§03" title={<>Expansion <em>mix</em></>} />
            <AdminCard title={<>Expansion <em>mix</em></>} tag="WHAT DRIVES EXPANSION">
              {expansionTotal > 0 ? (
                <div style={{ padding: '4px 0' }}>
                  {expansionMix.map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--color-line-soft, var(--color-line))' }}>
                      <div style={{ width: 140 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.1em', marginTop: 2 }}>{item.sublabel}</div>
                      </div>
                      <div style={{ flex: 1, height: 8, background: 'var(--color-line)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(item.pct, 2)}%`, height: '100%', background: 'var(--color-accent)', borderRadius: 4 }} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, width: 50, textAlign: 'right' }}>{item.pct}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyMetric message="No expansion signals" hint="Expansion mix populates when paid orgs add seats, upgrade plans, or adopt additional modules." />
              )}
            </AdminCard>
          </div>
        </div>

        {/* ── §04 Monthly cohorts table ── */}
        <SectionHead number="§04" title={<>Monthly <em>cohorts</em></>} />

        <AdminCard title={<>Monthly <em>Cohorts</em></>} tag={`${entries.length} MONTHS`}>
          {entries.length === 0 ? (
            <EmptyMetric message="No cohort data yet" hint="Organizations will appear here once users sign up." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cohort</th>
                  <th className="tn">Signups</th>
                  <th className="tn">Paid</th>
                  <th className="tn">Conv. %</th>
                  <th className="tn">MRR</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([month, d]) => (
                  <tr key={month}>
                    <td><strong>{month}</strong></td>
                    <td className="tn">{d.total}</td>
                    <td className="tn">{d.paid}</td>
                    <td className="tn">{d.total > 0 ? Math.round((d.paid / d.total) * 100) : 0}%</td>
                    <td className="tn"><strong>${d.mrr.toLocaleString()}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminCard>
      </div>
    </>
  )
}
