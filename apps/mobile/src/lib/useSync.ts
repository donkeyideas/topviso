import { useState, useCallback, useEffect, useRef } from 'react'
import { DeviceEventEmitter } from 'react-native'

const SYNC_EVENT = 'topviso:sync'

export type SyncPhase = 'idle' | 'syncing' | 'done' | 'error'

const SYNC_STEPS = [
  'Refreshing store data',
  'Loading keyword rankings',
  'Fetching competitor analysis',
  'Updating visibility scores',
  'Syncing LLM discovery',
  'Loading review insights',
  'Refreshing optimizer data',
  'Complete',
]

export function useSync(appId: string | null | undefined) {
  const [syncing, setSyncing] = useState(false)
  const [phase, setPhase] = useState<SyncPhase>('idle')
  const [currentStep, setCurrentStep] = useState(0)

  const sync = useCallback(async () => {
    if (!appId) return
    setSyncing(true)
    setPhase('syncing')
    setCurrentStep(0)

    // Emit event so all useAnalysis hooks refetch from Supabase
    DeviceEventEmitter.emit(SYNC_EVENT)

    // Animate through steps
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < SYNC_STEPS.length - 1) {
        setCurrentStep(step)
      } else {
        clearInterval(interval)
        setCurrentStep(SYNC_STEPS.length - 1)
        setPhase('done')
        setTimeout(() => {
          setPhase('idle')
          setSyncing(false)
        }, 1000)
      }
    }, 600)
  }, [appId])

  const dismiss = useCallback(() => {
    setPhase('idle')
    setSyncing(false)
  }, [])

  return { sync, syncing, phase, currentStep, steps: SYNC_STEPS, dismiss }
}

/** Hook into the global sync event */
export function useSyncListener(callback: () => void) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(SYNC_EVENT, () => {
      callbackRef.current()
    })
    return () => sub.remove()
  }, [])
}
