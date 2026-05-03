import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'

export default async function AdminOrganizationsPage() {
  const supabase = getSupabaseAdmin()

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, plan_tier, seat_limit, created_at')
    .order('created_at', { ascending: false })

  const rows = orgs ?? []
  const planCounts = {
    solo: rows.filter((o) => o.plan_tier === 'solo').length,
    team: rows.filter((o) => o.plan_tier === 'team').length,
    enterprise: rows.filter((o) => o.plan_tier === 'enterprise').length,
  }

  return (
    <>
      <AdminPageHead
        category="System"
        title={<>All <em>organizations</em>.</>}
        subtitle="Every organization on the platform with plan distribution."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard label="Total Orgs" value={rows.length.toLocaleString()} variant="hl" />
          <KpiCard label="Solo" value={planCounts.solo.toLocaleString()} />
          <KpiCard label="Team" value={planCounts.team.toLocaleString()} variant="ok-hl" />
          <KpiCard label="Enterprise" value={planCounts.enterprise.toLocaleString()} variant="hl" />
        </KpiGrid>

        <AdminCard title={<>Organization <em>registry</em></>} tag={`${rows.length} TOTAL`}>
          {rows.length === 0 ? (
            <div className="stub-block">
              <h4>No organizations yet</h4>
              <p>Organizations will appear here once created.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Plan</th>
                  <th className="tn">Seats</th>
                  <th className="tn">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.name}</strong></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)' }}>{o.slug}</td>
                    <td>
                      <span className={`admin-pill ${o.plan_tier === 'enterprise' ? 'purple' : o.plan_tier === 'team' ? 'test' : 'draft'}`}>
                        {o.plan_tier}
                      </span>
                    </td>
                    <td className="tn">{o.seat_limit}</td>
                    <td className="tn">
                      {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminCard>
      </div>
    </>
  )
}
