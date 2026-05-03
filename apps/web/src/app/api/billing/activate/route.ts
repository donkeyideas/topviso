import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe, PLANS } from '@/lib/stripe'
import { getPlanConfig } from '@/lib/plan-config'

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { subscriptionId } = body as { subscriptionId: string }

  if (!subscriptionId) {
    return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 })
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

  try {
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    // Verify this subscription belongs to user's org
    if (subscription.metadata?.organization_id !== profile.default_organization_id) {
      return NextResponse.json({ error: 'Subscription mismatch' }, { status: 403 })
    }

    // Map price ID to plan tier
    const priceId = subscription.items.data[0]?.price?.id
    let planTier: 'team' | 'enterprise' | null = null

    if (priceId === PLANS.team.stripePriceId) {
      planTier = 'team'
    } else if (priceId === PLANS.enterprise.stripePriceId) {
      planTier = 'enterprise'
    }

    if (!planTier) {
      return NextResponse.json({ error: 'Unknown plan for price' }, { status: 400 })
    }

    // Get authoritative limits from plan config
    const config = await getPlanConfig()
    const tierConfig = config[planTier]

    // Use untyped client (same pattern as webhook) to include keyword_limit
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await admin
      .from('organizations')
      .update({
        plan_tier: planTier,
        stripe_subscription_id: subscriptionId,
        seat_limit: tierConfig.seats,
        app_limit: tierConfig.apps,
        keyword_limit: tierConfig.keywords,
      })
      .eq('id', profile.default_organization_id)

    return NextResponse.json({ success: true, plan: planTier })
  } catch (err) {
    console.error('[billing/activate] error:', err)
    const message = err instanceof Error ? err.message : 'Activation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
