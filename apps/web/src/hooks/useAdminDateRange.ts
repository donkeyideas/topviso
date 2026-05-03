'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

type Range = '7D' | '30D' | '90D' | 'QTD' | 'YTD'

function getDateRange(range: Range): { from: Date; to: Date } {
  const to = new Date()
  const from = new Date()

  switch (range) {
    case '7D':
      from.setDate(from.getDate() - 7)
      break
    case '30D':
      from.setDate(from.getDate() - 30)
      break
    case '90D':
      from.setDate(from.getDate() - 90)
      break
    case 'QTD': {
      const quarter = Math.floor(from.getMonth() / 3)
      from.setMonth(quarter * 3, 1)
      from.setHours(0, 0, 0, 0)
      break
    }
    case 'YTD':
      from.setMonth(0, 1)
      from.setHours(0, 0, 0, 0)
      break
  }

  return { from, to }
}

export function useAdminDateRange() {
  const searchParams = useSearchParams()
  const rangeParam = (searchParams.get('range') ?? '7D') as Range

  return useMemo(() => {
    const { from, to } = getDateRange(rangeParam)
    return {
      range: rangeParam,
      from,
      to,
      fromISO: from.toISOString(),
      toISO: to.toISOString(),
    }
  }, [rangeParam])
}
