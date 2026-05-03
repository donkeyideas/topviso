'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      router.push(redirect)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Brand — mobile only */}
      <div className="mb-10 flex items-baseline gap-3 lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Top Viso" width={24} height={24} style={{ flexShrink: 0 }} />
        <span
          className="text-[28px] leading-none"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
          Top Viso
        </span>
      </div>

      {/* Heading */}
      <h1
        className="mb-3"
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 800,
          fontSize: '48px',
          letterSpacing: '-0.04em',
          lineHeight: 0.95,
          color: 'var(--color-ink)',
        }}
      >
        Welcome<br />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--color-accent)',
            letterSpacing: '-0.025em',
          }}
        >
          back.
        </span>
      </h1>
      <p className="mb-10 text-[16px]" style={{ color: 'var(--color-ink-3)' }}>
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-semibold"
          style={{ color: 'var(--color-accent)' }}
        >
          Start free trial →
        </Link>
      </p>

      {/* Error */}
      {error && (
        <div
          className="mb-6 rounded-lg px-4 py-3 text-[14px] font-medium"
          style={{
            background: 'var(--color-warn-wash)',
            color: 'var(--color-warn)',
            border: '1px solid var(--color-warn)',
          }}
        >
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label
            className="mb-2 block text-[11px] font-bold uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.14em',
              color: 'var(--color-ink-3)',
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg px-5 py-4 text-[16px] outline-none transition-colors"
            style={{
              border: '2px solid var(--color-line)',
              background: 'white',
              fontFamily: 'var(--font-sans)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-line)')}
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label
            className="mb-2 block text-[11px] font-bold uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.14em',
              color: 'var(--color-ink-3)',
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg px-5 py-4 text-[16px] outline-none transition-colors"
            style={{
              border: '2px solid var(--color-line)',
              background: 'white',
              fontFamily: 'var(--font-sans)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-line)')}
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-accent btn-lg mt-2 w-full justify-center rounded-lg"
          style={{
            padding: '18px 28px',
            fontSize: '16px',
            fontWeight: 700,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Signing in...' : 'Sign in →'}
        </button>
      </form>
    </div>
  )
}
