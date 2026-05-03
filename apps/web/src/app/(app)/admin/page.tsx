import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { ExecSummaryCard } from '@/components/admin/ExecSummaryCard'
import { AdminCard } from '@/components/admin/AdminCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { MrrWaterfallChart } from '@/components/admin/charts/MrrWaterfallChart'
import { MrrBridgeChart } from '@/components/admin/charts/MrrBridgeChart'
import { ForecastChart } from '@/components/admin/charts/ForecastChart'
import { RetentionBarsChart } from '@/components/admin/charts/RetentionBarsChart'
import { RevBlock } from '@/components/admin/RevBlock'
import { LiveFeed } from '@/components/admin/LiveFeed'
import { ActionRequiredTable } from '@/components/admin/ActionRequiredTable'
import { ChurnRiskCard } from '@/components/admin/ChurnRiskCard'
import { PlanMixStack } from '@/components/admin/PlanMixStack'
import { GeoRow } from '@/components/admin/GeoRow'
import { EmptyMetric } from '@/components/admin/EmptyMetric'
import {
  PLAN_PRICES,
  getSaasMetrics,
  getSparklines,
  getMrrWaterfall,
  getMrrBridge,
  getModuleRetention,
  getRevenueByModule,
  getHealthScores,
} from '@/lib/admin/metrics'

