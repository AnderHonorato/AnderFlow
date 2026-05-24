'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Moon, BellOff } from 'lucide-react'

const FOCUS_KEY = 'anderflow_focus_until'

export function getFocusUntil(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const val = localStorage.getItem(FOCUS_KEY)
    if (!val) return null
    const ts = parseInt(val, 10)
    return Number.isNaN(ts) ? null : ts
  } catch { return null }
}

export function isFocusActive(): boolean {
  const until = getFocusUntil()
  if (!until) return false
  return until > Date.now()
}

export function FocusModeButton() {
  const [active, setActive] = useState(false)
  const [open, setOpen] = useState(false)
  const [remaining, setRemaining] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const update = () => {
    const focusActive = isFocusActive()
    setActive(focusActive)

    if (focusActive) {
      const until = getFocusUntil()!
      const diff = until - Date.now()
      if (diff <= 0) {
        endFocus()
        return
      }
      const hours = Math.floor(diff / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      setRemaining(hours > 0 ? `${hours}h ${mins}min` : `${mins}min`)
    }
  }

  useEffect(() => {
    update()
    const interval = setInterval(update, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  const startFocus = (minutes: number | 'tomorrow') => {
    let until: number
    if (minutes === 'tomorrow') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)
      until = tomorrow.getTime()
    } else {
      until = Date.now() + minutes * 60000
    }
    try { localStorage.setItem(FOCUS_KEY, String(until)) } catch {}
    setActive(true)
    setOpen(false)
    toast.success('Modo foco ativado', { description: 'Notificacoes silenciadas ate ' + new Date(until).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) })
  }

  const endFocus = () => {
    try { localStorage.removeItem(FOCUS_KEY) } catch {}
    setActive(false)
    setOpen(false)
    toast.info('Modo foco encerrado')
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[11px] gap-1.5"
        onClick={() => setOpen(!open)}
      >
        <Moon className={`h-3.5 w-3.5 ${active ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'}`} />
        {active && <BellOff className="h-3.5 w-3.5 text-[var(--text-3)]" />}
        {active && <span className="hidden md:inline">Foco {remaining}</span>}
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          {active ? (
            <div className="p-2 space-y-1">
              <div className="px-2 py-1">
                <p className="text-[11px] text-[var(--text-3)]">Modo foco ativo</p>
                <p className="text-[12px] font-[500] text-[var(--accent)]">{remaining} restante</p>
              </div>
              <button
                onClick={endFocus}
                className="w-full text-left px-2 py-1.5 rounded-md text-[12px] text-[var(--destructive)] hover:bg-[var(--destructive-subtle)] transition-colors"
              >
                Desativar modo foco
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <p className="text-[10px] text-[var(--text-3)] px-2 py-1 font-[500] uppercase tracking-wider">Silenciar notificacoes</p>
              <button onClick={() => startFocus(30)} className="w-full text-left px-2 py-1.5 rounded-md text-[12px] text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors">30 minutos</button>
              <button onClick={() => startFocus(60)} className="w-full text-left px-2 py-1.5 rounded-md text-[12px] text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors">1 hora</button>
              <button onClick={() => startFocus(120)} className="w-full text-left px-2 py-1.5 rounded-md text-[12px] text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors">2 horas</button>
              <button onClick={() => startFocus('tomorrow')} className="w-full text-left px-2 py-1.5 rounded-md text-[12px] text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors">Ate amanha (9h)</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
