'use client'

import { useEffect } from 'react'

export function ForceLightTheme() {
  useEffect(() => {
    const html = document.documentElement
    const wasDark = html.getAttribute('data-theme') === 'dark'
    if (wasDark) {
      html.removeAttribute('data-theme')
    }
    return () => {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark') {
        html.setAttribute('data-theme', 'dark')
      }
    }
  }, [])
  return null
}
