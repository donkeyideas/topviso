'use client'

import { useCallback, useEffect, useState } from 'react'
import { CommandPalette } from './CommandPalette'
import { AdminTopBar } from './AdminTopBar'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setCmdOpen((prev) => !prev)
    }
    if (e.key === 'Escape') {
      setCmdOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      <AdminTopBar onSearchClick={() => setCmdOpen(true)} />
      {children}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  )
}
