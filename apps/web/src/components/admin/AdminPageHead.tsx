interface AdminPageHeadProps {
  category: string
  title: React.ReactNode
  subtitle?: string
  stamp?: React.ReactNode
}

export function AdminPageHead({ category, title, subtitle, stamp }: AdminPageHeadProps) {
  return (
    <div className="admin-page-head">
      <div className="ph-meta">
        {category} <span style={{ color: 'var(--color-ink-4)' }}>·</span>{' '}
        <span className="now">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>
      <div className="ph-row">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {stamp && <div className="ph-stamp">{stamp}</div>}
      </div>
    </div>
  )
}
