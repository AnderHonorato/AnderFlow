'use client'

import { useTheme } from '@/providers/theme-provider'
import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  const { theme } = useTheme()
  return (
    <Sonner
      theme={theme === 'dark' ? 'dark' : 'light'}
      position="top-right"
      duration={3500}
      gap={8}
      toastOptions={{
        style: {
          background: 'var(--surface)',
          border: '1px solid var(--border-2)',
          color: 'var(--text)',
          borderRadius: '12px',
          fontSize: '13px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        },
        classNames: {
          toast: 'animate-fade-up',
          title: 'font-[500]',
          description: 'text-[var(--text-3)]',
          success: '!border-[var(--success)]/20 !bg-[var(--success-subtle)]',
          error: '!border-[var(--destructive)]/20 !bg-[var(--destructive-subtle)]',
          warning: '!border-[var(--warning)]/20 !bg-[var(--warning-subtle)]',
          info: '!border-[var(--info)]/20 !bg-[var(--info-subtle)]',
        },
      }}
    />
  )
}
