import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'

export interface AppData {
  id: string
  name: string
  platform: string
  store_id: string
  icon_url: string | null
}

interface AppDataContextType {
  app: AppData | null
  apps: AppData[]
  loading: boolean
  refetch: () => Promise<void>
  switchApp: (appId: string) => void
}

const AppDataContext = createContext<AppDataContextType | null>(null)

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [app, setApp] = useState<AppData | null>(null)
  const [apps, setApps] = useState<AppData[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) { setLoading(false); return }

    try {
      // Get user's org
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.default_organization_id) { setLoading(false); return }

      // Get ALL apps in org
      const { data: orgApps } = await supabase
        .from('apps')
        .select('id, name, platform, store_id, icon_url')
        .eq('organization_id', profile.default_organization_id)
        .order('created_at', { ascending: true })

      const allApps = (orgApps ?? []) as AppData[]
      setApps(allApps)

      // Keep current app if still in list, otherwise pick first
      setApp(prev => {
        if (prev && allApps.some(a => a.id === prev.id)) return prev
        return allApps[0] ?? null
      })
    } catch (err) {
      console.error('[useAppData]', err)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { refetch() }, [refetch])

  const switchApp = useCallback((appId: string) => {
    const found = apps.find(a => a.id === appId)
    if (found) setApp(found)
  }, [apps])

  return (
    <AppDataContext.Provider value={{ app, apps, loading, refetch, switchApp }}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
