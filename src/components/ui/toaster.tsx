'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  const { theme } = useTheme()
  return (
    <Sonner
      theme={theme === 'dark' ? 'dark' : 'light'}
      position="top-right"
      duration={3000}
      toastOptions={{
        style: {
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          borderRadius: '8px',
          fontSize: '13px',
        },
      }}
    />
  )
}
