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
    .select('stripe_customer_id')
    .eq('id', profile.default_organization_id)
    .single()

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[billing/portal] Stripe error:', err)
    const message = err instanceof Error ? err.message : 'Billing portal failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
