import React, { createContext, useContext, useState, useCallback } from 'react'
import { useColorScheme } from 'react-native'

const lightColors = {
  paper: '#f4f1ea',
  paper2: '#ebe7dc',
  paper3: '#e0dbce',
  card: '#ffffff',
  card2: '#fafaf8',
  ink: '#0e0e0c',
  ink2: '#3a3a36',
  ink3: '#72716a',
  ink4: '#a8a69b',
  line: '#d8d3c4',
  lineSoft: '#e4e0d3',
  accent: '#1d3fd9',
  accent2: '#0a1f8a',
  accentWash: '#e8ecfa',
  warn: '#c43b1e',
  warnWash: '#f7e6df',
  ok: '#1f6a3a',
  okWash: '#e0efe3',
  gold: '#b58300',
}

const darkColors = {
  paper: '#141413',
  paper2: '#1c1c1a',
  paper3: '#252523',
  card: '#1c1c1a',
  card2: '#222220',
  ink: '#e8e6df',
  ink2: '#c5c3ba',
  ink3: '#8a8880',
  ink4: '#5a5850',
  line: '#2e2e2a',
  lineSoft: '#262624',
  accent: '#5b7aff',
  accent2: '#8ba2ff',
  accentWash: '#1a2040',
  warn: '#ef6b4a',
  warnWash: '#2e1a14',
  ok: '#3da35e',
  okWash: '#142a1c',
  gold: '#d4a020',
}

export type Colors = typeof lightColors

interface ThemeContextValue {
  colors: Colors
  isDark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [override, setOverride] = useState<'light' | 'dark' | null>(null)

  const isDark = override ? override === 'dark' : systemScheme === 'dark'
  const colors = isDark ? darkColors : lightColors

  const toggle = useCallback(() => {
    setOverride(prev => {
      if (prev === null) return isDark ? 'light' : 'dark'
      return prev === 'dark' ? 'light' : 'dark'
    })
  }, [isDark])

  return (
    <ThemeContext.Provider value={{ colors, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
