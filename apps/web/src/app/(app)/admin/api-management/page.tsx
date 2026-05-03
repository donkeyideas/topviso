import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { ApiManagementTabs } from '@/components/admin/ApiManagementTabs'

export default async function ApiManagementPage() {
  const supabase = getSupabaseAdmin()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Run all queries in parallel
  const [totalCountRes, recentCallsRes, configsRes, thirtyDayRes] =
    await Promise.all([
      supabase
        .from('api_call_log')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('api_call_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('platform_api_configs').select('*'),
      supabase
        .from('api_call_log')
        .select('created_at, cost_usd, provider, is_success')
        .gte('created_at', thirtyDaysAgo.toISOString()),
    ])

  const totalCalls = totalCountRes.count ?? 0
  const recentCallsRaw = recentCallsRes.data ?? []
  const configsRaw = configsRes.data ?? []
  const thirtyDayData = thirtyDayRes.data ?? []

  // Transform calls to match component interface
  const recentCalls = recentCallsRaw.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    provider: r.provider,
    endpoint: r.endpoint,
    is_success: r.is_success,
    latency_ms: r.response_time_ms,
    tokens_used: r.tokens_used,
    cost_usd: r.cost_usd ? Number(r.cost_usd) : null,
    metadata: r.metadata as Record<string, unknown> | null,
  }))

  // Transform configs — extract fields from config jsonb
  const configs = configsRaw.map((c) => {
    const cfg = (c.config ?? {}) as Record<string, unknown>
    const key = c.api_key ?? ''
    return {
      id: c.id,
      provider: c.provider,
      display_name: c.display_name,
      is_active: c.is_active,
      has_key: !!(key || cfg.env_var),
      api_key_last4: key.length > 4 ? `••••${key.slice(-4)}` : '',
      env_var: (cfg.env_var as string) ?? null,
      model: (cfg.model as string) ?? null,
      test_status: c.test_status,
      last_tested_at: c.last_tested_at,
      cost_per_1k_input: (cfg.cost_per_1k_input as number) ?? null,
      cost_per_1k_output: (cfg.cost_per_1k_output as number) ?? null,
    }
  })

  // Compute KPI metrics from 30-day data
  const totalCost = thirtyDayData.reduce(
    (sum, row) => sum + (row.cost_usd ?? 0),
    0,
  )
  const successCount = thirtyDayData.filter((r) => r.is_success).length
  const successRate =
    thirtyDayData.length > 0
      ? ((successCount / thirtyDayData.length) * 100).toFixed(1)
      : '0.0'
  const activeProviders = new Set(thirtyDayData.map((r) => r.provider)).size

  // Group 30-day data by date for chart
  const costByDate: Record<string, number> = {}
  for (const row of thirtyDayData) {
    const date = row.created_at.split('T')[0]!
    costByDate[date] = (costByDate[date] ?? 0) + (row.cost_usd ?? 0)
  }
  const chartData = Object.entries(costByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cost]) => ({ date, cost }))

  // Group by provider for breakdown
  const providerMap: Record<
    string,
    { calls: number; cost: number; errors: number }
  > = {}
  for (const row of thirtyDayData) {
    const p = row.provider
    if (!providerMap[p]) {
      providerMap[p] = { calls: 0, cost: 0, errors: 0 }
    }
    providerMap[p].calls += 1
    providerMap[p].cost += row.cost_usd ?? 0
    if (!row.is_success) providerMap[p].errors += 1
  }
  const providerBreakdown = Object.entries(providerMap)
    .map(([provider, data]) => ({ provider, ...data }))
    .sort((a, b) => b.calls - a.calls)

  return (
    <>
      <AdminPageHead
        category="Operations"
        title={
          <>
            API <em>management</em>.
          </>
        }
        subtitle="Monitor API usage, costs, and provider configurations across your platform."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard
            label="Total API Calls"
            value={totalCalls.toLocaleString()}
            subtitle="All time"
            variant="hl"
          />
          <KpiCard
            label="Total Cost"
            value={`$${totalCost.toFixed(4)}`}
            subtitle="Last 30 days"
          />
          <KpiCard
            label="Success Rate"
            value={`${successRate}%`}
            subtitle="Last 30 days"
            variant={parseFloat(successRate) >= 99 ? 'ok-hl' : 'default'}
          />
          <KpiCard
            label="Active Providers"
            value={activeProviders.toString()}
            subtitle="Last 30 days"
          />
        </KpiGrid>

        <ApiManagementTabs
          calls={recentCalls}
          chartData={chartData}
          providerBreakdown={providerBreakdown}
          configs={configs}
        />
      </div>
    </>
  )
}
