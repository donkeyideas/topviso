'use client'

import { useEffect, useState, useCallback } from 'react'
import type { AppProfile } from '@/lib/website-profile'

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
  target_keywords?: string[]
  website_url?: string | null
  app_profile?: AppProfile | null
  profile_status?: 'none' | 'pending' | 'ready' | 'failed'
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
