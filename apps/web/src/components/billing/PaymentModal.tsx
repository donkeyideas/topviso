'use client'

import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripePromise } from '@/lib/stripe-client'
import type { StripeElementsOptions } from '@stripe/stripe-js'

interface PaymentModalProps {
  clientSecret: string
  subscriptionId: string
  planName: string
  /** Sticker price in cents (before any discount). */
  stickerCents: number
  /** Actual first-charge amount in cents (after any discount). */
  firstChargeCents: number
  currency: string
  initialDiscountLabel?: string | null
  initialAppliedCode?: string | null
  /** True when the clientSecret is a SetupIntent (no charge collected). */
  setupMode?: boolean
  /** SetupIntent id, required so onSuccess → activate can attach the PM. */
  setupIntentId?: string | null
  onSuccess: (ctx?: { setupIntentId?: string | null }) => void
  onCancel: () => void
}

export function PaymentModal({
  clientSecret,
  subscriptionId,
  planName,
  stickerCents,
  firstChargeCents,
  currency,
  initialDiscountLabel,
  initialAppliedCode,
  setupMode = false,
  setupIntentId = null,
  onSuccess,
  onCancel,
}: PaymentModalProps) {
  const stripePromise = getStripePromise()
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'flat',
      variables: {
        colorPrimary: '#1d3fd9',
        colorBackground: '#faf8f5',
        colorText: '#1a1a1a',
        colorDanger: '#c0392b',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSizeBase: '14px',
        spacingUnit: '4px',
        borderRadius: '8px',
        colorTextSecondary: '#6b6b6b',
        colorTextPlaceholder: '#999999',
      },
      rules: {
        '.Input': { border: '1px solid #d4d0cb', boxShadow: 'none', padding: '10px 12px' },
        '.Input:focus': { border: '1px solid #1d3fd9', boxShadow: 'none' },
        '.Tab': { border: '1px solid #d4d0cb', boxShadow: 'none' },
        '.Tab--selected': { border: '1px solid #1a1a1a', backgroundColor: '#1a1a1a', color: '#faf8f5' },
        '.Label': {
          fontSize: '11px', fontWeight: '600', textTransform: 'uppercase',
          letterSpacing: '0.08em', color: '#6b6b6b',
        },
      },
    },
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        style={{
          width: '100%', maxWidth: 440, margin: '0 16px',
          borderRadius: 12, border: '1px solid var(--color-line)',
          background: 'white', boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm
            subscriptionId={subscriptionId}
            planName={planName}
            stickerCents={stickerCents}
            initialFirstChargeCents={firstChargeCents}
            currency={currency}
            initialDiscountLabel={initialDiscountLabel ?? null}
            initialAppliedCode={initialAppliedCode ?? null}
            setupMode={setupMode}
            setupIntentId={setupIntentId}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      </div>
    </div>
  )
}

