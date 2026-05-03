import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'

export default async function AdminAppsPage() {
  const supabase = getSupabaseAdmin()

  const { data: apps } = await supabase
    .from('apps')
    .select('id, name, platform, store_id, is_active')
    .order('created_at', { ascending: false })

  const rows = apps ?? []
  const activeCount = rows.filter((a) => a.is_active).length

  return (
    <>
      <AdminPageHead
        category="System"
        title={<>All <em>apps</em>.</>}
        subtitle="Every app tracked across the platform."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard label="Total Apps" value={rows.length.toLocaleString()} variant="hl" />
          <KpiCard label="Active" value={activeCount.toLocaleString()} variant="ok-hl" />
          <KpiCard label="Inactive" value={(rows.length - activeCount).toLocaleString()} />
          <KpiCard label="iOS / Android" value={`${rows.filter((a) => a.platform === 'ios').length} / ${rows.filter((a) => a.platform === 'android').length}`} small />
        </KpiGrid>

        <AdminCard title={<>App <em>registry</em></>} tag={`${rows.length} TOTAL`}>
          {rows.length === 0 ? (
            <div className="stub-block">
              <h4>No apps yet</h4>
              <p>Apps will appear here once organizations add them.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Platform</th>
                  <th>Store ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.name}</strong></td>
                    <td>
                      <span className={`admin-pill ${a.platform === 'ios' ? 'test' : 'ok'}`}>
                        {a.platform.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)' }}>
                      {a.store_id}
                    </td>
                    <td>
                      <span className={`admin-pill ${a.is_active ? 'ok' : 'draft'}`}>
                        {a.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
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
