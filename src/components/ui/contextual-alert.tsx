'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react'

interface Tip {
  type: 'info' | 'warning' | 'critical'
  message: string
  link?: string
}

const PAGE_MAP: Record<string, string> = {
  '/projects': 'projects',
  '/financial': 'financial',
  '/tickets': 'tickets',
  '/crm': 'crm',
  '/analytics': 'analytics',
  '/clients': 'clients',
}

const ICONS = { info: Info, warning: AlertTriangle, critical: AlertCircle }
const COLORS = { info: 'var(--info-subtle)', warning: 'var(--warning-subtle)', critical: 'var(--destructive-subtle)' }
const TEXT_COLORS = { info: 'var(--info)', warning: 'var(--warning)', critical: 'var(--destructive)' }

export function ContextualAlert() {
  const pathname = usePathname()
  const [tips, setTips] = useState<Tip[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const page = PAGE_MAP[pathname]
    if (!page) { setTips([]); return }

    const stored = JSON.parse(localStorage.getItem('dismissed-tips') || '[]')
    setDismissed(stored)

    fetch(`/api/contextual-tips?page=${page}`)
      .then(r => r.json())
      .then(json => setTips((json.tips || []).filter((t: Tip) => !stored.includes(t.message))))
      .catch(() => setTips([]))

    setVisible(true)
  }, [pathname])

  const dismiss = (tip: Tip) => {
    const updated = [...dismissed, tip.message]
    setDismissed(updated)
    localStorage.setItem('dismissed-tips', JSON.stringify(updated))
    setTips(prev => prev.filter(t => t.message !== tip.message))
  }

  if (tips.length === 0 || !visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="px-6 pt-3 space-y-1.5">
          {tips.map((tip, i) => {
            const IconComp = ICONS[tip.type]
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: COLORS[tip.type] }}
              >
                <IconComp className="h-3.5 w-3.5 shrink-0" style={{ color: TEXT_COLORS[tip.type] }} />
                <span className="flex-1" style={{ color: TEXT_COLORS[tip.type] }}>
                  {tip.message}
                  {tip.link && (
                    <a href={tip.link} className="ml-1 underline font-medium">Ver</a>
                  )}
                </span>
                <button onClick={() => dismiss(tip)} className="text-[var(--text-3)] hover:text-[var(--text)]" aria-label="Fechar alerta">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
