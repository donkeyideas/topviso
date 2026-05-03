interface TopStripProps {
  breadcrumbs: Array<{ label: string; isActive?: boolean }>
  children?: React.ReactNode
}

export function TopStrip({ breadcrumbs, children }: TopStripProps) {
  return (
    <div className="top-strip">
      <div className="crumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={crumb.isActive ? 'now' : ''}>{crumb.label}</span>
          </span>
        ))}
      </div>
      {children}
    </div>
  )
}
