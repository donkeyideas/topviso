import { NextRequest } from 'next/server'
import { requireSuperuser, adminResponse, adminError, auditLog } from '@/lib/admin/middleware'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'

// POST /api/admin/promo-codes/apply
// Manually apply a promo code to an existing organization's subscription.
// Use this to grant a discount to a specific customer (support gesture,
// retention save, affiliate, etc.) without making them re-enter the code.
//
// Body: { organizationId: string, promotionCodeId: string }
//
// Note: Stripe applies discounts to the NEXT invoice cycle, not retroactively
// to the current one. If you need to credit a past invoice, do that via the
// Stripe Dashboard as a credit note.
export async function POST(request: NextRequest) {
  const auth = await requireSuperuser(request)
  if (!auth.ok) return auth.response

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return adminError('BAD_INPUT', 'Invalid JSON body')
  }

  const organizationId = typeof body.organizationId === 'string' ? body.organizationId : ''
  const promotionCodeId = typeof body.promotionCodeId === 'string' ? body.promotionCodeId : ''
  if (!organizationId || !promotionCodeId) {
    return adminError('BAD_INPUT', 'organizationId and promotionCodeId required')
  }
  if (!promotionCodeId.startsWith('promo_')) {
    return adminError('BAD_INPUT', 'Invalid promotionCodeId — must start with promo_')
  }

  const supabase = getSupabaseAdmin()
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .select('id, name, stripe_subscription_id, stripe_customer_id')
    .eq('id', organizationId)
    .single()

  if (orgErr || !org) {
    return adminError('NOT_FOUND', 'Organization not found', 404)
  }
  if (!org.stripe_subscription_id) {
    return adminError(
      'NO_SUBSCRIPTION',
      `${org.name} has no active subscription — discount can only be applied at first checkout`,
      400,
    )
  }

  try {
    const stripe = getStripe()
    const updated = await stripe.subscriptions.update(org.stripe_subscription_id, {
      discounts: [{ promotion_code: promotionCodeId }],
    })

    await auditLog(auth.userId, 'promo_code.apply', 'organization', organizationId, {
      promotion_code: promotionCodeId,
      subscription_id: updated.id,
    })

    return adminResponse({
      subscriptionId: updated.id,
      orgName: org.name,
    })
  } catch (err) {
    console.error('[admin/promo-codes/apply] failed', err)
    return adminError('STRIPE_ERROR', err instanceof Error ? err.message : 'Failed to apply code', 500)
  }
}
