'use client'

import { useState, useMemo } from 'react'

type SortDirection = 'asc' | 'desc' | null

interface SortState<K extends string> {
  key: K | null
  direction: SortDirection
}

export function useTableSort<T, K extends string>(
  data: T[],
  accessors: Record<K, (item: T) => string | number | boolean | null | undefined>
) {
  const [sort, setSort] = useState<SortState<K>>({ key: null, direction: null })

  const toggle = (key: string) => {
    const k = key as K
    setSort(prev => {
      if (prev.key !== k) return { key: k, direction: 'asc' }
      if (prev.direction === 'asc') return { key: k, direction: 'desc' }
      return { key: null, direction: null }
    })
  }

  const sorted = useMemo(() => {
    if (!sort.key || !sort.direction) return data
    const accessor = accessors[sort.key]
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...data].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      if (typeof av === 'boolean' && typeof bv === 'boolean') return (Number(av) - Number(bv)) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [data, sort.key, sort.direction, accessors])

  return { sorted, sortKey: sort.key, sortDir: sort.direction, toggle }
}
