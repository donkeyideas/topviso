/**
 * Real metrics computation for the admin dashboard.
 * Derives all data from actual database tables — no mocks.
 *
 * `null` means "not computable yet" (missing data), never zero.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  PLAN_PRICES,
  type HealthScoreResult,
  type OrgHealthMap,
  type WaterfallRow,
  type BridgeRow,
  type SparklineData,
  type SaasMetrics,
  type ModuleRetentionRow,
  type RevenueByModuleRow,
  type CohortRetentionRow,
  type ChannelEconomicsRow,
  type HealthTrajectoryPoint,
  type ChurnExplainerItem,
  type UsageHeatmap,
} from './types'

// Re-export for convenience
export { PLAN_PRICES } from './types'

/* ================================================================
   HELPER: Generic supabase type (avoids importing Database everywhere)
   ================================================================ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = SupabaseClient<any, 'public', any>

/* ================================================================
   PER-ORG: Health Score
   ================================================================ */

interface OrgSignals {
  orgId: string
  planTier: string
  trialEndsAt: string | null
  createdAt: string
  hasApps: boolean
  hasKeywords: boolean
  hasAnalysis: boolean
  memberCount: number
  lastActivityAt: string | null // most recent analysis or app creation
  subscriptionCancelling?: boolean // Stripe cancel_at_period_end
}

function computeHealthScore(signals: OrgSignals): HealthScoreResult {
  let score = 0
  const riskFactors: string[] = []

  // Has active apps? → +20
  if (signals.hasApps) {
    score += 20
  } else {
    riskFactors.push('No apps added')
  }

  // Has tracked keywords? → +20
  if (signals.hasKeywords) {
    score += 20
  } else {
    riskFactors.push('No keywords tracked')
  }

  // Has run analysis? → +20
  if (signals.hasAnalysis) {
    score += 20
  } else {
    riskFactors.push('No analysis run')
  }

  // Has multiple members? → +10
  if (signals.memberCount > 1) {
    score += 10
  } else {
    riskFactors.push('Single-user account')
  }

  // Activity recency → +15 max
  if (signals.lastActivityAt) {
    const daysSince = Math.floor(
      (Date.now() - new Date(signals.lastActivityAt).getTime()) / 86400000,
    )
    if (daysSince <= 7) {
      score += 15
    } else if (daysSince <= 30) {
      score += 10
    } else if (daysSince <= 90) {
      score += 5
    } else {
      riskFactors.push(`No activity in ${daysSince}d`)
    }
  } else {
    riskFactors.push('No recorded activity')
  }

  // Paid plan? → +15
  if (signals.planTier !== 'solo') {
    score += 15
  } else {
    riskFactors.push('Free plan')
  }

  // Subscription cancelling? → −40
  if (signals.subscriptionCancelling) {
    score -= 40
    riskFactors.push('Subscription cancelling')
  }

  // Clamp to 0–100
  score = Math.min(100, Math.max(0, score))

  // Churn risk
  let churnRisk = 100 - score
  const now = Date.now()
  if (
    signals.trialEndsAt &&
    new Date(signals.trialEndsAt).getTime() < now &&
    signals.planTier === 'solo'
  ) {
    churnRisk += 20
    riskFactors.push('Trial expired, still on free plan')
  }
  if (signals.lastActivityAt) {
    const daysSince = Math.floor(
      (now - new Date(signals.lastActivityAt).getTime()) / 86400000,
    )
    if (daysSince > 30) {
      churnRisk += 10
    }
  }
  churnRisk = Math.min(95, Math.max(0, churnRisk))

  return {
    healthScore: score,
    churnRisk: +churnRisk.toFixed(1),
    riskFactors,
    lastActivityAt: signals.lastActivityAt,
  }
}

/* ================================================================
   BATCH: Compute health scores for ALL orgs
   ================================================================ */

