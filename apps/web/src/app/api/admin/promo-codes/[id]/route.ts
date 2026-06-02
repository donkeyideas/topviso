import { NextRequest } from 'next/server'
import { requireSuperuser, adminResponse, adminError, auditLog } from '@/lib/admin/middleware'
import { getStripe } from '@/lib/stripe'

// PATCH /api/admin/promo-codes/{promo_id}
// Body: { active: boolean }
// Stripe doesn't let you delete a promotion code — toggling active=false is
// the canonical "revoke" path. New checkouts won't find it; existing
// subscriptions that already redeemed it keep their discount.
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperuser(request)
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  if (!id || !id.startsWith('promo_')) {
    return adminError('BAD_INPUT', 'Invalid promotion code id')
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return adminError('BAD_INPUT', 'Invalid JSON body')
  }

  if (typeof body.active !== 'boolean') {
    return adminError('BAD_INPUT', 'active (boolean) required')
  }

  try {
    const stripe = getStripe()
    const updated = await stripe.promotionCodes.update(id, { active: body.active })

    await auditLog(
      auth.userId,
      body.active ? 'promo_code.activate' : 'promo_code.deactivate',
      'promo_code',
      id,
      { code: updated.code },
    )

    return adminResponse({ id: updated.id, active: updated.active })
  } catch (err) {
    console.error('[admin/promo-codes/[id]] PATCH failed', err)
    return adminError('STRIPE_ERROR', err instanceof Error ? err.message : 'Update failed', 500)
  }
}
