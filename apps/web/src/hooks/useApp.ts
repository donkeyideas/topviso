'use client'

import { useEffect, useState, useCallback } from 'react'

interface AppData {
  id: string
  name: string
  platform: 'ios' | 'android'
  store_id: string
  category: string | null
  icon_url: string | null
  developer: string | null
  organization_id: string
  current_version: string | null
  is_active: boolean
  optimization_goal: string
}

export function useApp(appId: string | null) {
  const [app, setApp] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!appId) { setLoading(false); return }

    try {
      const res = await fetch(`/api/app-data?appId=${encodeURIComponent(appId)}`)
      if (!res.ok) {
        setApp(null)
        setLoading(false)
        return
      }
      const json = await res.json()
      setApp(json.app ?? null)
    } catch (err) {
      console.error('[useApp] Error fetching app:', err)
      setApp(null)
    }
    setLoading(false)
  }, [appId])

  useEffect(() => { refetch() }, [refetch])

  return { app, loading, refetch }
}