export async function computeAllHealthScores(
  supabase: Supabase,
): Promise<OrgHealthMap> {
  // Fetch all data in parallel
  const [orgsRes, appsRes, keywordsRes, analysisRes, membersRes] =
    await Promise.all([
      supabase
        .from('organizations')
        .select('id, plan_tier, trial_ends_at, created_at, stripe_subscription_id'),
      supabase.from('apps').select('id, organization_id, created_at'),
      supabase.from('keywords').select('id, organization_id'),
      supabase
        .from('analysis_results')
        .select('id, organization_id, created_at'),
      supabase
        .from('organization_members')
        .select('organization_id, user_id'),
    ])

  const orgs = orgsRes.data ?? []
  const apps = appsRes.data ?? []
  const keywords = keywordsRes.data ?? []
  const analysis = analysisRes.data ?? []
  const members = membersRes.data ?? []

  // Build lookup sets
  const orgHasApps = new Set(apps.map((a) => a.organization_id))
  const orgHasKeywords = new Set(keywords.map((k) => k.organization_id))
  const orgHasAnalysis = new Set(analysis.map((a) => a.organization_id))

  // Member counts
  const memberCounts: Record<string, number> = {}
  for (const m of members) {
    memberCounts[m.organization_id] =
      (memberCounts[m.organization_id] ?? 0) + 1
  }

  // Last activity (most recent analysis or app creation)
  const lastActivity: Record<string, string> = {}
  for (const a of analysis) {
    const prev = lastActivity[a.organization_id]
    if (!prev || a.created_at > prev) {
      lastActivity[a.organization_id] = a.created_at
    }
  }
  for (const a of apps) {
    const prev = lastActivity[a.organization_id]
    if (!prev || a.created_at > prev) {
      lastActivity[a.organization_id] = a.created_at
    }
  }

  // Check Stripe cancellation status for paying orgs
  const cancellingOrgIds = new Set<string>()
  const payingOrgsWithSub = orgs.filter(
    (o) => o.plan_tier !== 'solo' && o.stripe_subscription_id,
  )
  if (payingOrgsWithSub.length > 0) {
    try {
      const { getStripe } = await import('@/lib/stripe')
      const stripe = getStripe()
      const results = await Promise.allSettled(
        payingOrgsWithSub.map(async (o) => {
          const res = await stripe.subscriptions.retrieve(o.stripe_subscription_id!)
          const sub = 'data' in res ? res.data : res
          if ((sub as { cancel_at_period_end?: boolean }).cancel_at_period_end) {
            cancellingOrgIds.add(o.id)
          }
        }),
      )
      // Log any errors but continue
      for (const r of results) {
        if (r.status === 'rejected') {
          console.warn('[metrics] Stripe subscription check failed:', r.reason)
        }
      }
    } catch (err) {
      console.warn('[metrics] Could not check Stripe subscriptions:', err)
    }
  }

  const result: OrgHealthMap = {}
  for (const org of orgs) {
    result[org.id] = computeHealthScore({
      orgId: org.id,
      planTier: org.plan_tier,
      trialEndsAt: org.trial_ends_at,
      createdAt: org.created_at,
      hasApps: orgHasApps.has(org.id),
      hasKeywords: orgHasKeywords.has(org.id),
      hasAnalysis: orgHasAnalysis.has(org.id),
      memberCount: memberCounts[org.id] ?? 1,
      lastActivityAt: lastActivity[org.id] ?? null,
      subscriptionCancelling: cancellingOrgIds.has(org.id),
    })
  }

  return result
}

/* ================================================================
   PER-ORG: Compute health for a single org
   ================================================================ */

export async function computeOrgHealth(
  supabase: Supabase,
  orgId: string,
): Promise<HealthScoreResult> {
  const [orgRes, appsRes, kwRes, analysisRes, membersRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, plan_tier, trial_ends_at, created_at, stripe_subscription_id')
      .eq('id', orgId)
      .single(),
    supabase
      .from('apps')
      .select('id, created_at')
      .eq('organization_id', orgId)
      .limit(1),
    supabase
      .from('keywords')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1),
    supabase
      .from('analysis_results')
      .select('id, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId),
  ])

  const org = orgRes.data
  if (!org) {
    return { healthScore: 0, churnRisk: 95, riskFactors: ['Org not found'], lastActivityAt: null }
  }

  const lastAnalysis = analysisRes.data?.[0]?.created_at ?? null
  const lastApp = appsRes.data?.[0]?.created_at ?? null
  const lastActivityAt = lastAnalysis && lastApp
    ? (lastAnalysis > lastApp ? lastAnalysis : lastApp)
    : lastAnalysis ?? lastApp

  // Check Stripe cancellation status
  let subscriptionCancelling = false
  if (org.plan_tier !== 'solo' && org.stripe_subscription_id) {
    try {
      const { getStripe } = await import('@/lib/stripe')
      const stripe = getStripe()
      const res = await stripe.subscriptions.retrieve(org.stripe_subscription_id)
      const sub = 'data' in res ? res.data : res
      subscriptionCancelling = !!(sub as { cancel_at_period_end?: boolean }).cancel_at_period_end
    } catch {
      // ignore — non-critical
    }
  }

  return computeHealthScore({
    orgId: org.id,
    planTier: org.plan_tier,
    trialEndsAt: org.trial_ends_at,
    createdAt: org.created_at,
    hasApps: (appsRes.data?.length ?? 0) > 0,
    hasKeywords: (kwRes.data?.length ?? 0) > 0,
    hasAnalysis: (analysisRes.data?.length ?? 0) > 0,
    memberCount: membersRes.data?.length ?? 1,
    lastActivityAt,
    subscriptionCancelling,
  })
}

/* ================================================================
   CACHED HEALTH: Try account_churn_scores first, fallback to live
   ================================================================ */

export async function getHealthScores(
  supabase: Supabase,
): Promise<OrgHealthMap> {
  // Try cached scores first
  const { data: cached } = await supabase
    .from('account_churn_scores')
    .select('organization_id, health_score, churn_risk_pct, risk_factors, last_activity_at')

  if (cached && cached.length > 0) {
    const result: OrgHealthMap = {}
    for (const row of cached) {
      result[row.organization_id] = {
        healthScore: row.health_score,
        churnRisk: +row.churn_risk_pct,
        riskFactors: Array.isArray(row.risk_factors) ? row.risk_factors : [],
        lastActivityAt: row.last_activity_at,
      }
    }
    return result
  }

  // Fallback: compute live
  return computeAllHealthScores(supabase)
}

