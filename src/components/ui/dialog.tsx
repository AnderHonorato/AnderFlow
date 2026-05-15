'use client'

import { useEffect, useRef } from 'react'

interface DialogProps {
  open: boolean
  onClose?: () => void
  onOpenChange?: (v: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onClose, onOpenChange, children }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null)
  const close = () => { onClose?.(); onOpenChange?.(false) }

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }
  }, [open])

  if (!open) return null

  return (
    <div className={`dialog-overlay ${open ? 'open' : ''}`} onClick={close}>
      <div className="dialog-content animate-fade-in" ref={ref} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-3">{children}</div>
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[15px] font-medium text-[var(--text)]">{children}</h2>
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 mt-5">{children}</div>
}
