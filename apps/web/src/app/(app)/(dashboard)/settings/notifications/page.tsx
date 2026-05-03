'use client'

export default function NotificationsSettingsPage() {
  return (
    <div className="max-w-lg">
      <h1
        className="mb-2 text-3xl"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
      >
        Notifications
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
        Choose what notifications you want to receive and how.
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
          Email and in-app notification preferences will be configurable here. Including alerts for rank drops, new reviews, and completed scans.
        </p>
      </div>
    </div>
  )
}