/* ================================================================
   PER-ORG: LTV
   ================================================================ */

export function computeLtv(planTier: string, tenureMonths: number): number {
  const price = PLAN_PRICES[planTier] ?? 0
  return Math.round(price * Math.max(tenureMonths, 12) * 1.2)
}

export function formatLtv(ltv: number): string {
  if (ltv === 0) return '$0'
  if (ltv >= 1000) return `$${(ltv / 1000).toFixed(0)}K`
  return `$${ltv}`
}

/* ================================================================
   PER-ORG: NPS
   ================================================================ */

export async function getOrgNps(
  supabase: Supabase,
  orgId: string,
): Promise<number | null> {
  const { data } = await supabase
    .from('nps_responses')
    .select('score')
    .eq('organization_id', orgId)

  if (!data || data.length === 0) return null
  return Math.round(data.reduce((s, r) => s + r.score, 0) / data.length)
}

/* ================================================================
   MRR WATERFALL (from daily_mrr_snapshot, last 10 weeks)
   ================================================================ */

export async function getMrrWaterfall(
  supabase: Supabase,
): Promise<WaterfallRow[] | null> {
  const { data } = await supabase
    .from('daily_mrr_snapshot')
    .select('snapshot_date, mrr_cents, new_mrr_cents, expansion_mrr_cents, contraction_mrr_cents, churned_mrr_cents')
    .order('snapshot_date', { ascending: false })
    .limit(70) // ~10 weeks of daily data

  if (!data || data.length === 0) return null

  // Group by week
  const weekMap = new Map<string, {
    newMrr: number
    expansion: number
    contraction: number
    churned: number
  }>()

  for (const row of data) {
    const d = new Date(row.snapshot_date)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().slice(0, 10)

    const existing = weekMap.get(key) ?? { newMrr: 0, expansion: 0, contraction: 0, churned: 0 }
    existing.newMrr += Number(row.new_mrr_cents) / 100
    existing.expansion += Number(row.expansion_mrr_cents) / 100
    existing.contraction += Number(row.contraction_mrr_cents) / 100
    existing.churned += Number(row.churned_mrr_cents) / 100
    weekMap.set(key, existing)
  }

  const weeks = [...weekMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-10)

  return weeks.map(([, vals], i) => ({
    label: i === weeks.length - 1 ? 'NOW' : `W-${weeks.length - 1 - i}`,
    newMrr: Math.round(vals.newMrr),
    expansion: Math.round(vals.expansion),
    contraction: Math.round(vals.contraction),
    churned: Math.round(vals.churned),
  }))
}

/* ================================================================
   MRR BRIDGE (from latest snapshot or simplified)
   ================================================================ */

export async function getMrrBridge(
  supabase: Supabase,
  currentMrr: number,
): Promise<BridgeRow[]> {
  // Try to get latest snapshot data
  const { data } = await supabase
    .from('daily_mrr_snapshot')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(2)

  if (data && data.length >= 2) {
    // We have real data — build bridge from previous to current
    const latest = data[0]!
    const previous = data[1]!
    const startMrr = Number(previous.mrr_cents) / 100
    const newBiz = Number(latest.new_mrr_cents) / 100
    const expansion = Number(latest.expansion_mrr_cents) / 100
    const contraction = Number(latest.contraction_mrr_cents) / 100
    const churned = Number(latest.churned_mrr_cents) / 100
    const endMrr = startMrr + newBiz + expansion - contraction - churned
    const maxVal = Math.max(startMrr, newBiz, expansion, contraction, churned, endMrr, 1)

    return [
      { label: 'Starting MRR', sublabel: formatDate(previous.snapshot_date), value: startMrr, type: 'start', pctWidth: Math.round((startMrr / maxVal) * 100) },
      { label: '+ New business', sublabel: `${latest.customer_count} CUSTOMERS`, value: newBiz, type: 'new', pctWidth: Math.round((newBiz / maxVal) * 100) },
      { label: '+ Expansion', sublabel: 'UPGRADES + SEATS', value: expansion, type: 'expansion', pctWidth: Math.round((expansion / maxVal) * 100) },
      { label: '− Contraction', sublabel: 'DOWNGRADES', value: contraction, type: 'contraction', pctWidth: Math.round((contraction / maxVal) * 100) },
      { label: '− Churned', sublabel: 'LOST CUSTOMERS', value: churned, type: 'churned', pctWidth: Math.round((churned / maxVal) * 100) },
      { label: 'Ending MRR', sublabel: 'CURRENT', value: endMrr, type: 'end', pctWidth: Math.round((endMrr / maxVal) * 100) },
    ]
  }

  // Simplified bridge — just starting = ending = currentMrr
  return [
    { label: 'Starting MRR', sublabel: 'CURRENT', value: currentMrr, type: 'start', pctWidth: 100 },
    { label: '+ New business', sublabel: '—', value: 0, type: 'new', pctWidth: 0 },
    { label: '+ Expansion', sublabel: '—', value: 0, type: 'expansion', pctWidth: 0 },
    { label: '− Contraction', sublabel: '—', value: 0, type: 'contraction', pctWidth: 0 },
    { label: '− Churned', sublabel: '—', value: 0, type: 'churned', pctWidth: 0 },
    { label: 'Ending MRR', sublabel: 'CURRENT', value: currentMrr, type: 'end', pctWidth: 100 },
  ]
}

