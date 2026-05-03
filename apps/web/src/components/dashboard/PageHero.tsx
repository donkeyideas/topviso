interface PageHeroProps {
  title: React.ReactNode
  subtitle?: string
  meta?: React.ReactNode
}

export function PageHero({ title, subtitle, meta }: PageHeroProps) {
  return (
    <div className="page-hero">
      <div>
        <h1 className="display-title">{title}</h1>
        {subtitle && <p className="hero-sub">{subtitle}</p>}
      </div>
      {meta && <div className="hero-meta">{meta}</div>}
    </div>
  )
}
