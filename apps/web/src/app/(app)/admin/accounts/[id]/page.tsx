import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { HealthTrajectoryChart } from '@/components/admin/charts/HealthTrajectoryChart'
import { FeatureImportanceBars } from '@/components/admin/charts/FeatureImportanceBars'
import { UsageHeatmap } from '@/components/admin/charts/UsageHeatmap'
import { EngagementTrajectoryChart } from '@/components/admin/charts/EngagementTrajectoryChart'
import { EmptyMetric } from '@/components/admin/EmptyMetric'
import {
  PLAN_PRICES,
  computeOrgHealth,
  computeLtv,
  formatLtv,
  getOrgNps,
  getExpansionSignal,
  getHealthTrajectory,
  getChurnExplainer,
  getUsageHeatmap,
  getLastSeen,
  getModuleEngagement,
} from '@/lib/admin/metrics'

export default async function Customer360Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = getSupabaseAdmin()

  /* ── 1. Core org data ── */
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, plan_tier, created_at, trial_ends_at, seat_limit, app_limit')
    .eq('id', id)
    .maybeSingle()

  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id, role')
    .eq('organization_id', id)

  const { data: apps } = await supabase
    .from('apps')
    .select('id, name, platform, store_id, icon_url, category, created_at')
    .eq('organization_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const memberIds = (members ?? []).map(m => m.user_id)
  const { data: profiles } = memberIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, created_at').in('id', memberIds)
    : { data: [] }
  const profileMap: Record<string, { full_name: string | null; created_at: string }> = {}
  for (const p of profiles ?? []) profileMap[p.id] = { full_name: p.full_name, created_at: p.created_at }

  const orgName = org?.name ?? 'Unknown'
  const initials = orgName.slice(0, 2).toUpperCase()
  const owner = (members ?? []).find(m => m.role === 'owner')
  const ownerProfile = owner ? profileMap[owner.user_id] : null

  /* ── 2. Derived metrics ── */
  const planTier = org?.plan_tier ?? 'solo'
  const createdAt = org?.created_at ? new Date(org.created_at) : new Date()
  const tenureMonths = Math.max(1, Math.round((Date.now() - createdAt.getTime()) / (30.44 * 86400000)))
  const orgId = org?.id ?? id

  const [
    healthResult,
    nps,
    trajectoryData,
    churnExplainerItems,
    usageHeatmapData,
    lastSeen,
    moduleEngagement,
  ] = await Promise.all([
    computeOrgHealth(supabase, orgId),
    getOrgNps(supabase, orgId),
    getHealthTrajectory(supabase, orgId),
    getChurnExplainer(supabase, orgId),
    getUsageHeatmap(supabase, orgId),
    getLastSeen(supabase, orgId),
    getModuleEngagement(supabase, orgId),
  ])

  const { healthScore, churnRisk } = healthResult
  const predictedLtv = formatLtv(computeLtv(planTier, tenureMonths))
  const expansionSignal = getExpansionSignal(healthScore)

  const planPrice = PLAN_PRICES[planTier] ?? 0
  const lifetimeRevenue = planPrice * tenureMonths
  const lifetimeRevenueStr = lifetimeRevenue >= 1000 ? `$${(lifetimeRevenue / 1000).toFixed(0)}K` : `$${lifetimeRevenue}`

  const healthVariant: 'ok-hl' | 'default' | 'warn-hl' =
    healthScore >= 80 ? 'ok-hl' : healthScore >= 50 ? 'default' : 'warn-hl'

  /* ── 3. Event timeline from real data ── */
  const { data: analysisEvents } = await supabase
    .from('analysis_results')
    .select('analysis_type, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: appEvents } = await supabase
    .from('apps')
    .select('name, platform, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  interface TimelineEvent { date: string; message: string; category: string }
  const timeline: TimelineEvent[] = []

  if (org) {
    timeline.push({
      date: new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      message: `Signup · created organization "${orgName}"`,
      category: 'account',
    })
  }

  for (const a of appEvents ?? []) {
    timeline.push({
      date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      message: `App added · ${a.name} (${a.platform.toUpperCase()})`,
      category: 'product',
    })
  }

  for (const a of analysisEvents ?? []) {
    const type = (a.analysis_type ?? 'analysis').replace(/_/g, ' ')
    timeline.push({
      date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      message: `Analysis run · ${type}`,
      category: 'product',
    })
  }

  timeline.sort((a, b) => b.date.localeCompare(a.date))
  const timelineDisplay = timeline.slice(0, 15)

  /* ── 4. Engagement trajectory data (WAU vs seats) ── */
  // Build monthly activity from analysis_results + member joins
  const { data: allAnalysis } = await supabase
    .from('analysis_results')
    .select('created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  const seatLimit = org?.seat_limit ?? (members?.length ?? 1)
  const orgCreated = createdAt
  const nowDate = new Date()

  // Build month buckets from org creation to now
  interface TrajectoryPoint { month: string; wau: number; seats: number }
  const trajectoryPoints: TrajectoryPoint[] = []
  interface MilestoneItem { monthIndex: number; label: string }
  const trajectoryMilestones: MilestoneItem[] = []
  let trialEndIdx = -1

  const startMonth = new Date(orgCreated.getFullYear(), orgCreated.getMonth(), 1)
  const endMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1)
  const monthDates: Date[] = []
  const cursor = new Date(startMonth)
  while (cursor <= endMonth) {
    monthDates.push(new Date(cursor))
    cursor.setMonth(cursor.getMonth() + 1)
  }

  // Count active days per month from analysis_results
  const activityByMonth = new Map<string, Set<string>>()
  for (const a of allAnalysis ?? []) {
    const d = new Date(a.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!activityByMonth.has(key)) activityByMonth.set(key, new Set())
    activityByMonth.get(key)!.add(d.toDateString())
  }

  // Member join dates for seat growth
  const memberJoins = (profiles ?? []).map(p => new Date(p.created_at))

  for (let i = 0; i < monthDates.length; i++) {
    const md = monthDates[i]!
    const key = `${md.getFullYear()}-${String(md.getMonth() + 1).padStart(2, '0')}`

    const monthLabel = md.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    const displayLabel = i === monthDates.length - 1
      ? 'NOW'
      : `${monthLabel} '${String(md.getFullYear()).slice(2)}`

    // WAU = unique active days in this month (proxy for weekly active users)
    const activeDays = activityByMonth.get(key)?.size ?? 0
    // Approximate WAU from active days: activeDays in month → at least 1 user active per day
    const membersCount = memberJoins.filter(j => j <= new Date(md.getFullYear(), md.getMonth() + 1, 0)).length
    const wau = Math.min(activeDays, membersCount || 1)

    // Seats: members who had joined by this month
    const seats = Math.max(membersCount, 1)

    trajectoryPoints.push({ month: displayLabel === 'NOW' ? 'NOW' : displayLabel, wau, seats })

    // Detect seat changes as milestones
    if (i > 0) {
      const prevSeats = trajectoryPoints[i - 1]!.seats
      if (seats > prevSeats) {
        trajectoryMilestones.push({ monthIndex: i, label: `+${seats - prevSeats} SEATS` })
      }
    }

    // Detect trial end (plan changed from solo)
    if (planTier !== 'solo' && org?.trial_ends_at) {
      const trialEnd = new Date(org.trial_ends_at)
      if (md.getMonth() === trialEnd.getMonth() && md.getFullYear() === trialEnd.getFullYear()) {
        trialEndIdx = i
        trajectoryMilestones.push({ monthIndex: i, label: 'UPGRADE' })
      }
    }
  }

  const hasTrajectoryData = trajectoryPoints.length >= 2 && (allAnalysis?.length ?? 0) > 0

  return (
    <>
      <AdminPageHead category="Customers" title={<>Customer <em>360°</em>.</>} />
      <div className="admin-content">

        {/* ── ACCOUNT HEADER ── */}
        <div className="c360-head">
          <div className="c360-avatar">{initials}</div>
          <div className="c360-info">
            <h2>{orgName}</h2>
            <div className="c360-meta">
              <span>PLAN <strong>{planTier.toUpperCase()}</strong></span>
              <span>OWNER <strong>{ownerProfile?.full_name ?? '—'}</strong></span>
              <span>SINCE <strong>{new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</strong></span>
              <span>LAST SEEN <strong>{lastSeen}</strong></span>
            </div>
          </div>
          <div className="c360-actions">
            <button className="btn-ghost">Edit</button>
            <button className="btn-ghost">Export</button>
          </div>
        </div>

        {/* ── KPI STRIP ── */}
        <KpiGrid columns={6}>
          <KpiCard label="Health Score" value={healthScore.toString()} variant={healthVariant} />
          <KpiCard label="Predicted LTV" value={predictedLtv} />
          <KpiCard label="Churn Risk 90d" value={`${churnRisk}%`} variant={churnRisk > 30 ? 'warn-hl' : 'default'} />
          <KpiCard label="Expansion Signal" value={expansionSignal} variant={expansionSignal === 'HIGH' ? 'ok-hl' : 'default'} />
          <KpiCard label="Lifetime Revenue" value={lifetimeRevenueStr} />
          <KpiCard label="NPS" value={nps !== null ? nps.toString() : '—'} variant={nps !== null && nps >= 8 ? 'ok-hl' : 'default'} />
        </KpiGrid>

        {/* ── §01 TEAM MEMBERS ── */}
        <SectionHead number="§01" title="Team Members" />
        <AdminCard title={<>Members</>} tag={`${members?.length ?? 0} USERS`}>
          {!members?.length ? (
            <EmptyMetric message="No members" />
          ) : (
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Role</th><th className="tn">Joined</th></tr></thead>
              <tbody>
                {members.map(m => {
                  const profile = profileMap[m.user_id]
                  return (
                    <tr key={m.user_id}>
                      <td><strong>{profile?.full_name ?? '—'}</strong></td>
                      <td>
                        <span className={`admin-pill ${m.role === 'owner' ? 'warn' : m.role === 'admin' ? 'test' : 'draft'}`}>
                          {m.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="tn">
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </AdminCard>

        {/* ── §02 HEALTH & CHURN ── */}
        <SectionHead number="§02" title={<>Health <em>trajectory</em> &amp; churn explainer</>} />
        <div className="admin-grid-2">
          <AdminCard title={<>Health trajectory</>}>
            {trajectoryData ? (
              <HealthTrajectoryChart data={trajectoryData} />
            ) : (
              <EmptyMetric message="No trajectory data" hint="Health snapshots will appear after the first weekly roll-up." />
            )}
          </AdminCard>
          <AdminCard title={<>Churn explainer</>}>
            {churnExplainerItems ? (
              <FeatureImportanceBars items={churnExplainerItems} />
            ) : (
              <EmptyMetric message="No explainer data" />
            )}
          </AdminCard>
        </div>

        {/* ── §03 USAGE PATTERNS ── */}
        <SectionHead number="§03" title={<>Usage <em>patterns</em></>} />

        <AdminCard title={<>Daily active usage · <em>heatmap</em></>}>
          {usageHeatmapData ? (
            <UsageHeatmap data={usageHeatmapData} />
          ) : (
            <EmptyMetric message="No usage data" hint="Heatmap will populate as the account runs analysis." />
          )}
        </AdminCard>

        <AdminCard title={<>Module engagement</>}>
          {moduleEngagement.length > 0 ? (() => {
            const maxCount = Math.max(...moduleEngagement.map(m => m.count), 1)
            const MODULE_COLORS: Record<string, string> = {
              'Keywords': 'var(--color-ink)',
              'Llm Track': '#1d3fd9',
              'Llm Tracker': '#1d3fd9',
              'Reviews Analysis': '#1a6b3c',
              'Creative Lab': '#1a6b3c',
              'Competitors': 'var(--color-ink)',
              'Conversion': 'var(--color-gold, #b58300)',
              'Attribution': 'var(--color-gold, #b58300)',
              'Intent Map': '#6b5ce7',
              'Agent Ready': '#c0392b',
            }
            const fmtCount = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(1)}K` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString()
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '4px 0' }}>
                {moduleEngagement.map(mod => {
                  const barPct = Math.max(2, Math.round((mod.count / maxCount) * 100))
                  const color = MODULE_COLORS[mod.name] ?? 'var(--color-ink-3)'
                  return (
                    <div key={mod.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--color-line-soft, transparent)' }}>
                      <div style={{ width: 140, flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{mod.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.06em', marginTop: 2 }}>
                          ACTIVE · {mod.count} RUNS
                        </div>
                      </div>
                      <div style={{ flex: 1, height: 10, background: 'var(--color-line)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${barPct}%`, height: '100%', background: color, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, width: 50, textAlign: 'right', flexShrink: 0 }}>
                        {fmtCount(mod.count)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })() : (
            <EmptyMetric message="No analysis data" hint="Module engagement will show once analysis has been run." />
          )}
        </AdminCard>

        {/* ── §04 ENGAGEMENT TRAJECTORY ── */}
        <SectionHead number="§04" title={<>Engagement <em>trajectory</em> · weekly active users vs seat count</>} />
        <AdminCard title={<>Engagement trajectory</>} tag="12-MONTH VIEW" bodyClass="chart">
          {hasTrajectoryData ? (
            <EngagementTrajectoryChart
              data={trajectoryPoints}
              milestones={trajectoryMilestones}
              {...(trialEndIdx > 0 ? { trialEndIndex: trialEndIdx } : {})}
            />
          ) : (
            <EmptyMetric message="Not enough data" hint="Engagement trajectory requires at least 2 months of activity data." />
          )}
        </AdminCard>

        {/* ── §05 TRACKED APPS ── */}
        <SectionHead number="§05" title="Tracked Apps" />
        <AdminCard title={<>Apps</>} tag={`${apps?.length ?? 0} ACTIVE`}>
          {!apps?.length ? (
            <EmptyMetric message="No apps tracked yet" />
          ) : (
            <table className="admin-table">
              <thead><tr><th>App</th><th>Platform</th><th>Category</th><th className="tn">Added</th></tr></thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {a.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.icon_url} alt="" width={24} height={24} style={{ borderRadius: 6 }} referrerPolicy="no-referrer" crossOrigin="anonymous" />
                      ) : null}
                      <strong>{a.name}</strong>
                    </td>
                    <td><span className={`admin-pill ${a.platform === 'ios' ? 'test' : 'draft'}`}>{a.platform.toUpperCase()}</span></td>
                    <td>{a.category ?? '—'}</td>
                    <td className="tn">{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminCard>

        {/* ── §06 FINANCIAL HISTORY ── */}
        <SectionHead number="§06" title={<>Financial <em>history</em></>} />
        <div className="admin-grid-hero">
          <AdminCard title={<>MRR <em>evolution</em></>} tag="UPGRADES, EXPANSIONS">
            <EmptyMetric message="No billing events" hint="MRR evolution requires Stripe webhook integration to track upgrades, expansions, and renewals." />
          </AdminCard>
          <AdminCard title={<>Lifetime <em>value</em></>} tag="P10 / P50 / P90">
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, letterSpacing: '-0.03em' }}>
                {predictedLtv}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.1em', marginTop: 4 }}>
                PROJECTED LTV · {tenureMonths > 12 ? `${Math.round(tenureMonths / 12)} YEAR` : `${tenureMonths} MO`} · P50
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20, padding: '0 20px' }}>
                {[
                  { label: 'P10 (low)', pct: 50, color: 'var(--color-warn)', val: formatLtv(computeLtv(planTier, tenureMonths) * 0.5) },
                  { label: 'P50 (median)', pct: 100, color: 'var(--color-accent)', val: predictedLtv },
                  { label: 'P90 (high)', pct: 160, color: 'var(--color-ok)', val: formatLtv(computeLtv(planTier, tenureMonths) * 1.6) },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, width: 80, flexShrink: 0 }}>{row.label}</span>
                    <div style={{ flex: 1, height: 8, background: 'var(--color-line)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(row.pct, 100)}%`, height: '100%', background: row.color, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, width: 50, textAlign: 'right', fontWeight: 600 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </AdminCard>
        </div>

        {/* ── §07 INTERACTION TIMELINE ── */}
        <SectionHead number="§07" title={<>Complete interaction <em>timeline</em></>} />
        <AdminCard title={<>Timeline</>} tag={`${timelineDisplay.length} EVENTS`}>
          {timelineDisplay.length === 0 ? (
            <EmptyMetric message="No events" />
          ) : (
            <div style={{ padding: '4px 0' }}>
              {timelineDisplay.map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '10px 0', borderBottom: i < timelineDisplay.length - 1 ? '1px solid var(--color-line-soft, var(--color-line))' : 'none' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', width: 56, flexShrink: 0, letterSpacing: '0.04em', paddingTop: 2 }}>
                    {ev.date}
                  </div>
                  <div style={{ flex: 1, fontSize: 13 }}>{ev.message}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-4)', letterSpacing: '0.08em', flexShrink: 0 }}>
                    {ev.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

      </div>
    </>
  )
}