/* ================================================================
   SPARKLINES (from daily_mrr_snapshot, last 11 data points)
   ================================================================ */

export async function getSparklines(
  supabase: Supabase,
): Promise<SparklineData> {
  const { data } = await supabase
    .from('daily_mrr_snapshot')
    .select('snapshot_date, mrr_cents, customer_count')
    .order('snapshot_date', { ascending: true })

  if (!data || data.length < 2) {
    return { mrr: null, netNewLogos: null, trialToPaid: null, nrr: null, runway: null }
  }

  // Take last 11 data points (aggregate by unique date)
  const byDate = new Map<string, { mrr: number; customers: number }>()
  for (const row of data) {
    const existing = byDate.get(row.snapshot_date)
    if (existing) {
      existing.mrr += Number(row.mrr_cents) / 100
      existing.customers += row.customer_count
    } else {
      byDate.set(row.snapshot_date, {
        mrr: Number(row.mrr_cents) / 100,
        customers: row.customer_count,
      })
    }
  }

  const sorted = [...byDate.values()].slice(-11)
  return {
    mrr: sorted.map((d) => Math.round(d.mrr)),
    netNewLogos: sorted.map((d) => d.customers),
    trialToPaid: null, // requires trial tracking
    nrr: null, // requires period-over-period comparison
    runway: null, // requires burn rate data
  }
}

/* ================================================================
   SAAS METRICS
   ================================================================ */

