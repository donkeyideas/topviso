interface SectionHeadProps {
  number?: string
  /** @deprecated Use `number` instead */
  index?: string
  title: React.ReactNode
  actions?: React.ReactNode
}

export function SectionHead({ number, index, title, actions }: SectionHeadProps) {
  const num = number ?? (index ? `§${index}` : undefined)
  return (
    <div className="sec-head">
      <div className="sec-head-l">
        {num && <span className="sec-num">{num}</span>}
        <h2>{title}</h2>
      </div>
      {actions}
    </div>
  )
}
