import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'

export default async function AdminApiKeysPage() {
  const supabase = getSupabaseAdmin()

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, organization_id, name, prefix, last_used_at, revoked_at, created_at')
    .order('created_at', { ascending: false })

  const rows = keys ?? []
  const activeKeys = rows.filter((k) => !k.revoked_at).length
  const revokedKeys = rows.filter((k) => k.revoked_at).length

  return (
    <>
      <AdminPageHead
        category="System"
        title={<>All API <em>keys</em>.</>}
        subtitle="API keys across every organization on the platform."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard label="Total Keys" value={rows.length.toLocaleString()} variant="hl" />
          <KpiCard label="Active" value={activeKeys.toLocaleString()} variant="ok-hl" />
          <KpiCard label="Revoked" value={revokedKeys.toLocaleString()} variant="warn-hl" />
          <KpiCard label="Used Today" value="—" subtitle="No tracking yet" />
        </KpiGrid>

        <AdminCard title={<>Key <em>registry</em></>} tag={`${rows.length} TOTAL`}>
          {rows.length === 0 ? (
            <div className="stub-block">
              <h4>No API keys yet</h4>
              <p>Keys will appear here once organizations generate them.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Prefix</th>
                  <th>Org ID</th>
                  <th>Last Used</th>
                  <th>Status</th>
                  <th className="tn">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((k) => (
                  <tr key={k.id}>
                    <td><strong>{k.name}</strong></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)' }}>
                      {k.prefix}...
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)' }}>
                      {k.organization_id.slice(0, 8)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      <span className={`admin-pill ${k.revoked_at ? 'warn' : 'ok'}`}>
                        {k.revoked_at ? 'REVOKED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="tn">
                      {new Date(k.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