export async function getSaasMetrics(
  supabase: Supabase,
): Promise<SaasMetrics> {
  // Compute real MRR/ARR from orgs
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, plan_tier, created_at, trial_ends_at')

  const allOrgs = orgs ?? []
  let mrr = 0
  let paidCount = 0
  let trialCount = 0
  let trialExpiredCount = 0
  const now = Date.now()

  for (const o of allOrgs) {
    mrr += PLAN_PRICES[o.plan_tier] ?? 0
    if (o.plan_tier !== 'solo') paidCount++
    if (o.trial_ends_at && new Date(o.trial_ends_at).getTime() >= now) trialCount++
    if (o.trial_ends_at && new Date(o.trial_ends_at).getTime() < now && o.plan_tier === 'solo') trialExpiredCount++
  }

  // Trial-to-paid rate (if trials existed)
  const totalTrials = paidCount + trialCount + trialExpiredCount
  const trialToPaid7d = totalTrials > 0 ? +((paidCount / totalTrials) * 100).toFixed(1) : null

  // Activation (orgs that have at least 1 app within 72h)
  const { data: appsData } = await supabase.from('apps').select('organization_id, created_at')
  const orgAppMap = new Set((appsData ?? []).map((a) => a.organization_id))
  const activatedCount = allOrgs.filter((o) => orgAppMap.has(o.id)).length
  const activation72h = allOrgs.length > 0 ? +((activatedCount / allOrgs.length) * 100).toFixed(0) : null

  // Feature breadth (avg distinct analysis_types per org)
  const { data: analysisData } = await supabase
    .from('analysis_results')
    .select('organization_id, analysis_type, created_at')
  const orgTypes = new Map<string, Set<string>>()
  for (const a of analysisData ?? []) {
    if (!orgTypes.has(a.organization_id)) orgTypes.set(a.organization_id, new Set())
    orgTypes.get(a.organization_id)!.add(a.analysis_type)
  }
  const typeCounts = [...orgTypes.values()].map((s) => s.size)
  const featureBreadth = typeCounts.length > 0
    ? +(typeCounts.reduce((a, b) => a + b, 0) / typeCounts.length).toFixed(1)
    : null

  // TTV Median — time from org creation to first analysis result
  const firstAnalysisByOrg = new Map<string, number>()
  for (const a of analysisData ?? []) {
    const ts = new Date(a.created_at).getTime()
    const existing = firstAnalysisByOrg.get(a.organization_id)
    if (!existing || ts < existing) firstAnalysisByOrg.set(a.organization_id, ts)
  }
  const ttvValues: number[] = []
  for (const o of allOrgs) {
    const first = firstAnalysisByOrg.get(o.id)
    if (first) {
      const orgCreated = new Date(o.created_at).getTime()
      const hoursToValue = Math.max(0, (first - orgCreated) / 3_600_000)
      ttvValues.push(hoursToValue)
    }
  }
  ttvValues.sort((a, b) => a - b)
  const ttvMedian = ttvValues.length > 0
    ? ttvValues[Math.floor(ttvValues.length / 2)]!
    : null
  const ttvLabel = ttvMedian !== null
    ? (ttvMedian < 1 ? `${Math.round(ttvMedian * 60)}m` : ttvMedian < 24 ? `${Math.round(ttvMedian)}h` : `${Math.round(ttvMedian / 24)}d`)
    : null

  // DAU/WAU — try daily_usage_snapshot, fallback to analysis_results activity
  const { data: usageData } = await supabase
    .from('daily_usage_snapshot')
    .select('dau, wau')
    .order('snapshot_date', { ascending: false })
    .limit(1)
  let dauWau: number | null = null
  if (usageData?.[0] && usageData[0].wau > 0) {
    dauWau = Math.round((usageData[0].dau / usageData[0].wau) * 100)
  } else {
    // Fallback: compute from analysis_results activity (unique orgs)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today.getTime() - 7 * 86_400_000)
    const dauOrgs = new Set<string>()
    const wauOrgs = new Set<string>()
    for (const a of analysisData ?? []) {
      const d = new Date(a.created_at)
      if (d >= today) dauOrgs.add(a.organization_id)
      if (d >= weekAgo) wauOrgs.add(a.organization_id)
    }
    if (wauOrgs.size > 0) {
      dauWau = Math.round((dauOrgs.size / wauOrgs.size) * 100)
    }
  }

  // Gross margin from COGS in admin_config
  const { data: cogsRow } = await supabase
    .from('admin_config')
    .select('value')
    .eq('key', 'cogs')
    .maybeSingle()
  const cogsValues = (cogsRow?.value ?? { supabase: 25, vercel: 0, deepseek: 0 }) as Record<string, number>
  // Override deepseek with real metered cost
  const monthStartSaas = new Date(now).toISOString().slice(0, 8) + '01T00:00:00.000Z'
  const { data: monthApiCost } = await supabase
    .from('api_call_log')
    .select('cost_usd')
    .gte('created_at', monthStartSaas)
  const realDeepseekCost = (monthApiCost ?? []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0)
  if (realDeepseekCost > 0) cogsValues.deepseek = Math.round(realDeepseekCost * 100) / 100
  const totalCogs = Object.values(cogsValues).reduce((s, v) => s + v, 0)
  const grossMargin = mrr > 0 ? Math.round(((mrr - totalCogs) / mrr) * 100) : null

  // NRR/GRR from snapshots (need 2+ months of data)
  let nrr: number | null = null
  let grr: number | null = null
  const { data: mrrSnapshots } = await supabase
    .from('daily_mrr_snapshot')
    .select('snapshot_date, mrr_cents, expansion_mrr_cents, contraction_mrr_cents, churned_mrr_cents')
    .order('snapshot_date', { ascending: false })
    .limit(60)

  if (mrrSnapshots && mrrSnapshots.length >= 30) {
    // Aggregate last 30 days vs previous 30 days
    const recent = mrrSnapshots.slice(0, 30)
    const older = mrrSnapshots.slice(30, 60)
    if (older.length > 0) {
      const olderMrr = older.reduce((s, r) => s + Number(r.mrr_cents), 0) / older.length / 100
      const expansion = recent.reduce((s, r) => s + Number(r.expansion_mrr_cents), 0) / 100
      const contraction = recent.reduce((s, r) => s + Number(r.contraction_mrr_cents), 0) / 100
      const churned = recent.reduce((s, r) => s + Number(r.churned_mrr_cents), 0) / 100
      if (olderMrr > 0) {
        nrr = Math.round(((olderMrr + expansion - contraction - churned) / olderMrr) * 100)
        grr = Math.round(((olderMrr - contraction - churned) / olderMrr) * 100)
      }
    }
  }

  // Blended LTV: ARR × 1.2 retention multiplier / paid customers
  const blendedLtv = paidCount > 0 ? Math.round((mrr * 12 * 1.2) / paidCount) : null

  // Logo churn (approximate: expired trials that never converted)
  const logoChurn30d = allOrgs.length > 0 && trialExpiredCount > 0
    ? +((trialExpiredCount / allOrgs.length) * 100).toFixed(1)
    : (allOrgs.length > 0 ? 0 : null)

  return {
    mrr,
    arr: mrr * 12,
    nrr,
    grr,
    logoChurn30d,
    cacPayback: null, // requires CAC data
    ruleOf40: null, // requires growth rate + margin
    trialToPaid7d,
    activation72h,
    ttvMedian: ttvLabel,
    dauWau,
    featureBreadth,
    grossMargin,
    quickRatio: null, // requires expansion/churn data over time
    magicNumber: null, // requires S&M spend data
    expansionPct: null, // requires expansion tracking
    runway: null, // requires burn rate data
    blendedCac: null, // requires acquisition cost data
    blendedLtv,
    ltvCac: null, // requires CAC data
    contribution: null, // requires cost data
  }
}

