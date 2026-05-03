'use client'

import { useState, useRef, useEffect } from 'react'

interface ExportButtonProps {
  onExportCSV?: () => void
  onExportSVG?: () => void
}

export function ExportButton({ onExportCSV, onExportSVG }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn-ghost" onClick={() => setOpen(!open)}>
        EXPORT ↓
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 4,
            background: '#fff',
            border: '1px solid var(--color-line)',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            zIndex: 20,
            minWidth: 140,
          }}
        >
          {onExportCSV && (
            <button
              onClick={() => { onExportCSV(); setOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 14px',
                textAlign: 'left',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              Export CSV
            </button>
          )}
          {onExportSVG && (
            <button
              onClick={() => { onExportSVG(); setOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 14px',
                textAlign: 'left',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderTop: '1px solid var(--color-line)',
              }}
            >
              Export SVG
            </button>
          )}
        </div>
      )}
    </div>
  )
}
