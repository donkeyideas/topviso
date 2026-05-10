'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

/**
 * Fetches multiple analysis types in a single API call.
 * Returns a record keyed by analysis type.
 */
export function useMultiAnalysis<T extends Record<string, unknown>>(
  appId: string | null,
  types: string[],
) {
  const [data, setData] = useState<Partial<T>>({})
  const [loading, setLoading] = useState(true)
  const typesKey = types.join(',')
  // Keep a stable ref to avoid re-creating refetch on every render
  const typesRef = useRef(typesKey)
  typesRef.current = typesKey

  const refetch = useCallback(async () => {
    if (!appId || typesRef.current.length === 0) { setLoading(false); return }

    try {
      const res = await fetch(
        `/api/analysis?appId=${encodeURIComponent(appId)}&types=${encodeURIComponent(typesRef.current)}`,
      )
      if (!res.ok) {
        console.error(`[useMultiAnalysis] HTTP ${res.status}`)
        setData({})
        setLoading(false)
        return
      }
      const json = await res.json()
      const rows = (json.data ?? []) as Array<{ analysis_type: string; result: unknown }>
      const map: Record<string, unknown> = {}
      for (const r of rows) {
        map[r.analysis_type] = r.result
      }
      setData(map as Partial<T>)
    } catch (err) {
      console.error('[useMultiAnalysis] Error:', err)
      setData({})
    }
    setLoading(false)
  }, [appId])

  useEffect(() => {
    setData({})
    setLoading(true)
    refetch()
  }, [refetch])

  return { data, loading, refetch }
}
