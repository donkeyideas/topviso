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

    // Create subscription with incomplete status (payment collected in-app modal)
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: PLANS[plan].stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice'],
      metadata: { organization_id: org.id, plan },
    })

    // Retrieve the PaymentIntent client_secret from the invoice
    const invoice = subscription.latest_invoice as Stripe.Invoice

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
    })
  } catch (err) {
    console.error('[billing/subscribe] Stripe error:', err)
    const message = err instanceof Error ? err.message : 'Subscription creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
