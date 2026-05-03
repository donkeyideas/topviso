'use client'

interface SortHeaderProps {
  label: string
  sortKey: string
  activeSortKey: string | null
  sortDir: 'asc' | 'desc' | null
  onSort: (key: string) => void
  className?: string
  style?: React.CSSProperties
}

export function SortHeader({ label, sortKey, activeSortKey, sortDir, onSort, className, style }: SortHeaderProps) {
  const isActive = activeSortKey === sortKey
  return (
    <th
      className={`sortable${isActive ? ' sorted' : ''}${className ? ` ${className}` : ''}`}
      onClick={() => onSort(sortKey)}
      style={style}
    >
      {label}
      <span className="sort-icon">
        {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </th>
  )
}
