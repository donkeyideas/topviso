'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { GenerateModal } from '@/components/dashboard/GenerateModal'

type Phase = 'idle' | 'generating' | 'done' | 'error'

interface GenerateState {
  phase: Phase
  action: string
  error: string | null
}

interface GenerateContextValue {
  startGeneration: (action: string) => void
  endGeneration: (error?: string | null) => void
}

const GenerateContext = createContext<GenerateContextValue>({
  startGeneration: () => {},
  endGeneration: () => {},
})

export function GenerateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GenerateState>({ phase: 'idle', action: '', error: null })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startGeneration = useCallback((action: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setState({ phase: 'generating', action, error: null })
  }, [])

  const endGeneration = useCallback((error?: string | null) => {
    if (error) {
      setState((prev) => ({ ...prev, phase: 'error', error }))
    } else {
      setState((prev) => ({ ...prev, phase: 'done' }))
      timerRef.current = setTimeout(() => {
        setState({ phase: 'idle', action: '', error: null })
      }, 1200)
    }
  }, [])

  const handleClose = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setState({ phase: 'idle', action: '', error: null })
  }, [])

  return (
    <GenerateContext.Provider value={{ startGeneration, endGeneration }}>
      {children}
      <GenerateModal
        phase={state.phase}
        action={state.action}
        error={state.error}
        onClose={handleClose}
      />
    </GenerateContext.Provider>
  )
}

export function useGenerateContext() {
  return useContext(GenerateContext)
}
