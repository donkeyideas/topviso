import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    .select('stripe_subscription_id')
    .eq('id', profile.default_organization_id)
    .single()

  if (!org?.stripe_subscription_id) {
    return NextResponse.json({ cancel_at_period_end: false, current_period_end: null })
  }

  try {
    const stripe = getStripe()
    const result = await stripe.subscriptions.retrieve(org.stripe_subscription_id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = result as any

    // API 2026-03-25.dahlia moved current_period_end to items — use cancel_at instead
    const cancelAtPeriodEnd = sub.cancel_at_period_end ?? false
    const cancelAt = sub.cancel_at ?? null // Unix timestamp when plan actually cancels
    const status = sub.status ?? null

    return NextResponse.json({
      cancel_at_period_end: cancelAtPeriodEnd,
      current_period_end: cancelAt,
      status,
    })
  } catch (err) {
    console.error('[billing/status] Stripe error:', err)
    return NextResponse.json({ cancel_at_period_end: false, current_period_end: null })
  }
}
