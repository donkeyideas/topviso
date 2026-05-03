import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { FunnelStage } from '@/components/admin/FunnelStage'
import { EmptyMetric } from '@/components/admin/EmptyMetric'

export default async function FunnelAnalyticsPage() {
  const supabase = getSupabaseAdmin()

  /* ── 1. Build 5-stage funnel from real data ── */
  const [
    { count: signups },
    { count: withOrg },
    { data: orgsWithApps },
    { data: analysisResults },
    { data: paidOrgs },
    { data: allOrgs },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('organization_members').select('user_id', { count: 'exact', head: true }),
    supabase.from('apps').select('organization_id').eq('is_active', true),
    supabase.from('analysis_results').select('app_id, organization_id, created_at'),
    supabase.from('organizations').select('id, plan_tier, created_at').neq('plan_tier', 'solo'),
    supabase.from('organizations').select('id, plan_tier, created_at'),
  ])

  const signupsCount = signups ?? 0
  const onboarded = withOrg ?? 0

  // Unique orgs with apps
  const orgsWithAppsSet = new Set((orgsWithApps ?? []).map(a => a.organization_id))
  const activated = orgsWithAppsSet.size

  // Unique apps with analysis → map back to orgs for engaged count
  const orgsEngagedSet = new Set((analysisResults ?? []).map(a => a.organization_id))
  const engaged = orgsEngagedSet.size

  const converted = paidOrgs?.length ?? 0

  const stages = [
    { name: 'Marketing visitors', desc: 'LANDING + COMPARE PAGES', count: signupsCount, note: 'visitors' },
    { name: 'Signup', desc: 'EMAIL + GOOGLE SSO', count: signupsCount, note: '' },
    { name: 'Activated', desc: 'LINKED ≥1 APP · 72H', count: activated, note: '' },
    { name: 'Engaged in trial', desc: '3+ ACTIVE DAYS', count: engaged, note: '' },
    { name: 'Paid', desc: 'CARD ENTERED', count: converted, note: '' },
  ]

  /* ── 2. Conversion rate KPIs ── */
  const visitorToPaid = signupsCount > 0 ? ((converted / signupsCount) * 100).toFixed(2) : null
  const signupToTrial = signupsCount > 0 ? Math.round((activated / signupsCount) * 100) : null
  const trialToPaid = engaged > 0 ? Math.round((converted / engaged) * 100) : null

  // Time-to-paid: compute median days from org creation to now for paid orgs
  let medianTimeToPaid: number | null = null
  if (paidOrgs && paidOrgs.length > 0) {
    const now = Date.now()
    const days = paidOrgs.map(o => Math.max(0, Math.round((now - new Date(o.created_at).getTime()) / 86400000)))
    days.sort((a, b) => a - b)
    medianTimeToPaid = days[Math.floor(days.length / 2)] ?? null
  }

  /* ── 3. Funnel by channel (from signup_funnel_daily if available) ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: funnelDaily } = await (supabase as any)
    .from('signup_funnel_daily')
    .select('channel, visitors, signups, activated, paid')
    .order('visitors', { ascending: false }) as { data: { channel: string; visitors: number; signups: number; activated: number; paid: number }[] | null }

  interface ChannelRow {
    channel: string
    visitors: number
    toSignup: string
    toTrial: string
    toPaid: string
    endToEnd: string
  }

  let channelRows: ChannelRow[] | null = null
  if (funnelDaily && funnelDaily.length > 0) {
    // Aggregate by channel
    const byChannel = new Map<string, { visitors: number; signups: number; activated: number; paid: number }>()
    for (const row of funnelDaily) {
      const ch = row.channel ?? 'Direct'
      const existing = byChannel.get(ch) ?? { visitors: 0, signups: 0, activated: 0, paid: 0 }
      existing.visitors += row.visitors ?? 0
      existing.signups += row.signups ?? 0
      existing.activated += row.activated ?? 0
      existing.paid += row.paid ?? 0
      byChannel.set(ch, existing)
    }
    channelRows = [...byChannel.entries()]
      .sort((a, b) => b[1].visitors - a[1].visitors)
      .map(([ch, d]) => ({
        channel: ch,
        visitors: d.visitors,
        toSignup: d.visitors > 0 ? `${Math.round((d.signups / d.visitors) * 100)}%` : '—',
        toTrial: d.signups > 0 ? `${Math.round((d.activated / d.signups) * 100)}%` : '—',
        toPaid: d.activated > 0 ? `${Math.round((d.paid / d.activated) * 100)}%` : '—',
        endToEnd: d.visitors > 0 ? `${((d.paid / d.visitors) * 100).toFixed(2)}%` : '—',
      }))
  }

  /* ── 4. Time-to-paid distribution (histogram buckets) ── */
  let histogramData: { bucket: string; count: number }[] | null = null
  if (paidOrgs && paidOrgs.length > 0) {
    const now = Date.now()
    const buckets = [0, 0, 0, 0] // 0-7d, 8-14d, 15-30d, 30d+
    for (const o of paidOrgs) {
      const days = Math.round((now - new Date(o.created_at).getTime()) / 86400000)
      if (days <= 7) buckets[0]!++
      else if (days <= 14) buckets[1]!++
      else if (days <= 30) buckets[2]!++
      else buckets[3]!++
    }
    histogramData = [
      { bucket: '0–7d', count: buckets[0]! },
      { bucket: '8–14d', count: buckets[1]! },
      { bucket: '15–30d', count: buckets[2]! },
      { bucket: '30d+', count: buckets[3]! },
    ]
  }

  const histMax = histogramData ? Math.max(...histogramData.map(d => d.count), 1) : 1

  /* ── 5. Conversion detail table ── */
  const detailStages = [
    { name: 'Signups', count: signupsCount, prevCount: signupsCount },
    { name: 'Onboarded', count: onboarded, prevCount: signupsCount },
    { name: 'Activated', count: activated, prevCount: onboarded },
    { name: 'Engaged', count: engaged, prevCount: activated },
    { name: 'Converted', count: converted, prevCount: engaged },
  ]

  return (
    <>
      <AdminPageHead
        category="Acquisition"
        title={<>Visitor <em>to paid</em>.</>}
        subtitle="The 5-stage funnel with per-channel diagnostics. Time-to-conversion distribution by segment."
      />

      <div className="admin-content">

        {/* ── KPI STRIP ── */}
        <KpiGrid columns={4}>
          <KpiCard
            label="VISITOR → PAID"
            value={visitorToPaid !== null ? `${visitorToPaid}%` : '—'}
            subtitle="End-to-end"
            variant="hl"
          />
          <KpiCard
            label="SIGNUP → TRIAL"
            value={signupToTrial !== null ? `${signupToTrial}%` : '—'}
            subtitle="Activation · 72h"
          />
          <KpiCard
            label="TRIAL → PAID"
            value={trialToPaid !== null ? `${trialToPaid}%` : '—'}
            subtitle="30d window"
          />
          <KpiCard
            label="TIME TO PAID"
            value={medianTimeToPaid !== null ? `${medianTimeToPaid} days` : '—'}
            subtitle="Median"
          />
        </KpiGrid>

        {/* ── §01 THE FUNNEL ── */}
        <SectionHead number="§01" title={<>The funnel · <em>T30D</em></>} />

        <AdminCard title={<>Conversion <em>Funnel</em></>} tag="5-STAGE">
          {stages.map((s, i) => {
            const prev = i > 0 ? stages[i - 1]!.count : s.count
            const rate = prev > 0 ? `${Math.round((s.count / prev) * 100)}%` : '—'
            const rateLabel = i === 0 ? 'BASELINE' : `OF ${stages[i - 1]!.name.toUpperCase()}`
            return (
              <FunnelStage
                key={s.name}
                label={s.name}
                sublabel={s.desc}
                count={s.count}
                maxCount={stages[0]!.count}
                rate={rate}
                rateLabel={rateLabel}
              />
            )
          })}
        </AdminCard>

        {/* ── §02 FUNNEL BY CHANNEL + TIME-TO-PAID ── */}
        <SectionHead number="§02" title={<>Channel &amp; <em>timing</em></>} />

        <div className="admin-grid-2">
          <AdminCard title={<>Funnel by <em>channel</em></>} tag="DIAGNOSTIC">
            {channelRows && channelRows.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th className="tn">Visitors</th>
                    <th className="tn">→Signup</th>
                    <th className="tn">→Trial</th>
                    <th className="tn">→Paid</th>
                    <th className="tn">End-to-End</th>
                  </tr>
                </thead>
                <tbody>
                  {channelRows.map((row) => (
                    <tr key={row.channel}>
                      <td><strong>{row.channel}</strong></td>
                      <td className="tn">{row.visitors.toLocaleString()}</td>
                      <td className="tn">{row.toSignup}</td>
                      <td className="tn">{row.toTrial}</td>
                      <td className="tn">{row.toPaid}</td>
                      <td className="tn">{row.endToEnd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyMetric message="No channel data" hint="Funnel by channel requires UTM tracking and the signup_funnel_daily table to be populated." />
            )}
          </AdminCard>

          <AdminCard title={<>Time-to-paid <em>distribution</em></>} tag="HISTOGRAM" bodyClass="chart">
            {histogramData && histogramData.some(d => d.count > 0) ? (
              <div style={{ padding: '16px 0' }}>
                {medianTimeToPaid !== null && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-accent)', letterSpacing: '0.08em', marginBottom: 12, paddingLeft: 4 }}>
                    ▾ MEDIAN {medianTimeToPaid}d
                  </div>
                )}
                <svg viewBox="0 0 340 140" width="100%" style={{ display: 'block' }}>
                  {/* Grid */}
                  <line x1="40" y1="110" x2="330" y2="110" stroke="var(--color-line, #d8d3c4)" strokeWidth="0.5" />

                  {histogramData.map((d, i) => {
                    const barH = histMax > 0 ? (d.count / histMax) * 90 : 0
                    const x = 50 + i * 72
                    const barW = 50
                    return (
                      <g key={i}>
                        <rect x={x} y={110 - barH} width={barW} height={Math.max(barH, 1)} fill="var(--color-accent, #1d3fd9)" rx="2" />
                        {d.count > 0 && (
                          <text x={x + barW / 2} y={105 - barH} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--color-ink)" fontWeight="600">
                            {d.count}
                          </text>
                        )}
                        <text x={x + barW / 2} y={126} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--color-ink-4, #a8a69b)" letterSpacing="0.06em">
                          {d.bucket}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            ) : (
              <EmptyMetric message="No paid conversions yet" hint="Time-to-paid distribution will show once users upgrade to a paid plan." />
            )}
          </AdminCard>
        </div>

        {/* ── §03 STAGE DETAIL ── */}
        <SectionHead number="§03" title={<>Stage <em>detail</em></>} />

        <AdminCard title={<>Conversion <em>Table</em></>} tag="DETAILED">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th className="tn">Count</th>
                <th className="tn">Drop-off</th>
                <th className="tn">Conv. Rate</th>
                <th style={{ width: '40%' }}>Bar</th>
              </tr>
            </thead>
            <tbody>
              {detailStages.map((s, i) => {
                const dropoff = i > 0 ? s.prevCount - s.count : 0
                const rateNum = s.prevCount > 0 ? Math.round((s.count / s.prevCount) * 100) : 100
                const barWidth = signupsCount > 0 ? Math.round((s.count / signupsCount) * 100) : 0
                return (
                  <tr key={s.name}>
                    <td><strong>{s.name}</strong></td>
                    <td className="tn">{s.count}</td>
                    <td className="tn" style={{ color: dropoff > 0 ? 'var(--color-warn)' : undefined }}>
                      {i > 0 ? `${dropoff > 0 ? '-' : ''}${dropoff}` : '—'}
                    </td>
                    <td className="tn">{i > 0 ? `${rateNum}%` : '—'}</td>
                    <td>
                      <div style={{ background: 'var(--color-line)', borderRadius: 3, height: 8, width: '100%' }}>
                        <div style={{ background: 'var(--color-accent)', borderRadius: 3, height: 8, width: `${Math.max(barWidth, 2)}%` }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </AdminCard>

        {/* ── §04 OVERALL CONVERSION ── */}
        <SectionHead number="§04" title={<>Overall <em>conversion</em></>} />

        <AdminCard title="End-to-End" tag="SIGNUP → PAID">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em' }}>
                {visitorToPaid !== null ? `${visitorToPaid}%` : '0%'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', letterSpacing: '0.1em' }}>
                SIGNUP → PAID CONVERSION
              </div>
            </div>
          </div>
        </AdminCard>

      </div>
    </>
  )
}
