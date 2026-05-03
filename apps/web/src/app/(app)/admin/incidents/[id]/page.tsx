import Link from 'next/link'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <>
      <AdminPageHead
        category="Operations"
        title={<>Incident <em>detail</em>.</>}
      />
      <div className="admin-content">
        <AdminCard title={`Incident #${id}`}>
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Incident not found
            </div>
            <p style={{ color: 'var(--color-ink-3)', fontSize: 13, marginBottom: 16 }}>
              No incident tracking table exists yet. Create an <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--color-line)', padding: '2px 6px', borderRadius: 3 }}>incidents</code> table to enable this feature.
            </p>
            <Link href="/admin/incidents" style={{ color: 'var(--color-accent)', fontSize: 13, fontWeight: 600 }}>
              ← Back to Incidents
            </Link>
          </div>
        </AdminCard>
      </div>
    </>
  )
}
