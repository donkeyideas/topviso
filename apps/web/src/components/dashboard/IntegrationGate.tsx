'use client'

interface IntegrationGateProps {
  title: string
  description: string
  requiredIntegration: string
  providers: string[]
}

export function IntegrationGate({ title, description, requiredIntegration, providers }: IntegrationGateProps) {
  return (
    <div className="card" style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
      <div className="card-body" style={{ padding: '48px 32px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--color-accent-wash)', color: 'var(--color-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
        <p style={{ color: 'var(--color-ink-3)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {description}
        </p>

        <div style={{
          background: 'var(--color-bg-2)', borderRadius: 8, padding: '16px 20px',
          marginBottom: 24, textAlign: 'left',
        }}>
          <div className="label" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginBottom: 8, letterSpacing: 0.5 }}>
            REQUIRES
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
            {requiredIntegration}
          </div>
          <div className="label" style={{ fontSize: 11, color: 'var(--color-ink-3)', marginBottom: 8, letterSpacing: 0.5 }}>
            SUPPORTED PROVIDERS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {providers.map((p, i) => (
              <span key={i} className="pill" style={{ fontSize: 11 }}>{p}</span>
            ))}
          </div>
        </div>

        <p style={{ color: 'var(--color-ink-3)', fontSize: 12 }}>
          Coming soon — requires a third-party data provider.
        </p>
      </div>
    </div>
  )
}
