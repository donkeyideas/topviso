import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function POST() {
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
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const result = await stripe.subscriptions.update(org.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // API 2026-03-25.dahlia: current_period_end moved to items, use cancel_at instead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = result as any
    return NextResponse.json({
      cancelled: true,
      current_period_end: sub.cancel_at ?? null,
    })
  } catch (err) {
    console.error('[billing/cancel] Stripe error:', err)
    const message = err instanceof Error ? err.message : 'Cancel failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
