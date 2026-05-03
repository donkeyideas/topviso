'use client'

import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripePromise } from '@/lib/stripe-client'
import type { StripeElementsOptions } from '@stripe/stripe-js'

interface PaymentModalProps {
  clientSecret: string
  planName: string
  price: number
  onSuccess: () => void
  onCancel: () => void
}

export function PaymentModal({ clientSecret, planName, price, onSuccess, onCancel }: PaymentModalProps) {
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
        '.Input': {
          border: '1px solid #d4d0cb',
          boxShadow: 'none',
          padding: '10px 12px',
        },
        '.Input:focus': {
          border: '1px solid #1d3fd9',
          boxShadow: 'none',
        },
        '.Tab': {
          border: '1px solid #d4d0cb',
          boxShadow: 'none',
        },
        '.Tab--selected': {
          border: '1px solid #1a1a1a',
          backgroundColor: '#1a1a1a',
          color: '#faf8f5',
        },
        '.Label': {
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#6b6b6b',
        },
      },
    },
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          margin: '0 16px',
          borderRadius: 12,
          border: '1px solid var(--color-line)',
          background: 'white',
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm
            planName={planName}
            price={price}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      </div>
    </div>
  )
}

interface PaymentFormProps {
  planName: string
  price: number
  onSuccess: () => void
  onCancel: () => void
}

function PaymentForm({ planName, price, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setErrorMsg(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/settings/billing?success=true`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMsg(error.message ?? 'Payment failed. Please try again.')
      setIsProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-line)',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
          }}
        >
          Complete Payment
        </h3>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: 'var(--color-ink-3)',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          &times;
        </button>
      </div>

      {/* Plan summary */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-line)',
          background: 'var(--color-bg, #faf8f5)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            color: 'var(--color-ink-3)',
            textTransform: 'uppercase',
          }}
        >
          Subscribe to
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{planName} Plan</span>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700 }}>${price}</span>
            <span style={{ fontSize: 13, color: 'var(--color-ink-3)', marginLeft: 4 }}>/ month</span>
          </div>
        </div>
      </div>

      {/* Payment Element */}
      <div style={{ padding: '20px 24px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            color: 'var(--color-ink-3)',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Payment method
        </div>
        <PaymentElement options={{ layout: 'tabs' }} />

        {errorMsg && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'var(--color-warn-wash)',
              color: 'var(--color-warn)',
              fontSize: 13,
            }}
          >
            {errorMsg}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderTop: '1px solid var(--color-line)',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--color-ink-3)',
          }}
        >
          Cancel
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 10, color: 'var(--color-ink-4)' }}>
            Powered by <strong>Stripe</strong>
          </span>
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="settings-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              opacity: isProcessing ? 0.7 : 1,
            }}
          >
            {isProcessing ? 'Processing...' : `Pay $${price}/mo`}
          </button>
        </div>
      </div>
    </form>
  )
}