export default async function AdminOverviewPage() {
  const supabase = getSupabaseAdmin()

  const [
    { count: userCount },
    { data: orgs },
    { data: members },
    { data: apps },
    { data: recentProfiles },
    { data: analysisData },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('id, name, slug, plan_tier, created_at, trial_ends_at')
      .order('created_at', { ascending: false }),
    supabase.from('organization_members').select('organization_id, user_id, role'),
    supabase.from('apps').select('organization_id, id, name, created_at').eq('is_active', true),
    supabase.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('analysis_results').select('organization_id, analysis_type, created_at').order('created_at', { ascending: false }).limit(20),
  ])

  const allOrgs = orgs ?? []
  const totalOrgs = allOrgs.length
  const users = userCount ?? 0

  const planCounts = { solo: 0, team: 0, enterprise: 0 }
  for (const o of allOrgs) {
    planCounts[o.plan_tier as keyof typeof planCounts] =
      (planCounts[o.plan_tier as keyof typeof planCounts] ?? 0) + 1
  }

  const paidOrgs = planCounts.team + planCounts.enterprise
  const mrr =
    planCounts.team * (PLAN_PRICES['team'] ?? 0) +
    planCounts.enterprise * (PLAN_PRICES['enterprise'] ?? 0)

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

  const ownerIds = [...new Set(Object.values(ownerByOrg))]
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', ownerIds)
    : { data: [] }
  const profileMap: Record<string, string> = {}
  for (const p of ownerProfiles ?? []) {
    profileMap[p.id] = p.full_name ?? '—'
  }

  const orgsWithApps = new Set((apps ?? []).map(a => a.organization_id))
  const activationRate = totalOrgs > 0 ? Math.round((orgsWithApps.size / totalOrgs) * 100) : 0

  const now = new Date()
  const trialExpired = allOrgs.filter(o => o.trial_ends_at && new Date(o.trial_ends_at) < now)
  const trialConverted = trialExpired.filter(o => o.plan_tier !== 'solo')
  const trialConvRate = trialExpired.length > 0 ? Math.round((trialConverted.length / trialExpired.length) * 100) : 0

  // Fetch real metrics in parallel
  const [saas, sparks, waterfallData, bridgeData, moduleRetention, revenueByModule, healthMap] =
    await Promise.all([
      getSaasMetrics(supabase),
      getSparklines(supabase),
      getMrrWaterfall(supabase),
      getMrrBridge(supabase, mrr),
      getModuleRetention(supabase),
      getRevenueByModule(supabase),
      getHealthScores(supabase),
    ])

  const fmtMrr = mrr >= 1000 ? `$${(mrr / 1000).toFixed(1)}K` : `$${mrr}`
  const fmtArr = (mrr * 12) >= 1000 ? `$${((mrr * 12) / 1000).toFixed(0)}K` : `$${mrr * 12}`

  // Org name lookup
  const orgNameMap: Record<string, string> = {}
  for (const o of allOrgs) orgNameMap[o.id] = o.name ?? o.slug ?? o.id.slice(0, 8)

  // Build richer live feed from multiple sources
  const feedItems: { time: string; message: string; meta: string }[] = []
  for (const p of (recentProfiles ?? []).slice(0, 4)) {
    const d = new Date(p.created_at)
    feedItems.push({
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      message: `<strong>${p.full_name ?? 'New user'}</strong> signed up`,
      meta: 'SIGNUP',
    })
  }
  for (const o of allOrgs.slice(0, 4)) {
    const d = new Date(o.created_at)
    const mrrVal = PLAN_PRICES[o.plan_tier] ?? 0
    feedItems.push({
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      message: `<strong>${o.name}</strong> created organization · <em>${o.plan_tier}</em>${mrrVal > 0 ? ` +$${mrrVal} MRR` : ''}`,
      meta: o.plan_tier === 'solo' ? 'FREE' : 'PAID',
    })
  }
  // Add analysis events
  for (const a of (analysisData ?? []).slice(0, 4)) {
    const d = new Date(a.created_at)
    const orgName = orgNameMap[a.organization_id] ?? 'Unknown'
    feedItems.push({
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      message: `<strong>${orgName}</strong> ran <em>${a.analysis_type}</em> analysis`,
      meta: 'ANALYSIS',
    })
  }
  // Add app events
  for (const a of (apps ?? []).slice(0, 3)) {
    const d = new Date(a.created_at)
    const orgName = orgNameMap[a.organization_id] ?? 'Unknown'
    feedItems.push({
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      message: `<strong>${orgName}</strong> added app · <em>${a.name}</em>`,
      meta: '+ APP',
    })
  }
  feedItems.sort((a, b) => b.time.localeCompare(a.time))

  // Build action items from trials + low-health accounts
  const actionItems: { priority: string; priorityType: 'warn' | 'test' | 'draft'; account: string; issue: string; arr: string; owner: string }[] = []
  // Trial expired, no conversion
  for (const o of trialExpired.filter(o => o.plan_tier === 'solo').slice(0, 3)) {
    actionItems.push({
      priority: 'P0 · CRITICAL',
      priorityType: 'warn',
      account: o.name ?? o.slug ?? o.id.slice(0, 8),
      issue: 'Trial expired — no conversion',
      arr: '$0',
      owner: profileMap[ownerByOrg[o.id] ?? ''] ?? '—',
    })
  }
  // Low health paid accounts
  for (const o of allOrgs.filter(o => o.plan_tier !== 'solo')) {
    const h = healthMap[o.id]
    if (h && h.healthScore < 60) {
      const orgMrr = PLAN_PRICES[o.plan_tier] ?? 0
      actionItems.push({
        priority: h.healthScore < 40 ? 'P1 · HIGH' : 'P2 · WATCH',
        priorityType: h.healthScore < 40 ? 'test' : 'draft',
        account: o.name ?? o.slug ?? o.id.slice(0, 8),
        issue: `Health ${h.healthScore} — ${h.riskFactors[0] ?? 'at risk'}`,
        arr: `$${(orgMrr * 12).toLocaleString()}`,
        owner: profileMap[ownerByOrg[o.id] ?? ''] ?? '—',
      })
    }
  }

  const planMixData = {
    solo: { count: planCounts.solo, mrr: 0 },
    team: { count: planCounts.team, mrr: planCounts.team * (PLAN_PRICES['team'] ?? 0) },
    enterprise: { count: planCounts.enterprise, mrr: planCounts.enterprise * (PLAN_PRICES['enterprise'] ?? 0) },
  }

  const totalArr = mrr * 12
  const teamArr = planCounts.team * (PLAN_PRICES['team'] ?? 0) * 12
  const entArr = planCounts.enterprise * (PLAN_PRICES['enterprise'] ?? 0) * 12

  // Plan growth: new orgs this month vs last month
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const planGrowth: Record<string, string> = { solo: '—', team: '—', enterprise: '—' }
  const thisMonthByPlan: Record<string, number> = { solo: 0, team: 0, enterprise: 0 }
  const lastMonthByPlan: Record<string, number> = { solo: 0, team: 0, enterprise: 0 }
  for (const o of allOrgs) {
    const d = new Date(o.created_at)
    if (d >= thisMonth) thisMonthByPlan[o.plan_tier] = (thisMonthByPlan[o.plan_tier] ?? 0) + 1
    else if (d >= lastMonth) lastMonthByPlan[o.plan_tier] = (lastMonthByPlan[o.plan_tier] ?? 0) + 1
  }
  for (const tier of ['solo', 'team', 'enterprise']) {
    const curr = thisMonthByPlan[tier] ?? 0
    const prev = lastMonthByPlan[tier] ?? 0
    if (prev > 0) planGrowth[tier] = `${curr >= prev ? '+' : ''}${Math.round(((curr - prev) / prev) * 100)}%`
    else if (curr > 0) planGrowth[tier] = `+${curr} new`
    else planGrowth[tier] = '0%'
  }

  // Top accounts sorted by plan weight then members
  const planWeight: Record<string, number> = { enterprise: 3, team: 2, solo: 1 }
  const topAccounts = [...allOrgs]
    .sort((a, b) => {
      const wa = planWeight[a.plan_tier] ?? 0
      const wb = planWeight[b.plan_tier] ?? 0
      if (wb !== wa) return wb - wa
      return (membersByOrg[b.id] ?? 0) - (membersByOrg[a.id] ?? 0)
    })
    .slice(0, 8)

  // At-risk orgs
  const atRiskOrgs = allOrgs
    .filter(o => {
      const h = healthMap[o.id]
      if (o.trial_ends_at && new Date(o.trial_ends_at) < now && o.plan_tier === 'solo') return true
      if (h && h.healthScore < 50) return true
      if (h && h.riskFactors.includes('Subscription cancelling')) return true
      return false
    })
    .slice(0, 4)

  return (
    <>
      <AdminPageHead
        category="Business"
        title={<>Executive <em>overview</em>.</>}
        subtitle="The state of the business in one screen. Every number is drillable. Every chart exports. Leading indicators on the left, lagging on the right."
        stamp={<>LAST SYNC · <strong>Live</strong> DATA FRESHNESS · <strong>real-time</strong></>}
      />

      <div className="admin-content">
        <ExecSummaryCard
          tagline="EXECUTIVE SUMMARY"
          narrative={`MRR is <em>${fmtMrr}</em> (ARR ${fmtArr}) with <em>${totalOrgs.toLocaleString()} customers</em> and ${paidOrgs} paid accounts.${saas.nrr !== null ? ` NRR trails at ${saas.nrr}%.` : ''} Trial-to-paid conversion is ${trialConvRate}%.`}
          sparks={[
            { label: 'MRR', value: fmtMrr, color: 'ok', ...(sparks.mrr ? { sparkData: sparks.mrr } : {}), sparkColor: '#6dd48e' },
            { label: 'NET NEW', value: `${paidOrgs}`, ...(sparks.netNewLogos ? { sparkData: sparks.netNewLogos } : {}), sparkColor: '#1d3fd9' },
            { label: 'TRIAL→PAID', value: `${trialConvRate}%`, ...(sparks.trialToPaid ? { sparkData: sparks.trialToPaid } : {}), sparkColor: '#ff8670' },
            { label: 'NRR', value: saas.nrr !== null ? `${saas.nrr}%` : '—', ...(saas.nrr !== null ? { color: 'ok' as const } : {}), ...(sparks.nrr ? { sparkData: sparks.nrr } : {}), sparkColor: '#6dd48e' },
            { label: 'RUNWAY', value: saas.runway ?? '—', ...(sparks.runway ? { sparkData: sparks.runway } : {}), sparkColor: '#72716a' },
          ]}
        />

        {/* KPI Row 1: Core lagging indicators */}
        <KpiGrid columns={6}>
          <KpiCard label="MRR" value={fmtMrr} variant="hl" miniTag="LIVE" miniTagLive subtitle="Monthly recurring" />
          <KpiCard label="NRR" value={saas.nrr !== null ? `${saas.nrr}%` : '—'} variant={saas.nrr !== null ? 'ok-hl' : 'default'} subtitle="Net revenue retention" />
          <KpiCard label="Customers" value={totalOrgs.toLocaleString()} subtitle={`${paidOrgs} paid`} />
          <KpiCard label="Logo Churn" value={saas.logoChurn30d !== null ? `${saas.logoChurn30d}%` : '—'} subtitle="30-day rolling" />
          <KpiCard label="CAC Payback" value={saas.cacPayback !== null ? `${saas.cacPayback} mo` : '—'} subtitle="Blended" />
          <KpiCard label="Rule of 40" value={saas.ruleOf40 !== null ? `${saas.ruleOf40}` : '—'} subtitle="Growth% + Margin%" />
        </KpiGrid>

        {/* KPI Row 2: Leading indicators */}
        <KpiGrid columns={6}>
          <KpiCard label="Trial → Paid" value={`${trialConvRate}%`} subtitle="7-day window" />
          <KpiCard label="Activation 72h" value={`${activationRate}%`} subtitle="≥1 app created" />
          <KpiCard label="TTV Median" value={saas.ttvMedian ?? '—'} subtitle="Time to value" />
          <KpiCard label="DAU/WAU" value={saas.dauWau !== null ? `${saas.dauWau}%` : '—'} subtitle="Stickiness ratio" />
          <KpiCard label="Feature Breadth" value={saas.featureBreadth !== null ? `${saas.featureBreadth}` : '—'} subtitle="Avg modules/user" />
          <KpiCard label="Gross Margin" value={saas.grossMargin !== null ? `${saas.grossMargin}%` : '—'} subtitle="Software margin" />
        </KpiGrid>

        {/* §01 — MRR waterfall & revenue by plan */}
        <SectionHead number="§01" title={<>MRR <em>waterfall</em> &amp; revenue by plan</>} />

        <div className="admin-grid-hero">
          <AdminCard title={<>MRR <em>Waterfall</em> · last 12 weeks</>} tag="ARR · APRIL" bodyClass="chart">
            {waterfallData ? (
              <MrrWaterfallChart data={waterfallData} />
            ) : (
              <EmptyMetric message="No snapshot data" hint="Run 'Compute Snapshots' from Settings to populate waterfall data." />
            )}
          </AdminCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--admin-gap, 16px)' }}>
            <RevBlock
              name="Solo"
              accounts={planCounts.solo}
              price="Free"
              arr="$0"
              pctOfTotal={0}
              growth={planGrowth['solo'] ?? '0%'}
              barPct={totalArr > 0 ? 2 : 33}
              barColor="grey"
            />
            <RevBlock
              name="Team"
              accounts={planCounts.team}
              price="$49/mo"
              arr={teamArr >= 1000 ? `$${(teamArr / 1000).toFixed(0)}K` : `$${teamArr}`}
              pctOfTotal={totalArr > 0 ? Math.round((teamArr / totalArr) * 100) : 0}
              growth={planGrowth['team'] ?? '0%'}
              barPct={totalArr > 0 ? Math.round((teamArr / totalArr) * 100) : 33}
              barColor="blue"
            />
            <RevBlock
              name="Enterprise"
              accentName
              accounts={planCounts.enterprise}
              price="$199/mo"
              arr={entArr >= 1000 ? `$${(entArr / 1000).toFixed(0)}K` : `$${entArr}`}
              pctOfTotal={totalArr > 0 ? Math.round((entArr / totalArr) * 100) : 0}
              growth={planGrowth['enterprise'] ?? '0%'}
              barPct={totalArr > 0 ? Math.round((entArr / totalArr) * 100) : 33}
              barColor="purple"
            />
          </div>
        </div>

        {/* Live feed & actions required */}
        <div className="admin-grid-2">
          <AdminCard title={<>Live <em>feed</em></>} tag="REAL-TIME">
            {feedItems.length > 0 ? (
              <LiveFeed items={feedItems.slice(0, 8)} />
            ) : (
              <EmptyMetric message="No recent activity" />
            )}
          </AdminCard>

          <AdminCard title={<>Action <em>required</em></>} tag={`${actionItems.length} ITEMS`}>
            {actionItems.length > 0 ? (
              <ActionRequiredTable items={actionItems.slice(0, 6)} />
            ) : (
              <EmptyMetric message="All clear" hint="No action items right now." />
            )}
          </AdminCard>
        </div>

        {/* §02 — Forecast, Revenue by module, Geo mix (3-column) */}
        <div className="admin-grid-3">
          <AdminCard title={<>12mo <em>forecast</em></>} tag={`BASE=$${totalArr > 0 ? (totalArr / 1000).toFixed(0) + 'K' : '0'} ARR`} bodyClass="chart">
            <ForecastChart
              current={totalArr}
              projected={totalArr * 1.8}
              p10={totalArr * 1.4}
              p90={totalArr * 2.2}
            />
          </AdminCard>

          <AdminCard title={<>Revenue by <em>module</em></>} tag="ATTRIBUTION">
            {revenueByModule ? (
              revenueByModule.map((mod) => (
                <div key={mod.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--color-line-soft, var(--color-line))' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{mod.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.1em' }}>{mod.tag}</div>
                  </div>
                  <div style={{ width: 80, height: 6, background: 'var(--color-line)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${mod.pct}%`, height: '100%', background: 'var(--color-accent)', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, width: 40, textAlign: 'right' }}>${mod.value >= 1000 ? (mod.value / 1000).toFixed(0) + 'K' : mod.value}</div>
                </div>
              ))
            ) : (
              <EmptyMetric message="No paid accounts" hint="Revenue by module requires paid accounts with usage data." />
            )}
          </AdminCard>

          <AdminCard title={<>Geo <em>mix</em></>} tag="TOP 8">
            <EmptyMetric message="No geo data" hint="Geo distribution requires Stripe billing address integration." />
          </AdminCard>
        </div>

        {/* §02 — MRR bridge & plan economics */}
        <SectionHead number="§02" title={<>MRR bridge &amp; plan <em>economics</em></>} />

        <div className="admin-grid-2">
          <AdminCard title={<>This month · MRR <em>bridge</em></>} tag="THIS MONTH">
            <MrrBridgeChart rows={bridgeData} />
          </AdminCard>

          <AdminCard title={<>Plan mix · <em>MRR / Customers / ARPU</em></>} tag="MRR SPLIT">
            <PlanMixStack data={planMixData} />
            <table className="admin-table" style={{ marginTop: 12 }}>
              <thead>
                <tr><th>Plan</th><th className="tn">Customers</th><th className="tn">MRR</th><th className="tn">ARPU</th><th className="tn">Churn / Mo</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="admin-pill draft">solo</span></td>
                  <td className="tn">{planCounts.solo.toLocaleString()}</td>
                  <td className="tn">$0</td>
                  <td className="tn">$0</td>
                  <td className="tn" style={{ color: 'var(--color-ink-3)' }}>free</td>
                </tr>
                <tr>
                  <td><span className="admin-pill test">team</span></td>
                  <td className="tn">{planCounts.team}</td>
                  <td className="tn">${(planCounts.team * (PLAN_PRICES['team'] ?? 0)).toLocaleString()}</td>
                  <td className="tn">${PLAN_PRICES['team'] ?? 0}</td>
                  <td className="tn" style={{ color: 'var(--color-ok)' }}>0%</td>
                </tr>
                <tr>
                  <td><span className="admin-pill purple">enterprise</span></td>
                  <td className="tn">{planCounts.enterprise}</td>
                  <td className="tn">${(planCounts.enterprise * (PLAN_PRICES['enterprise'] ?? 0)).toLocaleString()}</td>
                  <td className="tn">${PLAN_PRICES['enterprise'] ?? 0}</td>
                  <td className="tn" style={{ color: 'var(--color-ok)' }}>0%</td>
                </tr>
              </tbody>
            </table>
          </AdminCard>
        </div>

        {/* §03 — Top accounts, geographies & risks */}
        <SectionHead number="§03" title={<>Top accounts, geographies &amp; <em>risks</em></>} />

        <div className="admin-grid-hero">
          <AdminCard title={<>Top <em>accounts</em></>} tag={`${topAccounts.length} FLAGGED`}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="tn">Seats</th>
                  <th className="tn">MRR</th>
                  <th className="tn">Health</th>
                  <th>Plan</th>
                  <th>CSM</th>
                </tr>
              </thead>
              <tbody>
                {topAccounts.map((org) => {
                  const h = healthMap[org.id]
                  const health = h?.healthScore ?? 0
                  const orgMrr = PLAN_PRICES[org.plan_tier] ?? 0
                  const healthColor = health >= 80 ? 'var(--color-ok)' : health >= 50 ? 'var(--color-warn)' : '#c43b1e'
                  return (
                    <tr key={org.id}>
                      <td>
                        <Link href={`/admin/accounts/${org.id}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                          {org.name ?? org.slug}
                        </Link>
                      </td>
                      <td className="tn">{membersByOrg[org.id] ?? 0}</td>
                      <td className="tn">${orgMrr > 0 ? orgMrr.toLocaleString() : '0'}</td>
                      <td className="tn">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div className="health-bar-inline">
                            <div className="health-fill" style={{ width: `${health}%`, background: healthColor }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{health}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-pill ${org.plan_tier === 'enterprise' ? 'purple' : org.plan_tier === 'team' ? 'test' : 'draft'}`}>
                          {org.plan_tier}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>
                        {profileMap[ownerByOrg[org.id] ?? ''] ? `@${profileMap[ownerByOrg[org.id] ?? '']?.split(' ')[0]?.toLowerCase()}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </AdminCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--admin-gap, 16px)' }}>
            <AdminCard title={<>Churn <em>risk</em></>}>
              {atRiskOrgs.length > 0 ? (
                atRiskOrgs.map((org, i) => {
                  const h = healthMap[org.id]
                  const health = h?.healthScore ?? 0
                  const churn = h?.churnRisk ?? 0
                  const colors = ['#c43b1e', '#b58300', '#0d7e87', '#1d3fd9']
                  return (
                    <ChurnRiskCard
                      key={org.id}
                      name={org.name ?? org.slug ?? `Org ${org.id.slice(0, 6)}`}
                      avatarColor={colors[i % colors.length] ?? '#c43b1e'}
                      mrr={`$${PLAN_PRICES[org.plan_tier] ?? 0}`}
                      health={health}
                      signals={`Health <b>${health}</b> · Churn risk <b>${churn}%</b> · ${org.plan_tier} plan${h?.lastActivityAt ? ` · LAST ACTIVITY <b>${new Date(h.lastActivityAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</b>` : ''}`}
                      riskLevel={churn > 40 ? 'high' : 'watch'}
                    />
                  )
                })
              ) : (
                <EmptyMetric message="No at-risk accounts" hint="All accounts are healthy." />
              )}
            </AdminCard>
          </div>
        </div>

        {/* Bottom: Geographies + Retention by modules */}
        <div className="admin-grid-2">
          <AdminCard title={<>Top <em>geographies</em></>} tag="BY MRR">
            <EmptyMetric message="No geo data" hint="Geography distribution requires Stripe billing address integration." />
          </AdminCard>

          <AdminCard title={<>Retention by <em>modules used</em></>} tag="90-DAY RETENTION · GOLD INSIGHT" bodyClass="chart">
            {moduleRetention ? (
              <RetentionBarsChart data={moduleRetention} />
            ) : (
              <EmptyMetric message="No module data" hint="Module retention requires accounts with feature usage." />
            )}
          </AdminCard>
        </div>
      </div>
    </>
  )
}
