import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { ComputeSnapshotsButton } from '@/components/admin/ComputeSnapshotsButton'

export default async function SettingsPage() {
  const supabase = getSupabaseAdmin()

  // Get real org limits
  const { data: orgs } = await supabase
    .from('organizations')
    .select('app_limit, seat_limit')
    .limit(1)
    .maybeSingle()

  const envVars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', set: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', set: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    { name: 'STRIPE_SECRET_KEY', set: !!process.env.STRIPE_SECRET_KEY },
    { name: 'STRIPE_WEBHOOK_SECRET', set: !!process.env.STRIPE_WEBHOOK_SECRET },
    { name: 'DEEPSEEK_API_KEY', set: !!process.env.DEEPSEEK_API_KEY },
  ]

  const configSections = [
    {
      label: 'GENERAL',
      options: [
        { name: 'Platform Name', value: 'Top Viso' },
        { name: 'Default Timezone', value: 'UTC' },
        { name: 'Maintenance Mode', value: 'Off' },
      ],
    },
    {
      label: 'LIMITS',
      options: [
        { name: 'Max Apps Per Org', value: (orgs?.app_limit ?? 50).toString() },
        { name: 'Max Seats Per Org', value: (orgs?.seat_limit ?? 5).toString() },
        { name: 'API Rate Limit (req/min)', value: '120' },
      ],
    },
  ]

  return (
    <>
      <AdminPageHead
        category="System"
        title={<>Admin <em>settings</em>.</>}
        subtitle="System-wide configuration, environment variables, and external service links."
      />

      <div className="admin-content">
        {/* Environment info */}
        <AdminCard title="Environment" tag="CURRENT">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.12em', marginBottom: 4 }}>ENVIRONMENT</div>
              <span className="admin-pill live">PRODUCTION</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.12em', marginBottom: 4 }}>FRAMEWORK</div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Next.js 15</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.12em', marginBottom: 4 }}>NODE</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{process.version}</span>
            </div>
          </div>
        </AdminCard>

        <div style={{ height: 24 }} />

        {/* Environment variables */}
        <AdminCard title="Environment Variables" tag={`${envVars.filter(v => v.set).length}/${envVars.length} SET`}>
          {envVars.map((v, idx) => (
            <div
              key={v.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderTop: idx > 0 ? '1px solid var(--color-line-soft, var(--color-line))' : 'none',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v.name}</span>
              <span className={`admin-pill ${v.set ? 'ok' : 'error'}`}>
                {v.set ? 'SET' : 'MISSING'}
              </span>
            </div>
          ))}
        </AdminCard>

        <div style={{ height: 24 }} />

        {/* Config sections */}
        {configSections.map((section) => (
          <div key={section.label} style={{ marginBottom: 24 }}>
            <AdminCard title={section.label}>
              {section.options.map((option, idx) => (
                <div
                  key={option.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderTop: idx > 0 ? '1px solid var(--color-line-soft, var(--color-line))' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13 }}>{option.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-3)' }}>
                    {option.value}
                  </span>
                </div>
              ))}
            </AdminCard>
          </div>
        ))}

        {/* Analytics Snapshot */}
        <AdminCard title="Analytics Snapshots" tag="COMPUTE">
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--color-ink-3)', margin: '0 0 12px' }}>
              Compute and store MRR snapshots, health scores, usage metrics, and module retention data.
              This populates the analytics tables used by dashboard charts and KPIs.
            </p>
            <ComputeSnapshotsButton />
          </div>
        </AdminCard>

        <div style={{ height: 24 }} />

        {/* External Links */}
        <AdminCard title="External Dashboards" tag="QUICK LINKS">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { name: 'Stripe Dashboard', desc: 'Billing & subscriptions' },
              { name: 'Supabase Studio', desc: 'Database & auth' },
              { name: 'Vercel Dashboard', desc: 'Deployments & logs' },
            ].map((link) => (
              <div key={link.name} style={{ padding: '16px 14px', border: '1px solid var(--color-line)', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{link.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{link.desc}</div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </>
  )
}
