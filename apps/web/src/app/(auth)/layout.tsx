import '../globals.css'
import '@/components/marketing/marketing.css'
import { ForceLightTheme } from '@/components/marketing/ForceLightTheme'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <ForceLightTheme />
      {/* Left panel — bold brand statement */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-[50%] flex-col justify-between p-12 xl:p-16"
        style={{ background: 'var(--color-ink)' }}
      >
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 800,
            height: 600,
            background: 'radial-gradient(ellipse, rgba(29,63,217,0.25) 0%, transparent 60%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-baseline gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Top Viso" width={24} height={24} style={{ flexShrink: 0 }} />
          <span
            className="text-[28px] text-white leading-none"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            Top Viso
          </span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h2
            className="mb-6"
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              fontSize: 'clamp(40px, 4vw, 64px)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              color: 'var(--color-paper)',
            }}
          >
            Get found on<br />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--color-accent)',
                letterSpacing: '-0.025em',
              }}
            >
              every surface.
            </span>
          </h2>
          <p
            className="max-w-[380px] text-[16px] leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            App Store. Play Store. ChatGPT. Claude. Gemini. Perplexity. Copilot — all tracked in one place.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex items-center gap-8">
          <div>
            <div
              className="text-[32px] leading-none"
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--color-paper)',
              }}
            >
              7
            </div>
            <div
              className="mt-1 text-[10px]"
              style={{
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.12em',
                color: 'var(--color-ink-4)',
              }}
            >
              SURFACES TRACKED
            </div>
          </div>
          <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.12)' }} />
          <div>
            <div
              className="text-[32px] leading-none"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: 'var(--color-accent)',
              }}
            >
              5
            </div>
            <div
              className="mt-1 text-[10px]"
              style={{
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.12em',
                color: 'var(--color-ink-4)',
              }}
            >
              LLM ENGINES
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className="flex flex-1 items-center justify-center px-8 py-16 lg:px-16"
        style={{ background: 'var(--color-paper)' }}
      >
        <div className="w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  )
}
