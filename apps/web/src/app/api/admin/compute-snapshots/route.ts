import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { computeAllHealthScores, PLAN_PRICES } from '@/lib/admin/metrics'

// The analytics tables exist in the DB but aren't in the generated TypeScript types yet.
// Use untyped client for analytics table operations.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = ReturnType<typeof getSupabaseAdmin> & { from: (table: string) => any }

export async function POST() {
  const supabase = getSupabaseAdmin() as unknown as AnySupabase
  const today = new Date().toISOString().slice(0, 10)
  const errors: string[] = []

  // ── 1. MRR Snapshot ──
  try {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, plan_tier, created_at')

    // Group by plan tier
    const tiers: Record<string, { mrr: number; count: number; newToday: number }> = {}
    for (const o of orgs ?? []) {
      const tier = o.plan_tier
      if (!tiers[tier]) tiers[tier] = { mrr: 0, count: 0, newToday: 0 }
      tiers[tier]!.mrr += (PLAN_PRICES[tier] ?? 0) * 100 // store as cents
      tiers[tier]!.count++
      if (o.created_at.startsWith(today)) tiers[tier]!.newToday++
    }

    // Get previous snapshot for diff
    const { data: prevSnapshot } = await supabase
      .from('daily_mrr_snapshot')
      .select('plan_tier, mrr_cents, customer_count')
      .lt('snapshot_date', today)
      .order('snapshot_date', { ascending: false })
      .limit(10)

    const prevByTier: Record<string, { mrr: number; count: number }> = {}
    for (const row of prevSnapshot ?? []) {
      if (!prevByTier[row.plan_tier]) {
        prevByTier[row.plan_tier] = { mrr: Number(row.mrr_cents), count: row.customer_count }
      }
    }

    for (const [tier, vals] of Object.entries(tiers)) {
      const prev = prevByTier[tier]
      const newMrr = vals.newToday * ((PLAN_PRICES[tier] ?? 0) * 100)
      const expansion = prev ? Math.max(0, vals.mrr - prev.mrr - newMrr) : 0
      const contraction = prev ? Math.max(0, prev.mrr - vals.mrr + newMrr) : 0
      const churned = prev ? Math.max(0, (prev.count - vals.count) * (PLAN_PRICES[tier] ?? 0) * 100) : 0

      await supabase.from('daily_mrr_snapshot').upsert(
        {
          snapshot_date: today,
          plan_tier: tier,
          mrr_cents: vals.mrr,
          customer_count: vals.count,
          new_mrr_cents: newMrr,
          expansion_mrr_cents: expansion,
          contraction_mrr_cents: contraction,
          churned_mrr_cents: churned,
        },
        { onConflict: 'snapshot_date,plan_tier', ignoreDuplicates: false },
      )
    }
  } catch (e) {
    errors.push(`MRR Snapshot: ${e instanceof Error ? e.message : String(e)}`)
  }

  // ── 2. Health Scores → account_churn_scores + account_health_history ──
  try {
    const healthMap = await computeAllHealthScores(supabase)

    for (const [orgId, health] of Object.entries(healthMap)) {
      // Upsert account_churn_scores
      await supabase.from('account_churn_scores').upsert(
        {
          organization_id: orgId,
          health_score: health.healthScore,
          churn_risk_pct: health.churnRisk,
          risk_factors: health.riskFactors,
          last_activity_at: health.lastActivityAt,
          computed_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id', ignoreDuplicates: false },
      )

      // Insert into health history
      await supabase.from('account_health_history').upsert(
        {
          organization_id: orgId,
          health_score: health.healthScore,
          churn_risk_pct: health.churnRisk,
          snapshot_date: today,
        },
        { onConflict: 'organization_id,snapshot_date', ignoreDuplicates: false },
      )
    }
  } catch (e) {
    errors.push(`Health Scores: ${e instanceof Error ? e.message : String(e)}`)
  }

  // ── 3. Usage Snapshot ──
  try {
    const { count: apiCalls } = await supabase
      .from('api_call_log')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00Z`)

    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id')

    const uniqueUsers = new Set((members ?? []).map((m) => m.user_id))

    await supabase.from('daily_usage_snapshot').upsert(
      {
        snapshot_date: today,
        dau: uniqueUsers.size, // approximation
        wau: uniqueUsers.size,
        mau: uniqueUsers.size,
        avg_session_duration_seconds: 0,
        avg_actions_per_session: 0,
        total_api_calls: apiCalls ?? 0,
      },
      { onConflict: 'snapshot_date', ignoreDuplicates: false },
    )
  } catch (e) {
    errors.push(`Usage Snapshot: ${e instanceof Error ? e.message : String(e)}`)
  }

  // ── 4. Hourly Request Rollup ──
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: apiLogs } = await supabase
      .from('api_call_log')
      .select('endpoint, created_at, response_time_ms, is_success')
      .gte('created_at', twentyFourHoursAgo)

    // Aggregate by hour + endpoint
    const rollupMap = new Map<string, {
      hour: string; endpoint: string; total: number; errors: number; times: number[]
    }>()

    for (const log of apiLogs ?? []) {
      const hour = log.created_at.slice(0, 13) + ':00:00Z'
      const key = `${hour}|${log.endpoint}`
      const existing = rollupMap.get(key) ?? {
        hour, endpoint: log.endpoint, total: 0, errors: 0, times: [],
      }
      existing.total++
      if (!log.is_success) existing.errors++
      if (log.response_time_ms) existing.times.push(log.response_time_ms)
      rollupMap.set(key, existing)
    }

    for (const entry of rollupMap.values()) {
      const sorted = entry.times.sort((a, b) => a - b)
      const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0
      const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0
      const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0

      await supabase.from('hourly_request_rollup').upsert(
        {
          hour_ts: entry.hour,
          endpoint: entry.endpoint,
          total_requests: entry.total,
          error_count: entry.errors,
          p50_ms: p50,
          p95_ms: p95,
          p99_ms: p99,
        },
        { onConflict: 'hour_ts,endpoint', ignoreDuplicates: false },
      )
    }
  } catch (e) {
    errors.push(`Hourly Rollup: ${e instanceof Error ? e.message : String(e)}`)
  }

  // ── 5. Feature Metrics ──
  try {
    const { data: analysis } = await supabase
      .from('analysis_results')
      .select('analysis_type, organization_id')

    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')

    const totalOrgs = orgs?.length ?? 1

    // Group by analysis_type
    const typeMap = new Map<string, Set<string>>()
    for (const a of analysis ?? []) {
      if (!typeMap.has(a.analysis_type)) typeMap.set(a.analysis_type, new Set())
      typeMap.get(a.analysis_type)!.add(a.organization_id)
    }

    for (const [featureKey, orgSet] of typeMap.entries()) {
      await supabase.from('feature_metrics').upsert(
        {
          feature_key: featureKey,
          snapshot_date: today,
          total_users: totalOrgs,
          active_users: orgSet.size,
          adoption_pct: +((orgSet.size / totalOrgs) * 100).toFixed(2),
          retention_impact_pct: 0,
          expansion_correlation: 0,
        },
        { onConflict: 'feature_key,snapshot_date', ignoreDuplicates: false },
      )
    }
  } catch (e) {
    errors.push(`Feature Metrics: ${e instanceof Error ? e.message : String(e)}`)
  }

  // ── 6. Module Retention Buckets ──
  try {
    const [appsRes, kwRes, analysisRes, reviewsRes, orgsRes] = await Promise.all([
      supabase.from('apps').select('organization_id'),
      supabase.from('keywords').select('organization_id'),
      supabase.from('analysis_results').select('organization_id'),
      supabase.from('reviews').select('app_id'),
      supabase.from('organizations').select('id, plan_tier'),
    ])

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

    const paidSet = new Set(
      (orgsRes.data ?? []).filter((o) => o.plan_tier !== 'solo').map((o) => o.id),
    )

    const buckets: Record<number, { total: number; paid: number }> = {}
    for (const orgId of (orgsRes.data ?? []).map((o) => o.id)) {
      const count = orgModules[orgId]?.size ?? 0
      const bucket = Math.min(count, 4)
      if (!buckets[bucket]) buckets[bucket] = { total: 0, paid: 0 }
      buckets[bucket]!.total++
      if (paidSet.has(orgId)) buckets[bucket]!.paid++
    }

    const labels = ['0 modules', '1 module', '2 modules', '3 modules', '4 modules']
    for (let i = 0; i <= 4; i++) {
      const b = buckets[i]
      if (b && b.total > 0) {
        await supabase.from('module_retention_buckets').upsert(
          {
            module_name: labels[i]!,
            cohort_month: `${today.slice(0, 7)}-01`,
            retained_pct: +((b.paid / b.total) * 100).toFixed(2),
            sample_size: b.total,
          },
          { onConflict: 'module_name,cohort_month', ignoreDuplicates: false },
        )
      }
    }
  } catch (e) {
    errors.push(`Module Retention: ${e instanceof Error ? e.message : String(e)}`)
  }

  return NextResponse.json({
    ok: errors.length === 0,
    computed: today,
    errors: errors.length > 0 ? errors : undefined,
  })
}
