'use client'

import { useEffect, useState, useCallback } from 'react'

export function useAnalysis<T>(appId: string | null, analysisType: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!appId) { setLoading(false); return }

    try {
      const res = await fetch(`/api/analysis?appId=${encodeURIComponent(appId)}&type=${encodeURIComponent(analysisType)}`, { cache: 'no-store' })
      if (!res.ok) {
        console.error(`[useAnalysis] HTTP ${res.status} fetching ${analysisType}`)
        setData(null)
        setLoading(false)
        return
      }
      const json = await res.json()
      setData((json.data ?? null) as T | null)
    } catch (err) {
      console.error(`[useAnalysis] Error fetching ${analysisType}:`, err)
      setData(null)
    }
    setLoading(false)
  }, [appId, analysisType])

  // Clear stale data and refetch when appId changes
  useEffect(() => {
    setData(null)
    setLoading(true)
    refetch()
  }, [refetch])

  return { data, loading, setData, refetch }
}
