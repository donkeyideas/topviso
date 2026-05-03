import { useState, useCallback, useRef } from 'react'
import { supabase } from './supabase'

const WEB_APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? 'https://aso-one.vercel.app'

export function useSync(appId: string | null | undefined) {
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef(false)

  const sync = useCallback(async () => {
    if (!appId || inFlightRef.current) return
    inFlightRef.current = true
    setSyncing(true)
    setError(null)

    try {
      // Get the user's session token for auth
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')

      const res = await fetch(`${WEB_APP_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'sync', appId }),
      })

      if (!res.ok) {
        let msg = `Sync failed (${res.status})`
        try {
          const err = await res.json()
          msg = err.error || msg
        } catch {
          // non-JSON response
        }
        throw new Error(msg)
      }

      await res.json().catch(() => null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed'
      setError(msg)
      console.error('[useSync]', msg)
    } finally {
      setSyncing(false)
      inFlightRef.current = false
    }
  }, [appId])

  return { sync, syncing, error }
}
