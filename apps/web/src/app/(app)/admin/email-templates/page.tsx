import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { EmailTemplatesClient } from '@/components/admin/EmailTemplatesClient'
import { TEMPLATE_REGISTRY } from '@/lib/email/template-registry'
import { getEmailStats } from './actions'

export default async function AdminEmailTemplatesPage() {
  const stats = await getEmailStats()

  const activeTemplates = TEMPLATE_REGISTRY.filter(
    (t) => t.category !== 'auth',
  ).length
  const deliveryRate =
    stats.totalSent + stats.totalFailed > 0
      ? (
          (stats.totalSent / (stats.totalSent + stats.totalFailed)) *
          100
        ).toFixed(1)
      : '100.0'

  return (
    <>
      <AdminPageHead
        category="Marketing"
        title={
          <>
            Email <em>templates</em>.
          </>
        }
        subtitle="Preview, edit, and test email templates used across the platform."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard
            label="Emails Sent"
            value={stats.totalSent.toString()}
            subtitle="Last 30 days"
            variant="hl"
          />
          <KpiCard
            label="Delivery Rate"
            value={`${deliveryRate}%`}
            subtitle="Last 30 days"
            variant={parseFloat(deliveryRate) >= 99 ? 'ok-hl' : 'default'}
          />
          <KpiCard
            label="Templates Active"
            value={activeTemplates.toString()}
            subtitle="Managed by platform"
          />
          <KpiCard
            label="Test Emails"
            value={stats.testEmails.toString()}
            subtitle="All time"
          />
        </KpiGrid>

        <EmailTemplatesClient templates={TEMPLATE_REGISTRY} />
      </div>
    </>
  )
}
