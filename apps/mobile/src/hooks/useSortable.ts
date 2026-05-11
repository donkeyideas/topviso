import { useState, useMemo } from 'react'

export type SortDirection = 'asc' | 'desc'
export type SortConfig = { key: string; direction: SortDirection } | null

export function useSortable<T extends Record<string, unknown>>(data: T[], defaultSort?: SortConfig) {
  const [sort, setSort] = useState<SortConfig>(defaultSort ?? null)

  const toggle = (key: string) => {
    setSort(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'desc') return { key, direction: 'asc' }
        return null // third tap clears sort
      }
      return { key, direction: 'desc' }
    })
  }

  const sorted = useMemo(() => {
    if (!sort) return data
    const { key, direction } = sort
    return [...data].sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      const an = Number(av)
      const bn = Number(bv)
      // numeric comparison if both are numbers
      if (!isNaN(an) && !isNaN(bn) && av !== '' && bv !== '') {
        return direction === 'asc' ? an - bn : bn - an
      }
      // string comparison
      const as = String(av ?? '')
      const bs = String(bv ?? '')
      return direction === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
    })
  }, [data, sort])

  return { sorted, sort, toggle }
}
