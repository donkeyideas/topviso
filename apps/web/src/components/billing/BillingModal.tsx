'use client'

import { useCallback, useEffect, useState } from 'react'
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

interface BillingModalProps {
  onClose: () => void
  onPlanChange?: (plan: PlanTier) => void
}

export function BillingModal({ onClose, onPlanChange }: BillingModalProps) {
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<OrgBilling | null>(null)
  const [usage, setUsage] = useState<Usage>({ apps: 0, keywords: 0, seats: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'downgrade' | 'cancel'; plan?: PlanTier } | null>(null)
  const [checkout, setCheckout] = useState<{ clientSecret: string; subscriptionId: string; planName: string; price: number } | null>(null)
  const [cancelInfo, setCancelInfo] = useState<{ cancelAtPeriodEnd: boolean; currentPeriodEnd: number | null }>({ cancelAtPeriodEnd: false, currentPeriodEnd: null })

  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('default_organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.default_organization_id) return

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

    // Fetch subscription cancellation status from Stripe
    if ((orgRes.data as { stripe_subscription_id?: string })?.stripe_subscription_id) {
      try {
        const statusRes = await fetch('/api/billing/status')
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setCancelInfo({
            cancelAtPeriodEnd: statusData.cancel_at_period_end ?? false,
            currentPeriodEnd: statusData.current_period_end ?? null,
          })
        }
      } catch {
        // ignore — non-critical
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !checkout && !confirmAction) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, checkout, confirmAction])

  // ── Upgrade → open in-app payment modal ──
  async function handleUpgrade(plan: 'team' | 'enterprise') {
    setActionLoading(plan)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start checkout')

      setCheckout({
        clientSecret: data.clientSecret,
        subscriptionId: data.subscriptionId,
        planName: PLAN_INFO[plan].name,
        price: PLAN_INFO[plan].price,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setActionLoading(null)
  }

  // ── After in-modal payment succeeds ──
  async function handlePaymentSuccess() {
    const subId = checkout?.subscriptionId
    const planName = checkout?.planName
    setCheckout(null)
    setError(null)

    if (subId) {
      try {
        const res = await fetch('/api/billing/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId: subId }),
        })
        if (!res.ok) {
          const data = await res.json()
          console.warn('[billing] Activate failed, webhook will handle it:', data.error)
        }
      } catch {
        console.warn('[billing] Activate call failed, webhook will handle it')
      }
    }

    setSuccessMsg(`Upgraded to ${planName ?? 'new plan'} successfully!`)
    // Re-fetch org data to reflect new plan
    await loadData()
    // Notify parent
    if (org?.plan_tier) onPlanChange?.(org.plan_tier)
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
      setCancelInfo({
        cancelAtPeriodEnd: true,
        currentPeriodEnd: data.current_period_end ?? null,
      })
      setSuccessMsg('Subscription cancelled. Access remains until the end of your billing period.')
      setConfirmAction(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setActionLoading(null)
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

  return (
    <>
      {/* ── MODAL OVERLAY ── */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={(e) => { if (e.target === e.currentTarget && !checkout) onClose() }}
      >
        <div
          style={{
            background: 'var(--color-cream, #faf8f5)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '32px 28px',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: 'var(--color-ink-3)', lineHeight: 1,
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6,
            }}
          >
            &times;
          </button>

          {/* Title */}
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 24,
            letterSpacing: '-0.025em',
            marginBottom: 4,
          }}>
            Billing
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-ink-3)', marginBottom: 24 }}>
            Manage your subscription, usage, and payment details.
          </p>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="animate-pulse" style={{ height: 32, width: 120, background: 'var(--color-line)', borderRadius: 8 }} />
              <div className="animate-pulse" style={{ height: 16, width: 280, background: 'var(--color-line)', borderRadius: 6 }} />
              <div className="animate-pulse" style={{ height: 200, background: 'var(--color-line)', borderRadius: 12 }} />
            </div>
          ) : (
            <>
              {/* ── Banners ── */}
              {successMsg && (
                <div className="rounded-md p-3 text-xs mb-4" style={{ background: 'var(--color-ok-wash)', color: 'var(--color-ok)' }}>
                  {successMsg}
                </div>
              )}
              {error && (
                <div className="rounded-md p-3 text-xs mb-4" style={{ background: 'var(--color-warn-wash)', color: 'var(--color-warn)' }}>
                  {error}
                </div>
              )}

              {/* ── CURRENT PLAN ── */}
              <div className="rounded-lg p-5 mb-4" style={{ border: '1px solid var(--color-line)', background: 'white' }}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div
                      className="text-xs font-medium uppercase tracking-widest"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)', fontSize: 10 }}
                    >
                      Current plan
                    </div>
                    <div className="mt-1 text-xl font-semibold">{planInfo.name}</div>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                      color: tier === 'solo' ? 'var(--color-ink-3)' : cancelInfo.cancelAtPeriodEnd ? 'var(--color-warn)' : 'var(--color-ok)',
                    }}
                  >
                    {tier === 'solo' ? 'Free' : cancelInfo.cancelAtPeriodEnd ? 'Cancelling' : 'Active'}
                  </span>
                </div>

                <div className="mb-3" style={{ fontSize: 13 }}>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>${planInfo.price}</span>
                  <span style={{ color: 'var(--color-ink-3)' }}> / month</span>
                </div>

                {cancelInfo.cancelAtPeriodEnd && cancelInfo.currentPeriodEnd && (
                  <div className="rounded-md p-3 text-xs mb-3" style={{ background: 'var(--color-warn-wash)', color: 'var(--color-warn)' }}>
                    Your plan cancels on {new Date(cancelInfo.currentPeriodEnd * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. After that, you&apos;ll be downgraded to Solo.
                  </div>
                )}

                {trialDaysLeft !== null && trialDaysLeft > 0 && (
                  <div className="rounded-md p-3 text-xs mb-3" style={{ background: 'var(--color-ok-wash)', color: 'var(--color-ok)' }}>
                    Trial: {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
                  </div>
                )}

                {/* Usage bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Apps',     used: usage.apps,     limit: org?.app_limit ?? planInfo.apps },
                    { label: 'Keywords', used: usage.keywords,  limit: planInfo.keywords },
                    { label: 'Seats',    used: usage.seats,     limit: org?.seat_limit ?? planInfo.seats },
                  ].map(row => {
                    const pct = row.limit > 0 ? Math.min(100, Math.round((row.used / row.limit) * 100)) : 0
                    const isNear = pct >= 80
                    return (
                      <div key={row.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                          <span style={{ color: 'var(--color-ink-3)' }}>{row.label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{row.used} / {row.limit}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: 'var(--color-line)', overflow: 'hidden' }}>
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

              {/* ── CHANGE PLAN ── */}
              <div className="rounded-lg p-5 mb-4" style={{ border: '1px solid var(--color-line)', background: 'white' }}>
                <div
                  className="text-xs font-medium uppercase tracking-widest mb-3"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)', fontSize: 10 }}
                >
                  Change plan
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tier === 'solo' && (
                    <>
                      <button
                        className="settings-btn-primary"
                        disabled={actionLoading !== null}
                        onClick={() => handleUpgrade('team')}
                      >
                        {actionLoading === 'team' ? 'Starting...' : 'Upgrade to Team \u2014 $49/mo'}
                      </button>
                      <button
                        className="settings-btn-primary"
                        disabled={actionLoading !== null}
                        onClick={() => handleUpgrade('enterprise')}
                      >
                        {actionLoading === 'enterprise' ? 'Starting...' : 'Upgrade to Enterprise \u2014 $199/mo'}
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
                        {actionLoading === 'enterprise' ? 'Starting...' : 'Upgrade to Enterprise \u2014 $199/mo'}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={() => handleDowngrade('solo')}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 12, color: 'var(--color-ink-3)', textDecoration: 'underline',
                          padding: '6px 0',
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
                        fontSize: 12, color: 'var(--color-ink-3)', textDecoration: 'underline',
                        padding: '6px 0',
                      }}
                    >
                      Downgrade to Team — $49/mo
                    </button>
                  )}
                </div>
              </div>

              {/* ── MANAGE SUBSCRIPTION ── */}
              {org?.stripe_customer_id && (
                <div className="rounded-lg p-5 mb-4" style={{ border: '1px solid var(--color-line)', background: 'white' }}>
                  <div
                    className="text-xs font-medium uppercase tracking-widest mb-3"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)', fontSize: 10 }}
                  >
                    Manage subscription
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      className="settings-btn-primary"
                      disabled={actionLoading !== null}
                      onClick={handleManageBilling}
                    >
                      {actionLoading === 'portal' ? 'Redirecting...' : 'Manage payment method & invoices'}
                    </button>

                    {org.stripe_subscription_id && !cancelInfo.cancelAtPeriodEnd && (
                      <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={() => setConfirmAction({ type: 'cancel' })}
                        style={{
                          background: 'none', border: '1px solid var(--color-warn)',
                          borderRadius: 8, cursor: 'pointer',
                          fontSize: 12, color: 'var(--color-warn)',
                          padding: '8px 14px',
                        }}
                      >
                        Cancel subscription
                      </button>
                    )}
                    {cancelInfo.cancelAtPeriodEnd && (
                      <div style={{ fontSize: 11, color: 'var(--color-ink-3)', padding: '6px 0', textAlign: 'center' }}>
                        Cancellation scheduled. Contact support to reactivate.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── CONFIRMATION DIALOG ── */}
              {confirmAction && (
                <div className="rounded-lg p-5" style={{ border: '2px solid var(--color-warn)', background: 'var(--color-warn-wash)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--color-warn)' }}>
                    {confirmAction.type === 'cancel' ? 'Cancel subscription?' : 'Downgrade plan?'}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginBottom: 14, lineHeight: 1.5 }}>
                    {confirmAction.type === 'cancel'
                      ? 'Your subscription will remain active until the end of the current billing period. After that, your plan will revert to Solo and limits will be reduced.'
                      : `Downgrading will reduce your limits. If you currently exceed the ${confirmAction.plan} plan limits, some features may become restricted.`}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={confirmDowngrade}
                      disabled={actionLoading !== null}
                      style={{
                        padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 500,
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
                        padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: '1px solid var(--color-line)', color: 'var(--color-ink-3)',
                        background: 'white', cursor: 'pointer',
                      }}
                    >
                      Never mind
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── PAYMENT MODAL (nested, above billing modal) ── */}
      {checkout && (
        <PaymentModal
          clientSecret={checkout.clientSecret}
          planName={checkout.planName}
          price={checkout.price}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setCheckout(null)}
        />
      )}
    </>
  )
}