interface PaymentFormProps {
  subscriptionId: string
  planName: string
  stickerCents: number
  initialFirstChargeCents: number
  currency: string
  initialDiscountLabel: string | null
  initialAppliedCode: string | null
  setupMode: boolean
  setupIntentId: string | null
  onSuccess: (ctx?: { setupIntentId?: string | null }) => void
  onCancel: () => void
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

function PaymentForm({
  subscriptionId,
  planName,
  stickerCents,
  initialFirstChargeCents,
  currency,
  initialDiscountLabel,
  initialAppliedCode,
  setupMode,
  setupIntentId,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Promo state — can be applied or removed mid-flow without restarting checkout
  const [firstChargeCents, setFirstChargeCents] = useState(initialFirstChargeCents)
  const [discountLabel, setDiscountLabel] = useState<string | null>(initialDiscountLabel)
  const [appliedCode, setAppliedCode] = useState<string | null>(initialAppliedCode)
  const [promoInput, setPromoInput] = useState('')
  const [promoBusy, setPromoBusy] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  async function applyPromo(code: string) {
    const clean = code.trim().toUpperCase()
    if (!clean) return
    setPromoBusy(true)
    setPromoError(null)
    try {
      const res = await fetch('/api/billing/update-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, promoCode: clean }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPromoError(data.error ?? 'Invalid code')
        return
      }
      setFirstChargeCents(data.firstChargeCents)
      setDiscountLabel(data.discountLabel)
      setAppliedCode(data.appliedCode)
      setPromoInput('')
    } catch {
      setPromoError('Could not apply code')
    } finally {
      setPromoBusy(false)
    }
  }

  async function removePromo() {
    setPromoBusy(true)
    setPromoError(null)
    try {
      const res = await fetch('/api/billing/update-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, promoCode: '' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPromoError(data.error ?? 'Could not remove code')
        return
      }
      setFirstChargeCents(data.firstChargeCents)
      setDiscountLabel(null)
      setAppliedCode(null)
    } catch {
      setPromoError('Could not remove code')
    } finally {
      setPromoBusy(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsProcessing(true)
    setErrorMsg(null)

    // In setup mode the invoice was $0 (100%-off coupon). We collect a card
    // via SetupIntent so future renewals — when the discount ends — can
    // charge off-session.
    const { error } = setupMode
      ? await stripe.confirmSetup({
          elements,
          confirmParams: { return_url: `${window.location.origin}/settings/billing?success=true` },
          redirect: 'if_required',
        })
      : await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: `${window.location.origin}/settings/billing?success=true` },
          redirect: 'if_required',
        })

    if (error) {
      setErrorMsg(error.message ?? (setupMode ? 'Card setup failed. Please try again.' : 'Payment failed. Please try again.'))
      setIsProcessing(false)
    } else {
      onSuccess({ setupIntentId })
    }
  }

  const hasDiscount = appliedCode != null
  const stickerLabel = `${formatMoney(stickerCents, currency)} / month`
  const chargeLabel = formatMoney(firstChargeCents, currency)

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--color-line)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, margin: 0 }}>
          Complete Payment
        </h3>
        <button
          type="button" onClick={onCancel}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-ink-3)', padding: '4px', lineHeight: 1 }}
        >
          &times;
        </button>
      </div>

      {/* Plan summary */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-line)', background: 'var(--color-bg, #faf8f5)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--color-ink-3)', textTransform: 'uppercase' }}>
          Subscribe to
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{planName} Plan</span>
          <div style={{ textAlign: 'right' }}>
            {hasDiscount && (
              <div style={{ fontSize: 12, color: 'var(--color-ink-3)', textDecoration: 'line-through', lineHeight: 1.2 }}>
                {stickerLabel}
              </div>
            )}
            <div>
              <span style={{ fontSize: 24, fontWeight: 700 }}>{chargeLabel}</span>
              <span style={{ fontSize: 13, color: 'var(--color-ink-3)', marginLeft: 4 }}>
                {hasDiscount ? 'first payment' : '/ month'}
              </span>
            </div>
          </div>
        </div>
        {hasDiscount && discountLabel && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-ok, #10b981)', fontWeight: 500 }}>
            ✓ {appliedCode} — {discountLabel}
          </div>
        )}
        {setupMode && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-ink-3)', lineHeight: 1.4 }}>
            Card required to activate. You won&apos;t be charged for the first period — we&apos;ll only charge if the discount ends.
          </div>
        )}
      </div>

      {/* Promo code */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-line)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--color-ink-3)', textTransform: 'uppercase', marginBottom: 10 }}>
          Promo code
        </div>
        {hasDiscount ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13 }}>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{appliedCode}</strong>{' '}
              <span style={{ color: 'var(--color-ink-3)' }}>applied</span>
            </div>
            <button
              type="button" onClick={removePromo} disabled={promoBusy}
              style={{
                background: 'none', border: 'none', cursor: promoBusy ? 'wait' : 'pointer',
                fontSize: 12, color: 'var(--color-ink-3)', textDecoration: 'underline',
              }}
            >
              {promoBusy ? 'Removing…' : 'Remove'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={promoInput}
                onChange={(e) => { setPromoInput(e.target.value); setPromoError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(promoInput) } }}
                placeholder="PRODUCTHUNT"
                disabled={promoBusy}
                style={{
                  flex: 1, padding: '8px 12px',
                  border: `1px solid ${promoError ? '#d97706' : 'var(--color-line)'}`,
                  borderRadius: 8, fontSize: 13,
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                  background: 'white',
                }}
              />
              <button
                type="button"
                onClick={() => applyPromo(promoInput)}
                disabled={promoBusy || !promoInput.trim()}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  border: '1px solid var(--color-ink)',
                  background: 'var(--color-ink)', color: 'white',
                  cursor: (promoBusy || !promoInput.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (promoBusy || !promoInput.trim()) ? 0.5 : 1,
                }}
              >
                {promoBusy ? 'Checking…' : 'Apply'}
              </button>
            </div>
            {promoError && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#d97706' }}>{promoError}</div>
            )}
          </div>
        )}
      </div>

      {/* Payment Element */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--color-ink-3)', textTransform: 'uppercase', marginBottom: 16 }}>
          Payment method
        </div>
        <PaymentElement options={{ layout: 'tabs' }} />

        {errorMsg && (
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'var(--color-warn-wash)', color: 'var(--color-warn)', fontSize: 13 }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--color-line)' }}>
        <button
          type="button" onClick={onCancel}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-ink-3)' }}
        >
          Cancel
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 10, color: 'var(--color-ink-4)' }}>
            Powered by <strong>Stripe</strong>
          </span>
          <button
            type="submit"
            disabled={!stripe || isProcessing || promoBusy}
            className="settings-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: isProcessing ? 0.7 : 1 }}
          >
            {isProcessing
              ? 'Processing…'
              : setupMode
                ? 'Save card & activate'
                : `Pay ${chargeLabel}`}
          </button>
        </div>
      </div>
    </form>
  )
}
