interface AdminCardProps {
  title?: React.ReactNode
  tag?: string
  actions?: React.ReactNode
  bodyClass?: 'tight' | 'chart'
  children: React.ReactNode
}

export function AdminCard({ title, tag, actions, bodyClass, children }: AdminCardProps) {
  return (
    <div className="admin-card">
      {(title || tag || actions) && (
        <div className="admin-card-head">
          {title && <h3>{title}</h3>}
          {tag && <span className="tag">{tag}</span>}
          {actions && <div className="admin-card-head-actions">{actions}</div>}
        </div>
      )}
      <div className={`admin-card-body${bodyClass ? ` ${bodyClass}` : ''}`}>
        {children}
      </div>
    </div>
  )
}
