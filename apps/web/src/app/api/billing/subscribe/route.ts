import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getStripe, PLANS } from '@/lib/stripe'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const plan = body.plan as 'team' | 'enterprise'
  const promoCode = typeof body.promoCode === 'string'
    ? body.promoCode.trim().toUpperCase()
    : ''

  if (!plan || !PLANS[plan]?.stripePriceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

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

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  try {
    const stripe = getStripe()
    let customerId = org.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? '',
        metadata: { organization_id: org.id },
      })
      customerId = customer.id

      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.id)
    }

    // Resolve promo code to a Stripe promotion_code ID. If the user typed a
    // code but it's invalid/expired, we DON'T silently drop it — we 400 so the
    // UI can show the error before charging the card.
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

    // Create subscription with incomplete status (payment collected in-app modal)
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: PLANS[plan].stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice'],
      metadata: {
        organization_id: org.id,
        plan,
        ...(promoCode ? { promo_code: promoCode } : {}),
      },
      ...(promotionCodeId
        ? { discounts: [{ promotion_code: promotionCodeId }] }
        : {}),
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice
    const firstChargeCents = invoice.amount_due
    const stickerCents = invoice.subtotal

    // Resolve the discount label once for the response payload.
    let discountLabel: string | null = null
    if (promotionCodeId) {
      const promoDetails = await stripe.promotionCodes.retrieve(promotionCodeId, {
        expand: ['promotion.coupon'],
      })
      const coupon = typeof promoDetails.promotion.coupon === 'object' ? promoDetails.promotion.coupon : null
      if (coupon) discountLabel = formatDiscount(coupon)
    }

    // 100%-off first-payment case: Stripe doesn't create a PaymentIntent for a
    // $0 invoice (nothing to charge), but we still need to collect a card so
    // future renewals — when the discount ends — don't fail. We use a
    // SetupIntent for that, and the frontend switches to confirmSetup.
    if (firstChargeCents === 0) {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          subscription_id: subscription.id,
          organization_id: org.id,
        },
      })
      if (!setupIntent.client_secret) {
        return NextResponse.json({ error: 'Could not create setup intent' }, { status: 500 })
      }
      return NextResponse.json({
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        subscriptionId: subscription.id,
        setupMode: true,
        firstChargeCents,
        stickerCents,
        currency: invoice.currency,
        discountLabel,
        appliedCode: promoCode || null,
      })
    }

    // Normal flow: retrieve the PaymentIntent client_secret from the invoice.
    const payments = await stripe.invoicePayments.list({
      invoice: invoice.id,
      expand: ['data.payment.payment_intent'],
      limit: 1,
    })

    const paymentRecord = payments.data[0]
    const pi = paymentRecord?.payment?.payment_intent as Stripe.PaymentIntent | undefined

    if (!pi?.client_secret) {
      return NextResponse.json({ error: 'Could not create payment intent' }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: pi.client_secret,
      subscriptionId: subscription.id,
      setupMode: false,
      firstChargeCents,
      stickerCents,
      currency: invoice.currency,
      discountLabel,
      appliedCode: promoCode || null,
    })
  } catch (err) {
    console.error('[billing/subscribe] Stripe error:', err)
    const message = err instanceof Error ? err.message : 'Subscription creation failed'
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
