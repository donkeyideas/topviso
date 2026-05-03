'use client'

import { createContext, useContext } from 'react'

interface AppContextValue {
  appId: string | null
  appName: string | null
  appIconUrl: string | null
}

const AppContext = createContext<AppContextValue>({ appId: null, appName: null, appIconUrl: null })

export function AppProvider({
  appId,
  appName,
  appIconUrl,
  children,
}: {
  appId: string | null
  appName: string | null
  appIconUrl?: string | null
  children: React.ReactNode
}) {
  return (
    <AppContext.Provider value={{ appId, appName, appIconUrl: appIconUrl ?? null }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  return useContext(AppContext)
}