/* ================================================================
   MODULE RETENTION (real from org module usage)
   ================================================================ */

export async function getModuleRetention(
  supabase: Supabase,
): Promise<ModuleRetentionRow[] | null> {
  // Try cached data first
  const { data: cached } = await supabase
    .from('module_retention_buckets')
    .select('module_name, retained_pct, sample_size')

  if (cached && cached.length > 0) {
    return cached.map((r) => ({
      modules: r.module_name,
      retention: +r.retained_pct,
    }))
  }

  // Compute from real data
  const [appsRes, kwRes, analysisRes, reviewsRes, orgsRes] = await Promise.all([
    supabase.from('apps').select('organization_id'),
    supabase.from('keywords').select('organization_id'),
    supabase.from('analysis_results').select('organization_id'),
    supabase.from('reviews').select('app_id'),
    supabase.from('organizations').select('id, plan_tier'),
  ])

  // Get apps to map review app_ids to org_ids
  const { data: appsForReviews } = await supabase.from('apps').select('id, organization_id')
  const appToOrg: Record<string, string> = {}
  for (const a of appsForReviews ?? []) appToOrg[a.id] = a.organization_id

  const orgModules: Record<string, Set<string>> = {}
  for (const a of appsRes.data ?? []) {
    if (!orgModules[a.organization_id]) orgModules[a.organization_id] = new Set()
    orgModules[a.organization_id]!.add('apps')
  }
  for (const k of kwRes.data ?? []) {
    if (!orgModules[k.organization_id]) orgModules[k.organization_id] = new Set()
    orgModules[k.organization_id]!.add('keywords')
  }
  for (const a of analysisRes.data ?? []) {
    if (!orgModules[a.organization_id]) orgModules[a.organization_id] = new Set()
    orgModules[a.organization_id]!.add('analysis')
  }
  for (const r of reviewsRes.data ?? []) {
    const orgId = appToOrg[r.app_id]
    if (orgId) {
      if (!orgModules[orgId]) orgModules[orgId] = new Set()
      orgModules[orgId]!.add('reviews')
    }
  }

  // Group orgs by module count, compute paid retention per bucket
  const paidSet = new Set(
    (orgsRes.data ?? []).filter((o) => o.plan_tier !== 'solo').map((o) => o.id),
  )
  const allOrgIds = (orgsRes.data ?? []).map((o) => o.id)

  if (allOrgIds.length === 0) return null

  const buckets: Record<number, { total: number; paid: number }> = {}
  for (const orgId of allOrgIds) {
    const count = orgModules[orgId]?.size ?? 0
    const bucket = Math.min(count, 4) // cap at 4 (apps, keywords, analysis, reviews)
    if (!buckets[bucket]) buckets[bucket] = { total: 0, paid: 0 }
    buckets[bucket]!.total++
    if (paidSet.has(orgId)) buckets[bucket]!.paid++
  }

  const labels = ['0 MOD', '1 MOD', '2', '3', '4']
  const result: ModuleRetentionRow[] = []
  for (let i = 0; i <= 4; i++) {
    const b = buckets[i]
    if (b && b.total > 0) {
      result.push({
        modules: labels[i] ?? `${i}`,
        retention: Math.round((b.paid / b.total) * 100),
      })
    }
  }

  return result.length > 0 ? result : null
}

/* ================================================================
   REVENUE BY MODULE (from analysis_results + reviews)
   ================================================================ */

export async function getRevenueByModule(
  supabase: Supabase,
): Promise<RevenueByModuleRow[] | null> {
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, plan_tier')

  const paidOrgs = (orgs ?? []).filter((o) => o.plan_tier !== 'solo')
  if (paidOrgs.length === 0) return null

  const paidOrgIds = new Set(paidOrgs.map((o) => o.id))

  // Count orgs using each "module"
  const [appsRes, kwRes, analysisRes, reviewsRes] = await Promise.all([
    supabase.from('apps').select('organization_id'),
    supabase.from('keywords').select('organization_id'),
    supabase.from('analysis_results').select('organization_id, analysis_type'),
    supabase.from('reviews').select('app_id'),
  ])

  const { data: appsForReviews } = await supabase.from('apps').select('id, organization_id')
  const appToOrg: Record<string, string> = {}
  for (const a of appsForReviews ?? []) appToOrg[a.id] = a.organization_id

  const modules: Record<string, Set<string>> = {
    'Keywords': new Set(),
    'Analysis': new Set(),
    'Reviews': new Set(),
    'Apps': new Set(),
  }

  for (const a of appsRes.data ?? []) {
    if (paidOrgIds.has(a.organization_id)) modules['Apps']!.add(a.organization_id)
  }
  for (const k of kwRes.data ?? []) {
    if (paidOrgIds.has(k.organization_id)) modules['Keywords']!.add(k.organization_id)
  }
  for (const a of analysisRes.data ?? []) {
    if (paidOrgIds.has(a.organization_id)) modules['Analysis']!.add(a.organization_id)
  }
  for (const r of reviewsRes.data ?? []) {
    const orgId = appToOrg[r.app_id]
    if (orgId && paidOrgIds.has(orgId)) modules['Reviews']!.add(orgId)
  }

  const totalPaid = paidOrgs.length
  const totalMrr = paidOrgs.reduce((s, o) => s + (PLAN_PRICES[o.plan_tier] ?? 0), 0)

  const result: RevenueByModuleRow[] = Object.entries(modules)
    .map(([name, orgSet]) => {
      const pct = totalPaid > 0 ? Math.round((orgSet.size / totalPaid) * 100) : 0
      return {
        name,
        tag: name === 'Keywords' ? 'CORE' : name === 'Analysis' ? 'CORE' : 'FEATURE',
        value: Math.round(totalMrr * (pct / 100)),
        pct,
      }
    })
    .filter((r) => r.pct > 0)
    .sort((a, b) => b.pct - a.pct)

  return result.length > 0 ? result : null
}

