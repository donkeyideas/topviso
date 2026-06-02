import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { PromoCodesClient } from './PromoCodesClient'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export default async function AdminPromoCodesPage() {
  const supabase = getSupabaseAdmin()

  // Pre-fetch the org list once for the "Apply to customer" picker.
  // Only orgs with an active subscription can receive a discount via update.
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, plan_tier, stripe_subscription_id')
    .not('stripe_subscription_id', 'is', null)
    .order('name', { ascending: true })

  return (
    <>
      <AdminPageHead
        category="Finance"
        title={<>Promo <em>codes</em>.</>}
        subtitle="Create, manage, and apply discount codes. Stripe is the source of truth — changes here update Stripe directly."
      />
      <div className="admin-content">
        <PromoCodesClient
          orgs={(orgs ?? []).map((o) => ({
            id: o.id,
            name: o.name,
            planTier: o.plan_tier,
          }))}
        />
      </div>
    </>
  )
}
