import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

// Validates a promo code against Stripe and returns the discount details
// without applying it. The actual application happens when the user proceeds
// to checkout — we just preview here so they see "50% off applied" before
// committing to a plan.
export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const rawCode = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
  if (!rawCode || rawCode.length > 64) {
    return NextResponse.json({ error: 'Enter a code' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const result = await stripe.promotionCodes.list({
      code: rawCode,
      active: true,
      limit: 1,
      expand: ['data.promotion.coupon'],
    })

    const promo = result.data[0]
    if (!promo) {
      return NextResponse.json({ valid: false, error: 'Code not found or expired' })
    }

    if (promo.expires_at && promo.expires_at * 1000 < Date.now()) {
      return NextResponse.json({ valid: false, error: 'Code has expired' })
    }

    if (promo.max_redemptions && promo.times_redeemed >= promo.max_redemptions) {
      return NextResponse.json({ valid: false, error: 'Code is fully redeemed' })
    }

    // After expand, promo.promotion.coupon is the full Coupon object (not a string).
    const coupon = promo.promotion.coupon
    if (!coupon || typeof coupon === 'string') {
      return NextResponse.json({ valid: false, error: 'Code is misconfigured' })
    }

    const description = formatDiscountLabel(coupon)

    return NextResponse.json({
      valid: true,
      code: promo.code,
      promotionCodeId: promo.id,
      description,
      percentOff: coupon.percent_off ?? null,
      amountOff: coupon.amount_off ?? null,
      currency: coupon.currency ?? null,
      duration: coupon.duration,
      durationInMonths: coupon.duration_in_months ?? null,
    })
  } catch (err) {
    console.error('[billing/validate-promo] error', err)
    return NextResponse.json({ error: 'Could not validate code' }, { status: 500 })
  }
}

function formatDiscountLabel(coupon: Stripe.Coupon): string {
  let amount: string
  if (coupon.percent_off) {
    amount = `${coupon.percent_off}% off`
  } else if (coupon.amount_off && coupon.currency) {
    amount = `${(coupon.amount_off / 100).toFixed(0)} ${coupon.currency.toUpperCase()} off`
  } else {
    amount = 'discount applied'
  }

  if (coupon.duration === 'forever') return `${amount} forever`
  if (coupon.duration === 'once') return `${amount} (first payment)`
  if (coupon.duration === 'repeating' && coupon.duration_in_months) {
    return `${amount} for ${coupon.duration_in_months} months`
  }
  return amount
}
