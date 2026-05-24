'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Bell, X } from 'lucide-react'
import { isFocusActive } from '@/components/ui/focus-mode'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    return registration
  } catch {
    return null
  }
}

async function subscribeUser(registration: ServiceWorkerRegistration) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) return null

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    })

    return subscription
  } catch {
    return null
  }
}

export function PushPermission() {
  const { data: session } = useSession()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    if (dismissed) return

    if (!('Notification' in window) || !('serviceWorker' in navigator)) return

    if (Notification.permission === 'granted') return
    if (Notification.permission === 'denied') return

    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [session?.user?.id, dismissed])

  const handleEnable = async () => {
    setLoading(true)
    const registration = await registerServiceWorker()
    if (registration) {
      await subscribeUser(registration)
    }
    setLoading(false)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[320px] animate-fade-up">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
            <Bell className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text)]">Ativar notificações?</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Receba alertas sobre projetos, mensagens e atualizações.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleEnable}
                disabled={loading}
              >
                {loading ? 'Ativando...' : 'Ativar'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => { setShow(false); setDismissed(true) }}
              >
                Agora não
              </Button>
            </div>
          </div>
          <button
            onClick={() => { setShow(false); setDismissed(true) }}
            className="shrink-0 text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
