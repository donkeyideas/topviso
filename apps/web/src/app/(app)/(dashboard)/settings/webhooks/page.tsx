'use client'

export default function WebhooksSettingsPage() {
  return (
    <div className="max-w-lg">
      <h1
        className="mb-2 text-3xl"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
      >
        Webhooks
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
        Configure webhooks to receive real-time notifications when events occur.
      </p>

      <div
        className="rounded-lg p-8 text-center"
        style={{ border: '2px dashed var(--color-line)' }}
      >
        <div
          className="mb-2 text-xl"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}
        >
          Coming soon
        </div>
        <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
          Webhook endpoints for rank changes, review alerts, and scraper completions will be available in a future update.
        </p>
      </div>
    </div>
  )
}
