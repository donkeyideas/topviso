import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'

export default async function AdminUsersPage() {
  const supabase = getSupabaseAdmin()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, is_superuser, dashboard_mode, created_at')
    .order('created_at', { ascending: false })

  const rows = users ?? []
  const superusers = rows.filter((u) => u.is_superuser).length
  const focusedCount = rows.filter((u) => (u.dashboard_mode ?? 'focused') === 'focused').length
  const fullSuiteCount = rows.length - focusedCount

  return (
    <>
      <AdminPageHead
        category="System"
        title={<>All <em>users</em>.</>}
        subtitle="Every profile registered on the platform."
      />

      <div className="admin-content">
        <KpiGrid columns={5}>
          <KpiCard label="Total Users" value={rows.length.toLocaleString()} variant="hl" />
          <KpiCard label="Superusers" value={superusers.toLocaleString()} variant="warn-hl" />
          <KpiCard label="Regular" value={(rows.length - superusers).toLocaleString()} />
          <KpiCard label="Focused" value={focusedCount.toLocaleString()} />
          <KpiCard label="Full Suite" value={fullSuiteCount.toLocaleString()} />
        </KpiGrid>

        <AdminCard title={<>User <em>registry</em></>} tag={`${rows.length} TOTAL`}>
          {rows.length === 0 ? (
            <div className="stub-block">
              <h4>No users yet</h4>
              <p>Users will appear here once they sign up.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Mode</th>
                  <th className="tn">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)' }}>
                      {u.id.slice(0, 8)}
                    </td>
                    <td><strong>{u.full_name ?? '—'}</strong></td>
                    <td>
                      <span className={`admin-pill ${u.is_superuser ? 'warn' : 'draft'}`}>
                        {u.is_superuser ? 'SUPERUSER' : 'USER'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-pill ${(u.dashboard_mode ?? 'focused') === 'focused' ? 'live' : 'draft'}`}>
                        {((u.dashboard_mode ?? 'focused') as string).toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="tn">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
