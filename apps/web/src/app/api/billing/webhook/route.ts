import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { getPlanConfig } from '@/lib/plan-config'
import { sendEmail } from '@/lib/email/resend'
import * as subscriptionActivatedTemplate from '@/lib/email/templates/subscription-activated'
import * as paymentFailedTemplate from '@/lib/email/templates/payment-failed'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Use service role client for webhook processing
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const orgId = session.metadata?.organization_id
        const plan = session.metadata?.plan as 'team' | 'enterprise'

        if (orgId && plan) {
          // Idempotency: skip if already set
          const { data: currentOrg } = await supabase
            .from('organizations')
            .select('plan_tier, stripe_subscription_id')
            .eq('id', orgId)
            .single()

          if (
            currentOrg?.plan_tier === plan &&
            currentOrg?.stripe_subscription_id === (session.subscription as string)
          ) {
            console.log(`[webhook] checkout.session.completed already processed for org ${orgId}`)
            break
          }

          const config = await getPlanConfig()
          const tierConfig = config[plan]

          await supabase
            .from('organizations')
            .update({
              plan_tier: plan,
              stripe_subscription_id: session.subscription as string,
              seat_limit: tierConfig.seats,
              app_limit: tierConfig.apps,
              keyword_limit: tierConfig.keywords,
            })
            .eq('id', orgId)

          // Send subscription activated email to org owner
          try {
            const { data: owner } = await supabase
              .from('organization_members')
              .select('user_id')
              .eq('organization_id', orgId)
              .eq('role', 'owner')
              .limit(1)
              .single()

            if (owner) {
              const { data: ownerAuth } = await supabase.auth.admin.getUserById(owner.user_id)
              const ownerEmail = ownerAuth?.user?.email
              if (ownerEmail) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
                const html = subscriptionActivatedTemplate.render({
                  userName: ownerAuth?.user?.user_metadata?.full_name ?? ownerEmail.split('@')[0],
                  planName: tierConfig.name,
                  price: tierConfig.priceMonthly,
                  appLimit: tierConfig.apps,
                  keywordLimit: tierConfig.keywords,
                  seatLimit: tierConfig.seats,
                  dashboardUrl: `${appUrl}/app`,
                })
                await sendEmail(ownerEmail, subscriptionActivatedTemplate.subject, html, {
                  emailType: 'subscription-activated',
                  userId: owner.user_id,
                })
              }
            }
          } catch (emailErr) {
            console.error('[webhook] Failed to send subscription activated email:', emailErr)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        const { data: org } = await supabase
          .from('organizations')
          .select('id, stripe_subscription_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (org && subscription.status === 'active') {
          if (org.stripe_subscription_id === subscription.id) {
            console.log(`[webhook] subscription.updated already matches for org ${org.id}`)
            break
          }
          await supabase
            .from('organizations')
            .update({ stripe_subscription_id: subscription.id })
            .eq('id', org.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        const { data: org } = await supabase
          .from('organizations')
          .select('id, plan_tier')
          .eq('stripe_customer_id', customerId)
          .single()

        if (org) {
          if (org.plan_tier === 'solo') {
            console.log(`[webhook] subscription.deleted already processed for org ${org.id}`)
            break
          }

          const config = await getPlanConfig()
          const soloConfig = config.solo
          await supabase
            .from('organizations')
            .update({
              plan_tier: 'solo',
              stripe_subscription_id: null,
              seat_limit: soloConfig.seats,
              app_limit: soloConfig.apps,
              keyword_limit: soloConfig.keywords,
            })
            .eq('id', org.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer as string

        const { data: org } = await supabase
          .from('organizations')
          .select('id, name, plan_tier')
          .eq('stripe_customer_id', customerId)
          .single()

        console.error(
          `[webhook] invoice.payment_failed for org ${org?.id ?? 'unknown'} (${org?.name ?? ''}), ` +
          `customer ${customerId}, invoice ${invoice.id}`
        )

        // Send payment failed email to org owner
        if (org) {
          try {
            const { data: owner } = await supabase
              .from('organization_members')
              .select('user_id')
              .eq('organization_id', org.id)
              .eq('role', 'owner')
              .limit(1)
              .single()

            if (owner) {
              const { data: ownerAuth } = await supabase.auth.admin.getUserById(owner.user_id)
              const ownerEmail = ownerAuth?.user?.email
              if (ownerEmail) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
                const config = await getPlanConfig()
                const planName = config[org.plan_tier as keyof typeof config]?.name ?? org.plan_tier
                const html = paymentFailedTemplate.render({
                  userName: ownerAuth?.user?.user_metadata?.full_name ?? ownerEmail.split('@')[0],
                  planName,
                  settingsUrl: `${appUrl}/settings`,
                })
                await sendEmail(ownerEmail, paymentFailedTemplate.subject, html, {
                  emailType: 'payment-failed',
                  userId: owner.user_id,
                })
              }
            }
          } catch (emailErr) {
            console.error('[webhook] Failed to send payment failed email:', emailErr)
          }
        }
        break
      }
    }
  } catch (err) {
    // Log but return 200 to prevent Stripe from retrying endlessly
    console.error(`[webhook] Error processing ${event.type}:`, err)
  }

  return NextResponse.json({ received: true })
}
