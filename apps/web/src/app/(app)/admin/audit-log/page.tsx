import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'

export default async function AuditLogPage() {
  const supabase = getSupabaseAdmin()

  // Build audit-like events from existing data (profiles, orgs, apps created)
  const [
    { data: recentUsers },
    { data: recentOrgs },
    { data: recentApps },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(20),
    supabase.from('organizations').select('id, name, created_at').order('created_at', { ascending: false }).limit(20),
    supabase.from('apps').select('id, name, platform, created_at').order('created_at', { ascending: false }).limit(20),
  ])

  // Merge into a timeline
  type Event = { type: string; label: string; detail: string; at: string }
  const events: Event[] = []

  for (const u of recentUsers ?? []) {
    events.push({ type: 'AUTH', label: 'User signup', detail: u.full_name ?? 'Unknown', at: u.created_at })
  }
  for (const o of recentOrgs ?? []) {
    events.push({ type: 'ORG', label: 'Org created', detail: o.name, at: o.created_at })
  }
  for (const a of recentApps ?? []) {
    events.push({ type: 'APP', label: 'App added', detail: `${a.name} (${a.platform})`, at: a.created_at })
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  const displayed = events.slice(0, 30)

  const uniqueActors = new Set((recentUsers ?? []).map(u => u.id)).size
  const today = new Date().toISOString().slice(0, 10)
  const todayEvents = events.filter(e => e.at.startsWith(today)).length

  return (
    <>
      <AdminPageHead
        category="System"
        title={<>Audit <em>log</em>.</>}
        subtitle="Platform activity timeline reconstructed from signup, org creation, and app events."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard label="Total Events" value={events.length.toString()} variant="hl" />
          <KpiCard label="Today" value={todayEvents.toString()} />
          <KpiCard label="Unique Users" value={uniqueActors.toString()} />
          <KpiCard label="Event Types" value="3" subtitle="Auth, Org, App" />
        </KpiGrid>

        <SectionHead number="§01" title={<>Activity <em>timeline</em></>} />
        <AdminCard title={<>Activity <em>Timeline</em></>} tag={`${displayed.length} EVENTS`}>
          {displayed.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-ink-3)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>No events recorded yet.</p>
            </div>
          ) : (
            <div>
              {displayed.map((e, i) => {
                const iconColor = e.type === 'AUTH' ? '#1d3fd9' : e.type === 'ORG' ? '#6b21a8' : '#2a8c4e'
                const dateStr = new Date(e.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const timeStr = new Date(e.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={`${e.type}-${i}`} className="timeline-item" style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-line-soft, var(--color-line))' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: iconColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {e.type[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13 }}>
                        <span className={`admin-pill ${e.type === 'AUTH' ? 'test' : e.type === 'ORG' ? 'purple' : 'ok'}`} style={{ marginRight: 8 }}>
                          {e.type}
                        </span>
                        {e.label} — <strong>{e.detail}</strong>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)', marginTop: 2, letterSpacing: '0.04em' }}>
                        {dateStr} · {timeStr}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </AdminCard>
      </div>
    </>
  )
}
