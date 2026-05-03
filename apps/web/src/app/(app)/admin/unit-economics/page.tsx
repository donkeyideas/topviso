import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { LtvCacScatter } from '@/components/admin/charts/LtvCacScatter'
import { EmptyMetric } from '@/components/admin/EmptyMetric'
import { PLAN_PRICES, getSaasMetrics, getChannelEconomics } from '@/lib/admin/metrics'

const QUALITY_PILL: Record<string, string> = {
  BEST: 'admin-pill purple',
  STRONG: 'admin-pill test',
  HEALTHY: 'admin-pill ok',
  WATCH: 'admin-pill warn',
  WORST: 'admin-pill draft',
}

export default async function UnitEconomicsPage() {
  const supabase = getSupabaseAdmin()

  const [m, channels] = await Promise.all([
    getSaasMetrics(supabase),
    getChannelEconomics(supabase),
  ])

  const scatterData = channels
    ? channels.map((ch) => ({
        label: ch.channel.replace(/^Paid · /, '').replace(/ \(PLG\)/, ''),
        cac: ch.cac,
        ltv: ch.ltv,
        customers: ch.paid,
      }))
    : null

  return (
    <>
      <AdminPageHead category="Business" title={<>Unit <em>economics</em>.</>} subtitle="LTV, CAC, payback period, and per-channel economics." />
      <div className="admin-content">

        {/* ── KPI strip ── */}
        <KpiGrid columns={6}>
          <KpiCard label="Blended CAC" value={m.blendedCac !== null ? `$${m.blendedCac}` : '\u2014'} subtitle="All channels" />
          <KpiCard label="Blended LTV" value={m.blendedLtv !== null ? `$${m.blendedLtv.toLocaleString()}` : '\u2014'} subtitle="Weighted avg" variant="ok-hl" />
          <KpiCard label="LTV / CAC" value={m.ltvCac !== null ? `${m.ltvCac}x` : '\u2014'} subtitle="Ratio" variant="hl" />
          <KpiCard label="CAC Payback" value={m.cacPayback !== null ? `${m.cacPayback} mo` : '\u2014'} subtitle="Months to recover" />
          <KpiCard label="Gross Margin" value={m.grossMargin !== null ? `${m.grossMargin}%` : '\u2014'} subtitle="Software margin" variant="ok-hl" />
          <KpiCard label="Contribution" value={m.contribution !== null ? `${m.contribution}%` : '\u2014'} subtitle="After COGS + S&M" />
        </KpiGrid>

        {/* ── §01 LTV / CAC by channel ── */}
        <SectionHead number="§01" title={<>LTV / CAC by <em>channel</em></>} />

        <div className="admin-grid-2">
          <AdminCard title={<>LTV/CAC <em>Scatter</em></>}>
            {scatterData ? (
              <LtvCacScatter data={scatterData} />
            ) : (
              <EmptyMetric hint="No channel attribution data" />
            )}
          </AdminCard>

          <AdminCard title={<>Contribution margin by <em>cohort</em></>}>
            <EmptyMetric hint="Contribution margin requires COGS data" />
          </AdminCard>
        </div>

        {/* ── §02 Full channel economics ── */}
        <SectionHead number="§02" title={<>Full channel <em>economics</em></>} />

        <AdminCard title={<>Channel <em>Economics</em></>} tag="ALL CHANNELS">
          {channels ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th className="tn">Visitors</th>
                  <th className="tn">Signups</th>
                  <th className="tn">Paid</th>
                  <th className="tn">CAC</th>
                  <th className="tn">LTV</th>
                  <th className="tn">LTV/CAC</th>
                  <th className="tn">Payback</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((ch) => (
                  <tr key={ch.channel}>
                    <td>{ch.channel}</td>
                    <td className="tn">{ch.visitors.toLocaleString()}</td>
                    <td className="tn">{ch.signups.toLocaleString()}</td>
                    <td className="tn">{ch.paid.toLocaleString()}</td>
                    <td className="tn">${ch.cac}</td>
                    <td className="tn"><strong>${ch.ltv.toLocaleString()}</strong></td>
                    <td className="tn">{ch.ltvCac}</td>
                    <td className="tn">{ch.payback}</td>
                    <td>
                      <span className={QUALITY_PILL[ch.quality] ?? 'admin-pill'}>{ch.quality}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyMetric hint="Channel economics requires UTM tracking integration" />
          )}
        </AdminCard>

      </div>
    </>
  )
}
