import Link from 'next/link'

export default function VerifyPage() {
  return (
    <div className="text-center">
      {/* Brand */}
      <div className="mb-10 flex items-baseline justify-center gap-2.5">
        <div
          className="relative top-0.5 h-3 w-3 rounded-full"
          style={{ background: 'var(--color-ink)' }}
        >
          <div
            className="absolute left-[3px] top-[3px] h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--color-accent)' }}
          />
        </div>
        <span
          className="text-2xl leading-none"
          style={{
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
          }}
        >
          Top Viso
        </span>
      </div>

      <h1
        className="mb-4 text-3xl"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          letterSpacing: '-0.025em',
        }}
      >
        Check your email
      </h1>

      <p className="mb-6 text-sm" style={{ color: 'var(--color-ink-3)' }}>
        We sent you a verification link. Click the link in your email to activate your account.
      </p>

      <div
        className="mb-8 rounded-lg p-6"
        style={{
          background: 'var(--color-accent-wash)',
          border: '1px solid var(--color-accent)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--color-accent-2)' }}>
          Didn&apos;t receive the email? Check your spam folder or try signing up again.
        </p>
      </div>

      <Link
        href="/signin"
        className="text-sm font-semibold"
        style={{ color: 'var(--color-accent)' }}
      >
        Back to sign in
      </Link>
    </div>
  )
}
