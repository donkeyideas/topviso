import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'

export default function FeatureFlagsPage() {
  return (
    <>
      <AdminPageHead
        category="System"
        title={<>Feature <em>flags</em>.</>}
        subtitle="Toggle features on and off, manage rollout percentages, and configure user-segment targeting."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard label="Total Flags" value="0" />
          <KpiCard label="Enabled" value="0" variant="ok-hl" />
          <KpiCard label="Disabled" value="0" />
          <KpiCard label="Partial Rollout" value="0" />
        </KpiGrid>

        <AdminCard title={<>Flag <em>registry</em></>} tag="NOT CONFIGURED">
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8, letterSpacing: '-0.02em' }}>
              No feature flags
            </div>
            <p style={{ color: 'var(--color-ink-3)', fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
              Feature flags require a <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--color-line)', padding: '2px 6px', borderRadius: 3 }}>feature_flags</code> table. Once created, you can toggle features, set rollout percentages, and target user segments.
            </p>
          </div>
        </AdminCard>
      </div>
    </>
  )
}
