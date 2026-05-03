interface EmptyMetricProps {
  message?: string
  hint?: string
}

export function EmptyMetric({
  message = 'No data yet',
  hint,
}: EmptyMetricProps) {
  return (
    <div
      style={{
        padding: '32px 20px',
        textAlign: 'center',
        color: 'var(--color-ink-3)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        {message}
      </p>
      {hint && (
        <p
          style={{
            fontSize: 11,
            opacity: 0.6,
            marginTop: 8,
            margin: '8px 0 0',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}