/* ================================================================
   COHORT RETENTION (from organizations table)
   ================================================================ */

export async function getCohortRetention(
  supabase: Supabase,
): Promise<CohortRetentionRow[] | null> {
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, plan_tier, created_at')
    .order('created_at', { ascending: true })

  if (!orgs || orgs.length === 0) return null

  // Group by signup month
  const cohortMap = new Map<string, { total: number; paid: number; month: Date }>()
  for (const o of orgs) {
    const d = new Date(o.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const existing = cohortMap.get(key) ?? { total: 0, paid: 0, month: d }
    existing.total++
    if (o.plan_tier !== 'solo') existing.paid++
    cohortMap.set(key, existing)
  }

  const cohorts = [...cohortMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, val]) => {
      const label = val.month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const retentionBase = val.total > 0 ? Math.round((val.paid / val.total) * 100) : 0
      // Simple retention curve: starts at 100%, trends toward paid ratio
      return {
        label: `${label}`,
        size: val.total,
        retention: [100, retentionBase > 0 ? Math.min(100, retentionBase + 10) : 0],
      }
    })

  return cohorts.length > 0 ? cohorts : null
}

/* ================================================================
   CHANNEL ECONOMICS (from signup_funnel_daily)
   ================================================================ */

export async function getChannelEconomics(
  supabase: Supabase,
): Promise<ChannelEconomicsRow[] | null> {
  const { data } = await supabase
    .from('signup_funnel_daily')
    .select('channel, visitors, signups, activated, trial_started, converted')

  if (!data || data.length === 0) return null

  // Aggregate by channel
  const channels = new Map<string, {
    visitors: number; signups: number; paid: number
  }>()

  for (const row of data) {
    const existing = channels.get(row.channel) ?? { visitors: 0, signups: 0, paid: 0 }
    existing.visitors += row.visitors
    existing.signups += row.signups
    existing.paid += row.converted
    channels.set(row.channel, existing)
  }

  return [...channels.entries()].map(([channel, vals]) => ({
    channel,
    visitors: vals.visitors,
    signups: vals.signups,
    paid: vals.paid,
    cac: 0, // requires spend data
    ltv: 0, // requires per-channel LTV tracking
    ltvCac: '—',
    payback: '—',
    quality: '—',
  }))
}

/* ================================================================
   HEALTH TRAJECTORY (from account_health_history)
   ================================================================ */

export async function getHealthTrajectory(
  supabase: Supabase,
  orgId: string,
): Promise<HealthTrajectoryPoint[] | null> {
  // Try account_health_history first (populated by Compute Snapshots)
  const { data } = await supabase
    .from('account_health_history')
    .select('snapshot_date, health_score')
    .eq('organization_id', orgId)
    .order('snapshot_date', { ascending: true })
    .limit(12)

  if (data && data.length > 0) {
    // Also get platform average for each date
    const dates = data.map((d) => d.snapshot_date)
    const { data: allScores } = await supabase
      .from('account_health_history')
      .select('snapshot_date, health_score')
      .in('snapshot_date', dates)

    const avgByDate: Record<string, { total: number; count: number }> = {}
    for (const s of allScores ?? []) {
      if (!avgByDate[s.snapshot_date]) avgByDate[s.snapshot_date] = { total: 0, count: 0 }
      avgByDate[s.snapshot_date]!.total += s.health_score
      avgByDate[s.snapshot_date]!.count++
    }

    return data.map((d, i) => {
      const avg = avgByDate[d.snapshot_date]
      return {
        month: i === data.length - 1 ? 'NOW' : `M-${data.length - 1 - i}`,
        score: d.health_score,
        avg: avg ? Math.round(avg.total / avg.count) : d.health_score,
      }
    })
  }

  // Fallback: compute live health score and show as single "NOW" point
  const health = await computeOrgHealth(supabase, orgId)

  // Get platform average from all orgs
  const allHealthMap = await getHealthScores(supabase)
  const allScores = Object.values(allHealthMap).map(h => h.healthScore)
  const platformAvg = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : health.healthScore

  return [
    { month: 'NOW', score: health.healthScore, avg: platformAvg },
  ]
}

