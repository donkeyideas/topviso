import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { EditableCosts } from '@/components/admin/EditableCosts'
import { EditableOpex } from '@/components/admin/EditableOpex'
import { MonthNav } from '@/components/admin/MonthNav'
import { getPlanPrices } from '@/lib/plan-config'

const FLAT_COST_LABELS: Record<string, string> = {
  supabase: 'Supabase (Database + Auth)',
  vercel: 'Vercel (Hosting)',
  deepseek: 'DeepSeek (AI/LLM)',
}

const OPEX_LABELS: Record<string, string> = {
  sm: 'S&M',
  rd: 'R&D',
  ga: 'G&A',
}

function fmtDollars(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function deltaStr(current: number, prior: number | null): string | null {
  if (prior === null || prior === 0) return null
  const pct = Math.round(((current - prior) / Math.abs(prior)) * 100)
  if (pct === 0) return 'flat'
  return `${pct > 0 ? '+' : ''}${pct}%`
}

function deltaColor(d: string | null, invert = false): string {
  if (!d || d === 'flat') return 'var(--color-ink-4)'
  const positive = d.startsWith('+')
  if (invert) return positive ? 'var(--color-warn)' : 'var(--color-ok)'
  return positive ? 'var(--color-ok)' : 'var(--color-warn)'
}

export default async function FinancialsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams
  const supabase = getSupabaseAdmin()

  // Determine selected month
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const selectedMonth = params.month ?? currentMonthKey
  const selParts = selectedMonth.split('-').map(Number)
  const selYear = selParts[0] ?? now.getFullYear()
  const selMonth = selParts[1] ?? (now.getMonth() + 1)
  const isCurrentMonth = selectedMonth === currentMonthKey

  const monthStart = new Date(selYear, selMonth - 1, 1).toISOString()
  const monthEnd = new Date(selYear, selMonth, 1).toISOString()

  // Prior month boundaries
  const priorMonth = selMonth === 1 ? 12 : selMonth - 1
  const priorYear = selMonth === 1 ? selYear - 1 : selYear
  const priorStart = new Date(priorYear, priorMonth - 1, 1).toISOString()
  const priorEnd = monthStart

  const [
    PLAN_PRICES,
    { data: orgs },
    { data: cogsRow },
    { data: opexRow },
    { data: monthCostData },
    { data: priorCostData },
  ] = await Promise.all([
    getPlanPrices(),
    supabase.from('organizations').select('plan_tier, created_at'),
    supabase.from('admin_config').select('value').eq('key', 'cogs').maybeSingle(),
    supabase.from('admin_config').select('value').eq('key', 'opex').maybeSingle(),
    supabase.from('api_call_log').select('cost_usd').gte('created_at', monthStart).lt('created_at', monthEnd),
    supabase.from('api_call_log').select('cost_usd').gte('created_at', priorStart).lt('created_at', priorEnd),
  ])

  // Revenue by plan tier — for current month use all orgs; for past months, orgs created before month end
  const eligibleOrgs = isCurrentMonth
    ? (orgs ?? [])
    : (orgs ?? []).filter(o => new Date(o.created_at) < new Date(monthEnd))

  const planCounts: Record<string, number> = { solo: 0, team: 0, enterprise: 0 }
  let totalRevenue = 0
  for (const o of eligibleOrgs) {
    const tier = o.plan_tier ?? 'solo'
    planCounts[tier] = (planCounts[tier] ?? 0) + 1
    totalRevenue += PLAN_PRICES[tier] ?? 0
  }

  // Prior month revenue (orgs created before prior month end)
  const priorOrgs = (orgs ?? []).filter(o => new Date(o.created_at) < new Date(priorEnd))
  let priorRevenue = 0
  for (const o of priorOrgs) {
    priorRevenue += PLAN_PRICES[o.plan_tier ?? 'solo'] ?? 0
  }

  const planRevenue = Object.entries(PLAN_PRICES).map(([tier, price]) => ({
    tier,
    label: tier.charAt(0).toUpperCase() + tier.slice(1),
    count: planCounts[tier] ?? 0,
    revenue: (planCounts[tier] ?? 0) * price,
    price,
  })).filter(p => p.count > 0 || p.tier !== 'solo')

  // API costs for selected month
  const realApiCost = (monthCostData ?? []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0)
  const roundedApiCost = Math.round(realApiCost * 100) / 100
  const hasRealApiData = roundedApiCost > 0

  // Prior month API costs
  const priorApiCost = (priorCostData ?? []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0)

  const cogsValues = { ...(cogsRow?.value ?? { supabase: 25, vercel: 0, deepseek: 0 }) as Record<string, number> }
  if (hasRealApiData) cogsValues.deepseek = roundedApiCost

  const costs = Object.entries(FLAT_COST_LABELS).map(([key, name]) => ({
    key,
    name,
    amount: cogsValues[key] ?? 0,
    live: key === 'deepseek' && hasRealApiData,
  }))

  const totalCogs = costs.reduce((s, c) => s + c.amount, 0)
  const grossProfit = totalRevenue - totalCogs
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0

  // Prior month COGS (same fixed costs + prior API cost)
  const priorCogsValues = { ...(cogsRow?.value ?? { supabase: 25, vercel: 0, deepseek: 0 }) as Record<string, number> }
  if (priorApiCost > 0) priorCogsValues.deepseek = Math.round(priorApiCost * 100) / 100
  const priorTotalCogs = Object.values(priorCogsValues).reduce((s, v) => s + v, 0)
  const priorGrossProfit = priorRevenue - priorTotalCogs

  // OpEx from admin_config
  const opexValues = (opexRow?.value ?? { sm: 0, rd: 0, ga: 0 }) as Record<string, number>
  const opexItems = Object.entries(OPEX_LABELS).map(([key, label]) => ({
    key,
    label,
    amount: opexValues[key] ?? 0,
  }))
  const totalOpex = opexItems.reduce((s, c) => s + c.amount, 0)
  const operatingIncome = grossProfit - totalOpex
  const priorOperatingIncome = priorGrossProfit - totalOpex // same opex for prior

  // Monthly run rate
  const monthlyRunRate = totalCogs + totalOpex

  // Per-plan COGS allocation
  const totalCustomers = eligibleOrgs.length || 1
  const cogsPerCustomer = totalCogs / totalCustomers

  // Bar chart data
  const barData = costs
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map(c => ({
      ...c,
      pct: totalCogs > 0 ? (c.amount / totalCogs) * 100 : 0,
    }))

  const BAR_COLORS: Record<string, string> = {
    deepseek: '#1d3fd9',
    supabase: 'var(--color-ink)',
    vercel: 'var(--color-ink)',
  }

  const monthLabel = new Date(selYear, selMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  const priorMonthLabel = new Date(priorYear, priorMonth - 1).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()

  // Deltas
  const revDelta = deltaStr(totalRevenue, priorRevenue)
  const cogsDelta = deltaStr(totalCogs, priorTotalCogs)
  const gpDelta = deltaStr(grossProfit, priorGrossProfit)
  const oiDelta = deltaStr(operatingIncome, priorOperatingIncome)

  return (
    <>
      <AdminPageHead
        category="Finance"
        title={<>Financials &amp; <em>P&amp;L</em>.</>}
        subtitle="Revenue, costs, margins, and runway at a glance."
        stamp={<>
          MONTHLY RUN RATE ·<br />
          <strong>{fmtDollars(monthlyRunRate)}</strong>
        </>}
      />
      <div className="admin-content">
        {/* ── Month Navigation ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <MonthNav current={selectedMonth} />
        </div>

        <KpiGrid columns={6}>
          <KpiCard label="Cash Position" value="—" subtitle="as of today" delta="→ n/a" deltaDirection="flat" />
          <KpiCard label="Monthly Burn" value={fmtDollars(monthlyRunRate)} subtitle="net · this month" variant="hl" />
          <KpiCard label="Runway" value="—" subtitle="at current burn" />
          <KpiCard label="Gross Margin" value={`${grossMargin}%`} subtitle="LTM" variant={grossMargin >= 70 ? 'ok-hl' : 'default'} />
          <KpiCard label="Burn Multiple" value="—" subtitle="net burn / ARR" />
          <KpiCard label="Rule of 40" value="—" subtitle="growth + margin" />
        </KpiGrid>

        {/* ── §01 COGS BY SERVICE ── */}
        <SectionHead index="01" title="COGS by service" />
        <AdminCard title={<>COGS <em>by service</em></>} tag={monthLabel}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>
            {barData.map(c => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 140, flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
                    {c.live ? 'API METERED' : 'FIXED MONTHLY'}
                  </div>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ background: 'var(--color-line)', borderRadius: 4, height: 18, width: '100%' }}>
                    <div style={{
                      background: BAR_COLORS[c.key] ?? 'var(--color-ink)',
                      borderRadius: 4,
                      height: 18,
                      width: `${Math.max(c.pct, 3)}%`,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
                <div style={{
                  width: 70,
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {fmtDollars(c.amount)}
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* ── §02 MONTHLY P&L + GROSS MARGIN BY PLAN (side-by-side) ── */}
        <SectionHead index="02" title="Monthly P&L" />
        <div className="admin-grid-2">
          <AdminCard title={<>Monthly <em>P&amp;L</em></>} tag={monthLabel}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Line Item</th>
                  <th className="tn">Amount</th>
                  <th className="tn">% of Rev</th>
                  <th className="tn" style={{ fontSize: 10, letterSpacing: '0.05em' }}>VS {priorMonthLabel}</th>
                </tr>
              </thead>
              <tbody>
                {/* Revenue */}
                <tr className="row-hl">
                  <td><strong>Revenue</strong></td>
                  <td className="tn"><strong>{fmtDollars(totalRevenue)}</strong></td>
                  <td className="tn">100%</td>
                  <td className="tn" style={{ color: deltaColor(revDelta), fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {revDelta ?? '—'}
                  </td>
                </tr>
                {planRevenue.map(p => (
                  <tr key={p.tier}>
                    <td style={{ paddingLeft: 24 }}>{p.label} <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)' }}>× {p.count}</span></td>
                    <td className="tn">{fmtDollars(p.revenue)}</td>
                    <td className="tn">{totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0}%</td>
                    <td className="tn" />
                  </tr>
                ))}

                <tr><td colSpan={4} style={{ height: 4, padding: 0, border: 'none' }} /></tr>

                {/* COGS */}
                <tr>
                  <td><strong>COGS</strong></td>
                  <td className="tn" style={{ color: 'var(--color-warn)' }}>({fmtDollars(totalCogs)})</td>
                  <td className="tn">{totalRevenue > 0 ? Math.round((totalCogs / totalRevenue) * 100) : '—'}%</td>
                  <td className="tn" style={{ color: deltaColor(cogsDelta, true), fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {cogsDelta ?? '—'}
                  </td>
                </tr>

                <tr><td colSpan={4} style={{ height: 4, padding: 0, border: 'none' }} /></tr>

                {/* Gross Profit */}
                <tr style={{ borderTop: '2px solid var(--color-ink)' }}>
                  <td><strong>Gross Profit</strong></td>
                  <td className="tn" style={{ color: grossProfit >= 0 ? 'var(--color-ok)' : 'var(--color-warn)' }}>
                    <strong>{fmtDollars(grossProfit)}</strong>
                  </td>
                  <td className="tn">{grossMargin}%</td>
                  <td className="tn" style={{ color: deltaColor(gpDelta), fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {gpDelta ?? '—'}
                  </td>
                </tr>

                <tr><td colSpan={4} style={{ height: 4, padding: 0, border: 'none' }} /></tr>

                {/* OpEx */}
                {opexItems.map(op => {
                  const pctRev = totalRevenue > 0 ? Math.round((op.amount / totalRevenue) * 100) : 0
                  return (
                    <tr key={op.key}>
                      <td>{op.label}</td>
                      <td className="tn" style={{ color: op.amount > 0 ? 'var(--color-warn)' : 'var(--color-ink-4)' }}>
                        {op.amount > 0 ? `(${fmtDollars(op.amount)})` : '—'}
                      </td>
                      <td className="tn" style={{ color: op.amount > 0 ? undefined : 'var(--color-ink-4)' }}>
                        {op.amount > 0 ? `${pctRev}%` : '—'}
                      </td>
                      <td className="tn" style={{ color: 'var(--color-ink-4)' }}>—</td>
                    </tr>
                  )
                })}

                <tr><td colSpan={4} style={{ height: 4, padding: 0, border: 'none' }} /></tr>

                {/* Operating Income */}
                <tr className="row-hl" style={{ borderTop: '2px solid var(--color-ink)' }}>
                  <td><strong>Operating Income</strong></td>
                  <td className="tn" style={{ color: operatingIncome >= 0 ? 'var(--color-ok)' : 'var(--color-warn)' }}>
                    <strong>{fmtDollars(operatingIncome)}</strong>
                  </td>
                  <td className="tn">
                    {totalRevenue > 0 ? `${Math.round((operatingIncome / totalRevenue) * 100)}%` : '—'}
                  </td>
                  <td className="tn" style={{ color: deltaColor(oiDelta), fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {oiDelta ?? '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </AdminCard>

          <AdminCard title={<>Gross margin <em>by plan</em></>} tag="LTM">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '8px 0' }}>
              {planRevenue.filter(p => p.price > 0).map(p => {
                const planCogs = cogsPerCustomer * p.count
                const planGross = p.revenue - planCogs
                const planGM = p.revenue > 0 ? Math.round((planGross / p.revenue) * 100) : 0
                const planCogsPerUnit = p.count > 0 ? (planCogs / p.count) : 0
                return (
                  <div key={p.tier}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400 }}>{p.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)' }}>${p.price}/mo</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        background: 'var(--color-line)',
                        borderRadius: 4,
                        height: 24,
                        flex: 1,
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          background: planGM >= 70 ? 'var(--color-ok, #1a6b3c)' : planGM >= 40 ? '#1d3fd9' : 'var(--color-warn)',
                          borderRadius: 4,
                          height: 24,
                          width: `${Math.max(planGM, 3)}%`,
                        }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      <span>GM <strong>{planGM}%</strong></span>
                      <span style={{ color: 'var(--color-ink-3)' }}>COGS {fmtDollars(planCogsPerUnit)}</span>
                    </div>
                  </div>
                )
              })}
              {planRevenue.filter(p => p.price > 0).length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)' }}>
                  No paid plans active yet.
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        {/* ── §03 EDITABLE COGS ── */}
        <SectionHead index="03" title="COGS Configuration" />
        <AdminCard title={<>Profit &amp; <em>Loss</em></>} tag="MONTHLY · EDITABLE">
          <EditableCosts costs={costs} revenue={totalRevenue} />
        </AdminCard>

        {/* ── §04 OPEX CONFIGURATION ── */}
        <SectionHead index="04" title="OpEx Configuration" />
        <AdminCard title={<>Operating <em>expenses</em></>} tag="MONTHLY · EDITABLE">
          <EditableOpex items={opexItems} />
        </AdminCard>
      </div>
    </>
  )
}
