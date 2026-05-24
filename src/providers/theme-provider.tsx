'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'dark', setTheme: () => {}, resolvedTheme: 'dark' })

export function useTheme() { return useContext(ThemeContext) }

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children, defaultTheme = 'dark' }: { children: ReactNode; defaultTheme?: string; attribute?: string; enableSystem?: boolean; disableTransitionOnChange?: boolean }) {
  const { data: session } = useSession()
  const [theme, setThemeState] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    setThemeState(stored || (defaultTheme as Theme) || 'dark')
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const resolved = theme === 'system' ? getSystemTheme() : theme
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolved)
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted || !session?.user?.id) return
    fetch('/api/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme }) }).catch(() => {})
  }, [theme, mounted, session?.user?.id])

  useEffect(() => {
    if (!mounted) return
    const handler = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue && ['light', 'dark', 'system'].includes(e.newValue)) setThemeState(e.newValue as Theme)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [mounted])

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? getSystemTheme() : (theme as 'light' | 'dark')

  if (!mounted) {
    return <ThemeContext.Provider value={{ theme: 'dark', setTheme: () => {}, resolvedTheme: 'dark' }}>{children}</ThemeContext.Provider>
  }

  return <ThemeContext.Provider value={{ theme, setTheme: setThemeState, resolvedTheme }}>{children}</ThemeContext.Provider>
}
