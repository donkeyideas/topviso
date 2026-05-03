import Link from 'next/link'

interface EmptyStateProps {
  title: React.ReactNode
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            background: 'var(--color-accent)',
            color: 'white',
            transition: 'all 0.15s',
          }}
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          onClick={onAction}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            background: 'var(--color-accent)',
            color: 'white',
            transition: 'all 0.15s',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
