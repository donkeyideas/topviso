import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { EmptyMetric } from '@/components/admin/EmptyMetric'

export default async function UsageEngagementPage() {
  const supabase = getSupabaseAdmin()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000)
  const monthAgo = new Date(today.getTime() - 30 * 86_400_000)

  const [
    { count: userCount },
    { count: orgCount },
    { count: appCount },
    { count: keywordCount },
    { count: analysisCount },
    { count: reviewCount },
    { data: recentAnalyses },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase.from('apps').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('keywords').select('id', { count: 'exact', head: true }),
    supabase.from('analysis_results').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase.from('analysis_results').select('created_at, organization_id').gte('created_at', monthAgo.toISOString()),
  ])

  // Compute DAU/WAU/MAU from analysis activity (unique orgs)
  const dauOrgs = new Set<string>()
  const wauOrgs = new Set<string>()
  const mauOrgs = new Set<string>()
  for (const a of recentAnalyses ?? []) {
    const d = new Date(a.created_at)
    mauOrgs.add(a.organization_id)
    if (d >= weekAgo) wauOrgs.add(a.organization_id)
    if (d >= today) dauOrgs.add(a.organization_id)
  }
  const dau = dauOrgs.size
  const wau = wauOrgs.size
  const mau = mauOrgs.size
  const stickiness = wau > 0 ? Math.round((dau / wau) * 100) : 0

  // Per-org usage breakdown
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, plan_tier')
    .order('created_at', { ascending: false })

  const { data: apps } = await supabase
    .from('apps')
    .select('id, organization_id')
    .eq('is_active', true)

  const { data: keywords } = await supabase
    .from('keywords')
    .select('app_id')

  const { data: analyses } = await supabase
    .from('analysis_results')
    .select('app_id')

  // Build per-org stats
  const appsByOrg: Record<string, string[]> = {}
  for (const a of apps ?? []) {
    if (!appsByOrg[a.organization_id]) appsByOrg[a.organization_id] = []
    appsByOrg[a.organization_id]!.push(a.id)
  }

  const kwByApp: Record<string, number> = {}
  for (const k of keywords ?? []) kwByApp[k.app_id] = (kwByApp[k.app_id] ?? 0) + 1

  const analysisByApp: Record<string, number> = {}
  for (const a of analyses ?? []) analysisByApp[a.app_id] = (analysisByApp[a.app_id] ?? 0) + 1

  const orgStats = (orgs ?? []).map(o => {
    const orgApps = appsByOrg[o.id] ?? []
    const orgKw = orgApps.reduce((s, id) => s + (kwByApp[id] ?? 0), 0)
    const orgAn = orgApps.reduce((s, id) => s + (analysisByApp[id] ?? 0), 0)
    return { ...o, apps: orgApps.length, keywords: orgKw, analyses: orgAn }
  }).sort((a, b) => b.analyses - a.analyses)

  return (
    <>
      <AdminPageHead
        category="Product"
        title={<>How it&apos;s <em>used</em>.</>}
        subtitle="DAU, WAU, MAU, stickiness, session depth, and the power-user identifier."
        stamp={<>
          DAU ·<br />
          <strong>{dau.toLocaleString()}</strong>
          WAU ·<br />
          <strong>{wau.toLocaleString()}</strong>
          STICKINESS ·<br />
          <strong>{stickiness}%</strong>
        </>}
      />
      <div className="admin-content">
        <KpiGrid columns={6}>
          <KpiCard label="DAU" value={dau.toLocaleString()} variant="hl" subtitle="unique" />
          <KpiCard label="WAU" value={wau.toLocaleString()} subtitle="7d" />
          <KpiCard label="MAU" value={mau.toLocaleString()} subtitle="30d" />
          <KpiCard label="Stickiness" value={`${stickiness}%`} subtitle="DAU/WAU" />
          <KpiCard label="Avg Session" value="—" subtitle="median" />
          <KpiCard label="TTV · Median" value="—" subtitle="signup → insight" />
        </KpiGrid>

        {/* ── §01 TRENDS ── */}
        <SectionHead index="01" title={<>DAU/WAU/MAU trends · power-user identification · feature stickiness heatmap</>} />
        <AdminCard title={<>Engagement <em>trends</em></>} tag="90D">
          <EmptyMetric
            message="DAU/WAU/MAU chart requires daily usage snapshots"
            hint="90-day stacked DAU/WAU/MAU chart, session depth distribution, time-to-value by segment, power-user cohort identifier with NPS correlation, feature stickiness matrix."
          />
        </AdminCard>

        {/* ── §02 PLATFORM TOTALS ── */}
        <SectionHead index="02" title="Platform Totals" />
        <AdminCard title={<>Usage <em>Summary</em></>} tag="ALL TIME">
          <table className="admin-table">
            <thead><tr><th>Metric</th><th className="tn">Count</th></tr></thead>
            <tbody>
              <tr><td>Registered Users</td><td className="tn"><strong>{(userCount ?? 0).toLocaleString()}</strong></td></tr>
              <tr><td>Organizations</td><td className="tn"><strong>{(orgCount ?? 0).toLocaleString()}</strong></td></tr>
              <tr><td>Active Apps</td><td className="tn"><strong>{(appCount ?? 0).toLocaleString()}</strong></td></tr>
              <tr><td>Tracked Keywords</td><td className="tn"><strong>{(keywordCount ?? 0).toLocaleString()}</strong></td></tr>
              <tr><td>Analysis Results</td><td className="tn"><strong>{(analysisCount ?? 0).toLocaleString()}</strong></td></tr>
              <tr><td>Reviews Collected</td><td className="tn"><strong>{(reviewCount ?? 0).toLocaleString()}</strong></td></tr>
            </tbody>
          </table>
        </AdminCard>

        {/* ── §03 PER-ORG ENGAGEMENT ── */}
        <SectionHead index="03" title="Per-Organization Engagement" />
        <AdminCard title={<>Org <em>Engagement</em></>} tag="BY DEPTH">
          {orgStats.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-ink-3)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>No organizations yet.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>Organization</th><th>Plan</th><th className="tn">Apps</th><th className="tn">Keywords</th><th className="tn">Analyses</th></tr>
              </thead>
              <tbody>
                {orgStats.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.name}</strong></td>
                    <td><span className={`admin-pill ${o.plan_tier === 'enterprise' ? 'purple' : o.plan_tier === 'team' ? 'test' : 'draft'}`}>{o.plan_tier}</span></td>
                    <td className="tn">{o.apps}</td>
                    <td className="tn">{o.keywords}</td>
                    <td className="tn">{o.analyses}</td>
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
