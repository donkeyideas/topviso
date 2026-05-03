'use client'

export default function IntegrationsSettingsPage() {
  return (
    <div className="max-w-lg">
      <h1
        className="mb-2 text-3xl"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
      >
        Integrations
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
        Connect external services and AI providers.
      </p>

      {/* AI Provider */}
      <div
        className="mb-4 rounded-lg p-5"
        style={{ border: '1px solid var(--color-line)', background: 'white' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">DeepSeek (System Default)</div>
            <div className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
              Used for AI-powered recommendations, optimizer, and strategy features.
            </div>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-xs uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--color-ok-wash)',
              color: 'var(--color-ok)',
              letterSpacing: '0.06em',
            }}
          >
            Active
          </span>
        </div>
      </div>

      {/* Slack */}
      <div
        className="mb-4 rounded-lg p-5"
        style={{ border: '1px solid var(--color-line)', background: 'white' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Slack</div>
            <div className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
              Get notified about rank changes, new reviews, and scraper results.
            </div>
          </div>
          <button
            disabled
            className="rounded-md px-3 py-1 text-xs font-medium opacity-50 cursor-not-allowed"
            style={{ border: '1px solid var(--color-line)', color: 'var(--color-ink-3)' }}
          >
            Connect (soon)
          </button>
        </div>
      </div>

      {/* Custom AI Keys */}
      <div
        className="rounded-lg p-5"
        style={{ border: '1px solid var(--color-line)', background: 'white' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Custom AI Provider</div>
            <div className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
              Use your own OpenAI, Anthropic, or other AI API keys instead of DeepSeek.
            </div>
          </div>
          <button
            disabled
            className="rounded-md px-3 py-1 text-xs font-medium opacity-50 cursor-not-allowed"
            style={{ border: '1px solid var(--color-line)', color: 'var(--color-ink-3)' }}
          >
            Configure (soon)
          </button>
        </div>
      </div>
    </div>
  )
}
