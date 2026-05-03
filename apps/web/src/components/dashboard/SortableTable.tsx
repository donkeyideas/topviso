'use client'

import { useState, useMemo, type ReactNode } from 'react'

type SortDirection = 'asc' | 'desc' | null

interface Column<T> {
  key: string
  label: string
  className?: string
  accessor: (item: T) => string | number | boolean | null | undefined
  render: (item: T) => ReactNode
}

interface SortableTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: (item: T) => string
  rowStyle?: (item: T) => React.CSSProperties | undefined
}

export function SortableTable<T>({ data, columns, rowKey, rowStyle }: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)

  const toggle = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return }
    if (sortDir === 'asc') { setSortDir('desc'); return }
    setSortKey(null); setSortDir(null)
  }

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data
    const col = columns.find(c => c.key === sortKey)
    if (!col) return data
    const dir = sortDir === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      const av = col.accessor(a)
      const bv = col.accessor(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      if (typeof av === 'boolean' && typeof bv === 'boolean') return (Number(av) - Number(bv)) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [data, sortKey, sortDir, columns])

  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map(col => {
            const isActive = sortKey === col.key
            return (
              <th
                key={col.key}
                className={`sortable${isActive ? ' sorted' : ''}${col.className ? ` ${col.className}` : ''}`}
                onClick={() => toggle(col.key)}
              >
                {col.label}
                <span className="sort-icon">
                  {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                </span>
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.map(item => (
          <tr key={rowKey(item)} style={rowStyle?.(item)}>
            {columns.map(col => (
              <td key={col.key} className={col.className}>
                {col.render(item)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
