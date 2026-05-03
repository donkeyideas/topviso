'use client'

import { useState, useCallback, useRef } from 'react'
import { useGenerateContext } from '@/contexts/GenerateContext'

interface UseGenerateOptions {
  onSuccess?: () => void
}

export function useGenerate(
  appId: string | null,
  action: string,
  options?: UseGenerateOptions,
) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { startGeneration, endGeneration } = useGenerateContext()

  // Use ref for options to avoid unstable dependency in useCallback
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Guard against double-click
  const inFlightRef = useRef(false)

  const generate = useCallback(
    async (extraParams?: { locale?: string; prompt?: string; goal?: string }) => {
      if (!appId || inFlightRef.current) return
      inFlightRef.current = true
      setGenerating(true)
      setError(null)
      startGeneration(action)

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, appId, ...extraParams }),
        })

        if (!res.ok) {
          let msg = `Generation failed (${res.status})`
          try {
            const err = await res.json()
            msg = err.error || msg
          } catch {
            // non-JSON error response (e.g. 502 HTML page)
          }
          throw new Error(msg)
        }

        // Consume response body
        await res.json().catch(() => null)

        endGeneration()

        // Small delay to ensure DB write is readable before refetch
        await new Promise(r => setTimeout(r, 500))
        optionsRef.current?.onSuccess?.()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed'
        setError(msg)
        endGeneration(msg)
      } finally {
        setGenerating(false)
        inFlightRef.current = false
      }
    },
    [appId, action, startGeneration, endGeneration],
  )

  return { generate, generating, error }
}
