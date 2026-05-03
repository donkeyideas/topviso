import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { EmptyMetric } from '@/components/admin/EmptyMetric'

const PLAN_PRICES: Record<string, number> = { solo: 0, team: 49, enterprise: 199 }

export default async function ChannelPerformancePage() {
  const supabase = getSupabaseAdmin()

  /* ── 1. Org + member data ── */
  const [{ data: orgs }, { data: members }] = await Promise.all([
    supabase.from('organizations').select('id, name, plan_tier, created_at').order('created_at', { ascending: false }),
    supabase.from('organization_members').select('organization_id, user_id'),
  ])

  const allOrgs = orgs ?? []
  const membersByOrg: Record<string, number> = {}
  for (const m of members ?? []) {
    membersByOrg[m.organization_id] = (membersByOrg[m.organization_id] ?? 0) + 1
  }

  /* ── 2. Segment by plan tier ── */
  const segments: Record<string, { orgs: number; users: number; mrr: number }> = {}
  for (const o of allOrgs) {
    const tier = o.plan_tier
    if (!segments[tier]) segments[tier] = { orgs: 0, users: 0, mrr: 0 }
    segments[tier]!.orgs++
    segments[tier]!.users += membersByOrg[o.id] ?? 0
    segments[tier]!.mrr += PLAN_PRICES[tier] ?? 0
  }

  const totalOrgs = allOrgs.length
  let totalMrr = 0
  for (const s of Object.values(segments)) totalMrr += s.mrr
  const newArr = totalMrr * 12

  const paidOrgs = allOrgs.filter(o => o.plan_tier !== 'solo')
  const paidCount = paidOrgs.length

  /* ── 3. Channel data (signup_funnel_daily) ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: funnelData } = await (supabase as any)
    .from('signup_funnel_daily')
    .select('channel, visitors, signups, paid') as { data: { channel: string; visitors: number; signups: number; paid: number }[] | null }

  interface ChannelAgg { visitors: number; signups: number; paid: number }
  const channels = new Map<string, ChannelAgg>()
  let liveChannels = 0
  if (funnelData && funnelData.length > 0) {
    for (const row of funnelData) {
      const ch = row.channel ?? 'Direct'
      const existing = channels.get(ch) ?? { visitors: 0, signups: 0, paid: 0 }
      existing.visitors += row.visitors ?? 0
      existing.signups += row.signups ?? 0
      existing.paid += row.paid ?? 0
      channels.set(ch, existing)
    }
    liveChannels = channels.size
  }

  const hasChannelData = channels.size > 0

  /* ── 4. Identify best/worst channels ── */
  let bestChannel: string | null = null
  let worstChannel: string | null = null
  if (hasChannelData) {
    let bestRate = -1
    let worstRate = Infinity
    for (const [ch, data] of channels) {
      const rate = data.visitors > 0 ? data.paid / data.visitors : 0
      if (rate > bestRate) { bestRate = rate; bestChannel = ch }
      if (rate < worstRate) { worstRate = rate; worstChannel = ch }
    }
  }

  /* ── 5. Blended CAC placeholder ── */
  // Real CAC requires ad spend data — not available yet
  const blendedCac: number | null = null

  const fmtK = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`

  return (
    <>
      <AdminPageHead
        category="Acquisition"
        title={<>Channel <em>ROI</em>.</>}
        subtitle="Per-channel spend, installs, CAC, LTV, incrementality holdouts — which channels to kill, scale, or leave alone."
      />

      <div className="admin-content">

        {/* ── KPI STRIP ── */}
        <KpiGrid columns={5}>
          <KpiCard
            label="BLENDED CAC"
            value={blendedCac !== null ? `$${blendedCac}` : '—'}
            subtitle={blendedCac !== null ? '< $500 target' : 'Needs ad spend data'}
            variant="hl"
          />
          <KpiCard
            label="BEST CHANNEL"
            value={bestChannel ?? '—'}
            subtitle={bestChannel ? '$0 CAC' : 'Needs channel data'}
            variant={bestChannel ? 'ok-hl' : 'default'}
          />
          <KpiCard
            label="WORST CHANNEL"
            value={worstChannel ?? '—'}
            subtitle={worstChannel ? 'Lowest conversion' : 'Needs channel data'}
          />
          <KpiCard
            label="INCREMENTAL LIFT"
            value="—"
            subtitle="Geo holdout test"
          />
          <KpiCard
            label="ATTRIBUTION"
            value="—"
            subtitle="Bayesian MMM"
          />
        </KpiGrid>

        {/* ── §01 CHANNEL PERFORMANCE TABLE ── */}
        <SectionHead number="§01" title={<>Channel <em>breakdown</em></>} />

        {hasChannelData ? (
          <AdminCard title={<>Per-channel <em>metrics</em></>} tag={`${liveChannels} CHANNELS`}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th className="tn">Visitors</th>
                  <th className="tn">Signups</th>
                  <th className="tn">Paid</th>
                  <th className="tn">Conv. %</th>
                  <th style={{ width: '25%' }}>Bar</th>
                </tr>
              </thead>
              <tbody>
                {[...channels.entries()].map(([ch, data]) => {
                  const conv = data.visitors > 0 ? ((data.paid / data.visitors) * 100).toFixed(2) : '0.00'
                  const maxVisitors = Math.max(...[...channels.values()].map(c => c.visitors), 1)
                  const barWidth = Math.round((data.visitors / maxVisitors) * 100)
                  return (
                    <tr key={ch}>
                      <td><strong>{ch}</strong></td>
                      <td className="tn">{data.visitors.toLocaleString()}</td>
                      <td className="tn">{data.signups.toLocaleString()}</td>
                      <td className="tn">{data.paid}</td>
                      <td className="tn">{conv}%</td>
                      <td>
                        <div style={{ background: 'var(--color-line)', borderRadius: 3, height: 8, width: '100%' }}>
                          <div style={{ background: 'var(--color-accent)', borderRadius: 3, height: 8, width: `${barWidth}%` }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </AdminCard>
        ) : (
          <AdminCard title={<>Channel <em>quadrant</em> · holdout tests · attribution weighting</>}>
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color: 'var(--color-ink-2)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto' }}>
                Detailed quadrant chart (CAC × LTV/CAC), per-channel incrementality from geo holdouts,
                attribution weight decomposition, content calendar vs paid ramp, and a kill/scale/hold
                recommendation engine per channel.
              </div>
              <div style={{ marginTop: 20 }}>
                <EmptyMetric message="No channel data yet" hint="Channel performance requires UTM tracking, ad spend integration, and signup_funnel_daily table data." />
              </div>
            </div>
          </AdminCard>
        )}

        {/* ── §02 PLAN SEGMENTS ── */}
        <SectionHead number="§02" title={<>Plan <em>segments</em></>} />

        <AdminCard title={<>Revenue by <em>segment</em></>} tag="DISTRIBUTION">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Segment</th>
                <th className="tn">Accounts</th>
                <th className="tn">Users</th>
                <th className="tn">MRR</th>
                <th className="tn">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(segments).map(([tier, data]) => (
                <tr key={tier}>
                  <td>
                    <span className={`admin-pill ${tier === 'enterprise' ? 'warn' : tier === 'team' ? 'test' : 'draft'}`}>
                      {tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="tn">{data.orgs}</td>
                  <td className="tn">{data.users}</td>
                  <td className="tn"><strong>${data.mrr.toLocaleString()}</strong></td>
                  <td className="tn">{totalOrgs > 0 ? Math.round((data.orgs / totalOrgs) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>

        {/* ── §03 RECENT ACCOUNTS ── */}
        <SectionHead number="§03" title={<>Recent <em>accounts</em></>} />

        <AdminCard title="Latest Signups" tag={`${Math.min(10, totalOrgs)} SHOWN`}>
          {totalOrgs === 0 ? (
            <EmptyMetric message="No accounts yet" />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Plan</th>
                  <th className="tn">Members</th>
                  <th className="tn">Joined</th>
                </tr>
              </thead>
              <tbody>
                {allOrgs.slice(0, 10).map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.name}</strong></td>
                    <td>
                      <span className={`admin-pill ${o.plan_tier === 'enterprise' ? 'warn' : o.plan_tier === 'team' ? 'test' : 'draft'}`}>
                        {o.plan_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="tn">{membersByOrg[o.id] ?? 0}</td>
                    <td className="tn">{new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
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
