'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { PaymentModal } from '@/components/billing/PaymentModal'

const PLAN_INFO = {
  solo:       { name: 'Solo',       price: 0,   apps: 1,  keywords: 50,   seats: 1  },
  team:       { name: 'Team',       price: 49,  apps: 5,  keywords: 500,  seats: 5  },
  enterprise: { name: 'Enterprise', price: 199, apps: 50, keywords: 5000, seats: 25 },
} as const

type PlanTier = 'solo' | 'team' | 'enterprise'

interface OrgBilling {
  id: string
  plan_tier: PlanTier
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  seat_limit: number
  app_limit: number
}

interface Usage {
  apps: number
  keywords: number
  seats: number
}

export default function BillingSettingsPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse" style={{ height: 200, background: 'var(--color-line)', borderRadius: 8 }} />
    }>
      <BillingContent />
    </Suspense>
  )
}

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<OrgBilling | null>(null)
  const [usage, setUsage] = useState<Usage>({ apps: 0, keywords: 0, seats: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'downgrade' | 'cancel'; plan?: PlanTier } | null>(null)
  const [checkout, setCheckout] = useState<{
    clientSecret: string
    subscriptionId: string
    planName: string
    stickerCents: number
    firstChargeCents: number
    currency: string
    discountLabel: string | null
    appliedCode: string | null
    setupMode: boolean
    setupIntentId: string | null
  } | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState<{ code: string; description: string } | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoValidating, setPromoValidating] = useState(false)

  const showSuccess = searchParams.get('success') === 'true'
  const showCancelled = searchParams.get('cancelled') === 'true'

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/signin'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('default_organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.default_organization_id) { router.push('/onboarding'); return }

      const orgId = profile.default_organization_id

      const [orgRes, appsRes, keywordsRes, membersRes, invitationsRes] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, plan_tier, stripe_customer_id, stripe_subscription_id, trial_ends_at, seat_limit, app_limit')
          .eq('id', orgId)
          .single(),
        supabase
          .from('apps')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('is_active', true),
        supabase
          .from('keywords')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId),
        supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId),
        supabase
          .from('invitations')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .is('accepted_at', null),
      ])

      if (orgRes.data) setOrg(orgRes.data as unknown as OrgBilling)
      setUsage({
        apps: appsRes.count ?? 0,
        keywords: keywordsRes.count ?? 0,
        seats: (membersRes.count ?? 0) + (invitationsRes.count ?? 0),
      })
      setLoading(false)
    }
    load()
  }, [router])

  // ── Validate promo code (preview only — no charge) ──
  async function handleValidatePromo() {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setPromoValidating(true)
    setPromoError(null)
    try {
      const res = await fetch('/api/billing/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setPromoApplied(null)
        setPromoError(data.error ?? 'Invalid code')
        return
      }
      setPromoApplied({ code: data.code, description: data.description })
      setPromoInput(data.code)
    } catch {
      setPromoApplied(null)
      setPromoError('Could not validate code')
    } finally {
      setPromoValidating(false)
    }
  }

  function handleClearPromo() {
    setPromoApplied(null)
    setPromoError(null)
    setPromoInput('')
  }

  // ── Upgrade → open in-app payment modal ──
  async function handleUpgrade(plan: 'team' | 'enterprise') {
    setActionLoading(plan)
    setError(null)
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          ...(promoApplied ? { promoCode: promoApplied.code } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start checkout')

      setCheckout({
        clientSecret: data.clientSecret,
        subscriptionId: data.subscriptionId,
        planName: PLAN_INFO[plan].name,
        stickerCents: data.stickerCents ?? PLAN_INFO[plan].price * 100,
        firstChargeCents: data.firstChargeCents ?? PLAN_INFO[plan].price * 100,
        currency: data.currency ?? 'usd',
        discountLabel: data.discountLabel ?? null,
        appliedCode: data.appliedCode ?? null,
        setupMode: data.setupMode === true,
        setupIntentId: data.setupIntentId ?? null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setActionLoading(null)
  }

  // ── After in-modal payment succeeds ──
  async function handlePaymentSuccess(ctx?: { setupIntentId?: string | null }) {
    const subId = checkout?.subscriptionId
    const setupIntentId = ctx?.setupIntentId ?? checkout?.setupIntentId ?? null
    setCheckout(null)
    setError(null)

    if (subId) {
      try {
        const res = await fetch('/api/billing/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId: subId, setupIntentId }),
        })
        if (!res.ok) {
          const data = await res.json()
          console.warn('[billing] Activate failed, webhook will handle it:', data.error)
        }
      } catch {
        console.warn('[billing] Activate call failed, webhook will handle it')
      }
    }

    // Reload to show updated plan
    window.location.href = '/settings/billing?success=true'
  }

  // ── Manage billing portal ──
  async function handleManageBilling() {
    setActionLoading('portal')
    setError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Portal failed')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setActionLoading(null)
    }
  }

  // ── Cancel subscription ──
  async function handleCancel() {
    setActionLoading('cancel')
    setError(null)
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Cancel failed')
      window.location.href = '/settings/billing?success=true'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setActionLoading(null)
    }
    setConfirmAction(null)
  }

  function handleDowngrade(targetPlan: PlanTier) {
    if (targetPlan === 'solo') {
      setConfirmAction({ type: 'cancel' })
    } else {
      setConfirmAction({ type: 'downgrade', plan: targetPlan })
    }
  }

  function confirmDowngrade() {
    if (!confirmAction) return
    if (confirmAction.type === 'cancel') {
      handleCancel()
    } else if (confirmAction.plan) {
      setConfirmAction(null)
      handleUpgrade(confirmAction.plan as 'team' | 'enterprise')
    }
  }

  const tier = org?.plan_tier ?? 'solo'
  const planInfo = PLAN_INFO[tier]
  const trialDaysLeft = org?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null

  if (loading) {
    return (
      <div className="max-w-lg">
        <div className="animate-pulse" style={{ height: 32, width: 120, background: 'var(--color-line)', borderRadius: 8, marginBottom: 8 }} />
        <div className="animate-pulse" style={{ height: 16, width: 280, background: 'var(--color-line)', borderRadius: 6, marginBottom: 32 }} />
        <div className="animate-pulse" style={{ height: 280, background: 'var(--color-line)', borderRadius: 12 }} />
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <h1
        className="mb-2 text-3xl"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
      >
        Billing
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
        Manage your subscription, usage, and payment details.
      </p>

      {/* ── Success / Cancelled banners ── */}
      {showSuccess && (
        <div className="rounded-md p-3 text-xs mb-6" style={{ background: 'var(--color-ok-wash)', color: 'var(--color-ok)' }}>
          Plan updated successfully!
        </div>
      )}
      {showCancelled && (
        <div className="rounded-md p-3 text-xs mb-6" style={{ background: 'var(--color-warn-wash)', color: 'var(--color-warn)' }}>
          Checkout was cancelled.
        </div>
      )}
      {error && (
        <div className="rounded-md p-3 text-xs mb-6" style={{ background: 'var(--color-warn-wash)', color: 'var(--color-warn)' }}>
          {error}
        </div>
      )}

      {/* ── CURRENT PLAN CARD ── */}
      <div className="rounded-lg p-6 mb-6" style={{ border: '1px solid var(--color-line)', background: 'white' }}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div
              className="text-xs font-medium uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)' }}
            >
              Current plan
            </div>
            <div className="mt-1 text-2xl font-semibold">{planInfo.name}</div>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              background: tier === 'solo' ? 'var(--color-line)' : 'var(--color-ok-wash)',
              color: tier === 'solo' ? 'var(--color-ink-3)' : 'var(--color-ok)',
              letterSpacing: '0.06em',
            }}
          >
            {tier === 'solo' ? 'Free' : 'Active'}
          </span>
        </div>

        <div className="mb-4" style={{ fontSize: 14 }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>${planInfo.price}</span>
          <span style={{ color: 'var(--color-ink-3)' }}> / month</span>
        </div>

        {trialDaysLeft !== null && trialDaysLeft > 0 && (
          <div className="rounded-md p-3 text-xs mb-4" style={{ background: 'var(--color-ok-wash)', color: 'var(--color-ok)' }}>
            Trial: {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
          </div>
        )}

        {/* Usage bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Apps',     used: usage.apps,     limit: org?.app_limit ?? planInfo.apps },
            { label: 'Keywords', used: usage.keywords,  limit: planInfo.keywords },
            { label: 'Seats',    used: usage.seats,     limit: org?.seat_limit ?? planInfo.seats },
          ].map(row => {
            const pct = row.limit > 0 ? Math.min(100, Math.round((row.used / row.limit) * 100)) : 0
            const isNear = pct >= 80
            return (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-ink-3)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{row.used} / {row.limit}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--color-line)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 3,
                    background: isNear ? 'var(--color-warn)' : 'var(--color-ok)',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── PROMO CODE ── (only relevant when user can still upgrade) */}
      {tier !== 'enterprise' && (
        <div className="rounded-lg p-6 mb-6" style={{ border: '1px solid var(--color-line)', background: 'white' }}>
          <div
            className="text-xs font-medium uppercase tracking-widest mb-4"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)' }}
          >
            Promo code
          </div>

          {promoApplied ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 16px',
                background: 'var(--color-ok-soft, #ecfdf5)',
                border: '1px solid var(--color-ok, #10b981)',
                borderRadius: 8,
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>
                  {promoApplied.code}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-ink-3)', marginTop: 2 }}>
                  {promoApplied.description} — applied at checkout
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearPromo}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--color-ink-3)',
                  textDecoration: 'underline',
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value)
                    setPromoError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleValidatePromo()
                    }
                  }}
                  placeholder="PRODUCTHUNT"
                  disabled={promoValidating}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: `1px solid ${promoError ? 'var(--color-warn, #d97706)' : 'var(--color-line)'}`,
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    background: 'white',
                  }}
                />
                <button
                  type="button"
                  onClick={handleValidatePromo}
                  disabled={promoValidating || !promoInput.trim()}
                  className="settings-btn-primary"
                  style={{ minWidth: 100 }}
                >
                  {promoValidating ? 'Checking...' : 'Apply'}
                </button>
              </div>
              {promoError && (
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-warn, #d97706)' }}>
                  {promoError}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CHANGE PLAN ── */}
      <div className="rounded-lg p-6 mb-6" style={{ border: '1px solid var(--color-line)', background: 'white' }}>
        <div
          className="text-xs font-medium uppercase tracking-widest mb-4"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)' }}
        >
          Change plan
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tier === 'solo' && (
            <>
              <button
                className="settings-btn-primary"
                disabled={actionLoading !== null}
                onClick={() => handleUpgrade('team')}
              >
                {actionLoading === 'team' ? 'Starting...' : 'Upgrade to Team — $49/mo'}
              </button>
              <button
                className="settings-btn-primary"
                disabled={actionLoading !== null}
                onClick={() => handleUpgrade('enterprise')}
              >
                {actionLoading === 'enterprise' ? 'Starting...' : 'Upgrade to Enterprise — $199/mo'}
              </button>
            </>
          )}

          {tier === 'team' && (
            <>
              <button
                className="settings-btn-primary"
                disabled={actionLoading !== null}
                onClick={() => handleUpgrade('enterprise')}
              >
                {actionLoading === 'enterprise' ? 'Starting...' : 'Upgrade to Enterprise — $199/mo'}
              </button>
              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={() => handleDowngrade('solo')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: 'var(--color-ink-3)', textDecoration: 'underline',
                  padding: '8px 0',
                }}
              >
                Downgrade to Solo (free)
              </button>
            </>
          )}

          {tier === 'enterprise' && (
            <button
              type="button"
              disabled={actionLoading !== null}
              onClick={() => handleDowngrade('team')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--color-ink-3)', textDecoration: 'underline',
                padding: '8px 0',
              }}
            >
              Downgrade to Team — $49/mo
            </button>
          )}
        </div>
      </div>

      {/* ── MANAGE SUBSCRIPTION ── */}
      {org?.stripe_customer_id && (
        <div className="rounded-lg p-6 mb-6" style={{ border: '1px solid var(--color-line)', background: 'white' }}>
          <div
            className="text-xs font-medium uppercase tracking-widest mb-4"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)' }}
          >
            Manage subscription
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="settings-btn-primary"
              disabled={actionLoading !== null}
              onClick={handleManageBilling}
            >
              {actionLoading === 'portal' ? 'Redirecting...' : 'Manage payment method & invoices'}
            </button>

            {org.stripe_subscription_id && (
              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={() => setConfirmAction({ type: 'cancel' })}
                style={{
                  background: 'none', border: '1px solid var(--color-warn)',
                  borderRadius: 8, cursor: 'pointer',
                  fontSize: 13, color: 'var(--color-warn)',
                  padding: '10px 16px',
                }}
              >
                Cancel subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── CONFIRMATION DIALOG ── */}
      {confirmAction && (
        <div className="rounded-lg p-6" style={{ border: '2px solid var(--color-warn)', background: 'var(--color-warn-wash)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--color-warn)' }}>
            {confirmAction.type === 'cancel' ? 'Cancel subscription?' : 'Downgrade plan?'}
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-ink-3)', marginBottom: 16, lineHeight: 1.5 }}>
            {confirmAction.type === 'cancel'
              ? 'Your subscription will remain active until the end of the current billing period. After that, your plan will revert to Solo and limits will be reduced.'
              : `Downgrading will reduce your limits. If you currently exceed the ${confirmAction.plan} plan limits, some features may become restricted.`}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={confirmDowngrade}
              disabled={actionLoading !== null}
              style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: '1px solid var(--color-warn)', color: 'white',
                background: 'var(--color-warn)', cursor: 'pointer',
              }}
            >
              {actionLoading ? 'Processing...' : 'Yes, proceed'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: '1px solid var(--color-line)', color: 'var(--color-ink-3)',
                background: 'white', cursor: 'pointer',
              }}
            >
              Never mind
            </button>
          </div>
        </div>
      )}

      {/* ── PAYMENT MODAL ── */}
      {checkout && (
        <PaymentModal
          clientSecret={checkout.clientSecret}
          subscriptionId={checkout.subscriptionId}
          planName={checkout.planName}
          stickerCents={checkout.stickerCents}
          firstChargeCents={checkout.firstChargeCents}
          currency={checkout.currency}
          initialDiscountLabel={checkout.discountLabel}
          initialAppliedCode={checkout.appliedCode}
          setupMode={checkout.setupMode}
          setupIntentId={checkout.setupIntentId}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setCheckout(null)}
        />
      )}
    </div>
  )
}
