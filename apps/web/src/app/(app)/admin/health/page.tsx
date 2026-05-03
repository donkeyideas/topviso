import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'

const services = [
  { name: 'Supabase', description: 'Database, auth, and storage backend.', envVar: 'NEXT_PUBLIC_SUPABASE_URL', required: true },
  { name: 'Stripe', description: 'Payment processing and subscription billing.', envVar: 'STRIPE_SECRET_KEY', required: false },
  { name: 'DeepSeek', description: 'LLM provider for AI-powered features.', envVar: 'DEEPSEEK_API_KEY', required: true },
  { name: 'Vercel', description: 'Hosting and edge deployment.', envVar: 'VERCEL', required: false },
]

export default async function HealthPage() {
  const supabase = getSupabaseAdmin()

  // Quick health check: can we query profiles?
  const start = Date.now()
  const { error: dbError } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
  const dbLatency = Date.now() - start
  const dbHealthy = !dbError

  // Check env vars
  const serviceStatus = services.map((s) => {
    const configured = !!process.env[s.envVar]
    return { ...s, configured, status: configured ? 'ok' : (s.required ? 'error' : 'warn') }
  })

  const healthyCount = serviceStatus.filter(s => s.status === 'ok').length
  const allHealthy = healthyCount === services.length && dbHealthy
  const now = new Date()

  return (
    <>
      <AdminPageHead
        category="System"
        title={<>System <em>health</em>.</>}
        subtitle="Service status and connectivity overview."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard
            label="Overall"
            value={allHealthy ? 'Healthy' : 'Degraded'}
            variant={allHealthy ? 'ok-hl' : 'warn-hl'}
          />
          <KpiCard label="Services" value={`${healthyCount}/${services.length}`} subtitle="Configured" />
          <KpiCard label="DB Latency" value={`${dbLatency}ms`} variant={dbLatency < 200 ? 'ok-hl' : 'default'} />
          <KpiCard
            label="Last Check"
            value={now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            subtitle="Just now"
          />
        </KpiGrid>

        {/* Database health */}
        <AdminCard title="Database" tag={dbHealthy ? 'CONNECTED' : 'ERROR'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Supabase PostgreSQL</div>
              <div style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>Query latency: {dbLatency}ms</div>
            </div>
            <span className={`admin-pill ${dbHealthy ? 'ok' : 'error'}`}>{dbHealthy ? 'CONNECTED' : 'ERROR'}</span>
          </div>
        </AdminCard>

        {/* Service cards */}
        <div className="admin-grid-2">
          {serviceStatus.map((service) => (
            <AdminCard key={service.name} title={service.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className={`admin-pill ${service.status === 'ok' ? 'ok' : service.status === 'warn' ? 'draft' : 'error'}`}>
                  {service.configured ? 'CONFIGURED' : 'MISSING'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.08em' }}>
                  {service.envVar}
                </span>
              </div>
              <p style={{ color: 'var(--color-ink-3)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                {service.description}
              </p>
            </AdminCard>
          ))}
        </div>
      </div>
    </>
  )
}