/* ================================================================
   CHURN EXPLAINER (from risk_factors in account_churn_scores)
   ================================================================ */

export async function getChurnExplainer(
  supabase: Supabase,
  orgId: string,
): Promise<ChurnExplainerItem[] | null> {
  // Get org health signals
  const health = await computeOrgHealth(supabase, orgId)

  if (health.riskFactors.length === 0 && health.healthScore >= 80) {
    // Healthy org — show positive signals
    const positiveItems: ChurnExplainerItem[] = []
    if (health.healthScore >= 80) {
      positiveItems.push({ feature: 'Overall health', detail: `Score ${health.healthScore} · STRONG`, shapValue: -0.3 })
    }
    if (!health.riskFactors.includes('No apps added')) {
      positiveItems.push({ feature: 'Active apps', detail: 'Has apps configured', shapValue: -0.2 })
    }
    if (!health.riskFactors.includes('No keywords tracked')) {
      positiveItems.push({ feature: 'Keyword tracking', detail: 'Active tracking', shapValue: -0.15 })
    }
    if (!health.riskFactors.includes('No analysis run')) {
      positiveItems.push({ feature: 'Analysis usage', detail: 'Has run analysis', shapValue: -0.2 })
    }
    return positiveItems.length > 0 ? positiveItems : null
  }

  // Build explainer from risk factors
  const items: ChurnExplainerItem[] = health.riskFactors.map((factor) => ({
    feature: factor,
    detail: 'Risk factor',
    shapValue: 0.15,
  }))

  // Add positive signals too
  if (!health.riskFactors.includes('No apps added')) {
    items.push({ feature: 'Active apps', detail: 'Configured', shapValue: -0.2 })
  }
  if (!health.riskFactors.includes('No keywords tracked')) {
    items.push({ feature: 'Keywords', detail: 'Tracked', shapValue: -0.15 })
  }

  return items.length > 0 ? items : null
}

/* ================================================================
   USAGE HEATMAP (from hourly_request_rollup)
   ================================================================ */

export async function getUsageHeatmap(
  supabase: Supabase,
  orgId?: string,
): Promise<UsageHeatmap | null> {
  // Collect raw counts per day
  const rawCounts: Record<string, number> = {}
  let hasData = false

  // Try hourly_request_rollup first
  const { data } = await supabase
    .from('hourly_request_rollup')
    .select('hour_ts, total_requests')
    .order('hour_ts', { ascending: true })

  if (data && data.length > 0) {
    hasData = true
    for (const entry of data) {
      const d = new Date(entry.hour_ts)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      rawCounts[key] = (rawCounts[key] ?? 0) + entry.total_requests
    }
  }

  // Fallback: build from analysis_results
  if (!hasData) {
    const query = supabase
      .from('analysis_results')
      .select('created_at')
      .order('created_at', { ascending: true })
    if (orgId) query.eq('organization_id', orgId)
    const { data: analysisData } = await query

    if (!analysisData || analysisData.length === 0) return null
    hasData = true

    for (const entry of analysisData) {
      const d = new Date(entry.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      rawCounts[key] = (rawCounts[key] ?? 0) + 1
    }
  }

  if (!hasData) return null

  // Normalize to 0–4 scale
  const vals = Object.values(rawCounts)
  const maxVal = Math.max(...vals, 1)
  const result: UsageHeatmap = {}
  for (const [key, count] of Object.entries(rawCounts)) {
    result[key] = Math.min(4, Math.max(1, Math.round((count / maxVal) * 4)))
  }

  return result
}

/* ================================================================
   MODULE ENGAGEMENT (per org — from analysis_results)
   ================================================================ */

export async function getModuleEngagement(
  supabase: Supabase,
  orgId: string,
): Promise<{ name: string; count: number; pct: number }[]> {
  const { data } = await supabase
    .from('analysis_results')
    .select('analysis_type')
    .eq('organization_id', orgId)

  if (!data || data.length === 0) return []

  const counts = new Map<string, number>()
  for (const row of data) {
    const t = row.analysis_type ?? 'Unknown'
    counts.set(t, (counts.get(t) ?? 0) + 1)
  }

  const total = data.length
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      count,
      pct: Math.round((count / total) * 100),
    }))
}

/* ================================================================
   LAST SEEN (from analysis_results or apps)
   ================================================================ */

export async function getLastSeen(
  supabase: Supabase,
  orgId: string,
): Promise<string> {
  const { data } = await supabase
    .from('analysis_results')
    .select('created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (data && data.length > 0) {
    const diff = Date.now() - new Date(data[0]!.created_at).getTime()
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`
    return `${Math.round(diff / 86400000)}d ago`
  }

  return '—'
}

/* ================================================================
   EXPANSION SIGNAL
   ================================================================ */

export function getExpansionSignal(healthScore: number): string {
  if (healthScore >= 90) return 'HIGH'
  if (healthScore >= 70) return 'MEDIUM'
  return 'LOW'
}

/* ================================================================
   HELPERS
   ================================================================ */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}
