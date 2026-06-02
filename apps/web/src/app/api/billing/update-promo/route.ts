import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

// POST /api/billing/update-promo
// Apply OR remove a promo code on an in-flight (incomplete) subscription.
// Used by the Payment modal so users can enter their code at the last second
// without having to cancel and restart the upgrade flow.
//
// Body: { subscriptionId: string, promoCode?: string }
//   - promoCode set    → validate + apply
//   - promoCode empty  → remove any existing discount
//
// Returns the recalculated invoice amount + discount label so the modal can
// re-render "Pay $X (Y off for Z months)".
export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const subscriptionId = typeof body.subscriptionId === 'string' ? body.subscriptionId : ''
  if (!subscriptionId || !subscriptionId.startsWith('sub_')) {
    return NextResponse.json({ error: 'Invalid subscriptionId' }, { status: 400 })
  }

  const promoCode = typeof body.promoCode === 'string'
    ? body.promoCode.trim().toUpperCase()
    : ''

  // Verify ownership: the subscription must belong to the user's org
  const { data: profile } = await supabase
    .from('profiles')
    .select('default_organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.default_organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, stripe_customer_id')
    .eq('id', profile.default_organization_id)
    .single()
  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const existing = await stripe.subscriptions.retrieve(subscriptionId)
    if (existing.customer !== org.stripe_customer_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let promotionCodeId: string | undefined
    if (promoCode) {
      const promo = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
      })
      const found = promo.data[0]
      if (!found) {
        return NextResponse.json({ error: 'Promo code not found or expired' }, { status: 400 })
      }
      if (found.expires_at && found.expires_at * 1000 < Date.now()) {
        return NextResponse.json({ error: 'Promo code has expired' }, { status: 400 })
      }
      if (found.max_redemptions && found.times_redeemed >= found.max_redemptions) {
        return NextResponse.json({ error: 'Promo code is fully redeemed' }, { status: 400 })
      }
      promotionCodeId = found.id
    }

    // Probe what the resulting amount would be before committing. If the new
    // amount is $0 (100%-off discount), Stripe will cancel the existing
    // PaymentIntent — but our modal has a PaymentIntent client_secret, not a
    // SetupIntent one. Switching mid-flow requires re-opening the upgrade
    // dialog so we can issue the right intent type from scratch.
    const existingInvoice = existing.latest_invoice
    const existingAmountDue = typeof existingInvoice === 'string'
      ? null
      : (existingInvoice as Stripe.Invoice | null)?.amount_due ?? null

    // Update the subscription's discounts. Empty array clears any existing
    // discount. The in-flight invoice is recalculated.
    const updated = await stripe.subscriptions.update(subscriptionId, {
      discounts: promotionCodeId ? [{ promotion_code: promotionCodeId }] : [],
      expand: ['latest_invoice'],
    })

    const invoice = updated.latest_invoice as Stripe.Invoice

    // Guard the mode-crossing case: existing flow was paid (>$0), new amount
    // is $0 (or vice versa). The modal's clientSecret was issued for one type
    // of intent and can't switch. Roll back and tell the user to restart.
    if (existingAmountDue != null) {
      const crossedToZero = existingAmountDue > 0 && invoice.amount_due === 0
      const crossedFromZero = existingAmountDue === 0 && invoice.amount_due > 0
      if (crossedToZero || crossedFromZero) {
        // Best-effort revert
        await stripe.subscriptions
          .update(subscriptionId, {
            discounts: promotionCodeId ? [] : (existing.discounts ?? []).map((d) => ({ discount: typeof d === 'string' ? d : d.id })),
          })
          .catch(() => {})
        return NextResponse.json(
          {
            error:
              'This code changes the total to/from $0. Please close this dialog and re-open the upgrade flow with the code already applied.',
          },
          { status: 409 },
        )
      }
    }

    let discountLabel: string | null = null
    if (promotionCodeId) {
      const promoDetails = await stripe.promotionCodes.retrieve(promotionCodeId, {
        expand: ['promotion.coupon'],
      })
      const coupon = typeof promoDetails.promotion.coupon === 'object' ? promoDetails.promotion.coupon : null
      if (coupon) discountLabel = formatDiscount(coupon)
    }

    return NextResponse.json({
      firstChargeCents: invoice.amount_due,
      stickerCents: invoice.subtotal,
      currency: invoice.currency,
      discountLabel,
      appliedCode: promoCode || null,
    })
  } catch (err) {
    console.error('[billing/update-promo] Stripe error:', err)
    const message = err instanceof Error ? err.message : 'Could not update promo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function formatDiscount(coupon: Stripe.Coupon): string {
  let amount: string
  if (coupon.percent_off != null) amount = `${coupon.percent_off}% off`
  else if (coupon.amount_off != null && coupon.currency)
    amount = `${(coupon.amount_off / 100).toFixed(0)} ${coupon.currency.toUpperCase()} off`
  else amount = 'discount'
  if (coupon.duration === 'forever') return `${amount} forever`
  if (coupon.duration === 'once') return `${amount} (first payment)`
  if (coupon.duration === 'repeating' && coupon.duration_in_months)
    return `${amount} for ${coupon.duration_in_months} months`
  return amount
}
