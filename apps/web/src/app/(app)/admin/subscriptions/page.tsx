import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'

export default async function AdminSubscriptionsPage() {
  const supabase = getSupabaseAdmin()

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug, plan_tier, stripe_customer_id, stripe_subscription_id, trial_ends_at, seat_limit, app_limit')
    .order('created_at', { ascending: false })

  const rows = orgs ?? []
  const withStripe = rows.filter((o) => o.stripe_subscription_id).length
  const onTrial = rows.filter((o) => o.trial_ends_at && new Date(o.trial_ends_at) > new Date()).length

  return (
    <>
      <AdminPageHead
        category="System"
        title={<>Subscription <em>overview</em>.</>}
        subtitle="Plan tiers and Stripe billing info for all organizations."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard label="Total Orgs" value={rows.length.toLocaleString()} variant="hl" />
          <KpiCard label="Stripe Active" value={withStripe.toLocaleString()} variant="ok-hl" />
          <KpiCard label="On Trial" value={onTrial.toLocaleString()} variant="warn-hl" />
          <KpiCard label="No Billing" value={(rows.length - withStripe).toLocaleString()} />
        </KpiGrid>

        <AdminCard title={<>Billing <em>details</em></>} tag={`${rows.length} ORGS`}>
          {rows.length === 0 ? (
            <div className="stub-block">
              <h4>No subscriptions yet</h4>
              <p>Subscription data will appear once organizations are created.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Plan</th>
                  <th>Stripe Customer</th>
                  <th>Trial</th>
                  <th className="tn">Seats</th>
                  <th className="tn">Apps</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const trialActive = o.trial_ends_at && new Date(o.trial_ends_at) > new Date()
                  return (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.name}</strong>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-3)' }}>{o.slug}</div>
                      </td>
                      <td>
                        <span className={`admin-pill ${o.plan_tier === 'enterprise' ? 'purple' : o.plan_tier === 'team' ? 'test' : 'draft'}`}>
                          {o.plan_tier}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-3)' }}>
                        {o.stripe_customer_id ?? '—'}
                      </td>
                      <td>
                        {o.trial_ends_at ? (
                          <>
                            <span className={`admin-pill ${trialActive ? 'ok' : 'draft'}`}>
                              {trialActive ? 'ACTIVE' : 'ENDED'}
                            </span>
                          </>
                        ) : '—'}
                      </td>
                      <td className="tn">{o.seat_limit}</td>
                      <td className="tn">{o.app_limit}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </AdminCard>
      </div>
    </>
  )
}
