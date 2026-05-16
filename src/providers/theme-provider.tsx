'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  resolvedTheme: 'dark',
})

export function useTheme() {
  return useContext(ThemeContext)
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children, defaultTheme = 'dark' }: { children: ReactNode; defaultTheme?: string; attribute?: string; enableSystem?: boolean; disableTransitionOnChange?: boolean }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    const initial = stored || (defaultTheme as Theme) || 'dark'
    setThemeState(initial)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const resolved = theme === 'system' ? getSystemTheme() : theme
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolved)
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? getSystemTheme() : (theme as 'light' | 'dark')

  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'dark', setTheme: () => {}, resolvedTheme: 'dark' }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
