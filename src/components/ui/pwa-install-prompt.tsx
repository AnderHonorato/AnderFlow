'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('pwa_install_dismissed')
    if (stored) {
      setDismissed(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('pwa_install_dismissed', 'true')
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] md:left-auto md:right-4 md:w-[320px] bg-[var(--surface)] border border-[var(--accent)]/30 rounded-2xl shadow-2xl p-4 animate-card-pop">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
          <Download className="h-5 w-5 text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-[500] text-[var(--text)]">Instalar ANDERFLOW</p>
          <p className="text-[11px] text-[var(--text-3)] mt-0.5">
            Instale no celular para acesso rapido.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" onClick={handleInstall} className="text-[11px] h-7">
              Instalar
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-[11px] h-7">
              Depois
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="shrink-0 text-[var(--text-3)] hover:text-[var(--text)] mt-0.5">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
