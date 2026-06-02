import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getStripe, PLANS } from '@/lib/stripe'

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

  // Get user's org
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

    // Resolve promo code → Stripe promotion_code ID. If user typed something
    // invalid, surface a 400 — don't silently drop the discount.
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

    // Create checkout session. If no promo code resolved, set
    // allow_promotion_codes so users can still enter one on Stripe's hosted page.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PLANS[plan].stripePriceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?cancelled=true`,
      metadata: {
        organization_id: org.id,
        plan,
        ...(promoCode ? { promo_code: promoCode } : {}),
      },
      ...(promotionCodeId
        ? { discounts: [{ promotion_code: promotionCodeId }] }
        : { allow_promotion_codes: true }),
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[billing/checkout] Stripe error:', err)
    const message = err instanceof Error ? err.message : 'Stripe checkout failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
