import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { useSyncListener } from './useSync'

export function useAnalysis<T = Record<string, unknown>>(
  appId: string | null | undefined,
  analysisType: string,
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!appId) { setData(null); setLoading(false); return }

    try {
      const { data: row, error } = await supabase
        .from('analysis_results')
        .select('result')
        .eq('app_id', appId)
        .eq('analysis_type', analysisType)
        .maybeSingle()

      if (error) {
        console.error(`[useAnalysis:${analysisType}]`, error.message)
        setData(null)
      } else {
        setData((row?.result as T) ?? null)
      }
    } catch (err) {
      console.error(`[useAnalysis:${analysisType}]`, err)
      setData(null)
    }
    setLoading(false)
  }, [appId, analysisType])

  useEffect(() => {
    setData(null)
    setLoading(true)
    refetch()
  }, [refetch])

  // Re-fetch when Sync button is pressed
  useSyncListener(refetch)

  return { data, loading, refetch }
}
