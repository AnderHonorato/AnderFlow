'use client'

import { useEffect } from 'react'

/**
 * Suprime erros de fetch causados por extensões de navegador
 * que interceptam window.fetch (ex: adjustGuard, yt-ext, etc.).
 * Atua tanto em unhandledrejection quanto em console.error.
 */
export function FetchErrorSuppressor({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const originalConsoleError = console.error.bind(console)

    const isExpectedError = (args: any[]): boolean => {
      const msg = args[0]
      if (typeof msg === 'string') {
        if (msg.includes('Failed to fetch')) return true
        if (msg.includes('AbortError')) return true
        return false
      }
      if (msg && typeof msg === 'object') {
        if ((msg as any).name === 'AbortError') return true
        if (msg instanceof Error) {
          if (msg.message === 'Failed to fetch') {
            const stack = msg.stack || ''
            if (stack.includes('chrome-extension://') || stack.includes('moz-extension://')) {
              return true
            }
          }
        }
      }
      return false
    }

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (reason && typeof reason === 'object') {
        if ((reason as any).name === 'AbortError') {
          event.preventDefault()
          return
        }
      }
      if (reason instanceof Error) {
        if (reason.message === 'Failed to fetch') {
          const stack = reason.stack || ''
          if (stack.includes('chrome-extension://') || stack.includes('moz-extension://')) {
            event.preventDefault()
            return
          }
        }
      }
      if (reason instanceof TypeError && reason.message === 'Failed to fetch') {
        const stack = reason.stack || ''
        if (stack.includes('chrome-extension://') || stack.includes('moz-extension://')) {
          event.preventDefault()
          return
        }
      }
    }

    console.error = (...args: any[]) => {
      if (!isExpectedError(args)) {
        originalConsoleError(...args)
      }
    }

    window.addEventListener('unhandledrejection', rejectionHandler)
    return () => {
      window.removeEventListener('unhandledrejection', rejectionHandler)
      console.error = originalConsoleError
    }
  }, [])

  return <>{children}</>
}
