'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { SessionProvider } from '@/providers/session-provider'
import { FetchErrorSuppressor } from '@/providers/fetch-error-suppressor'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { PageTip } from '@/components/ui/page-tips'
import { ContextualAlert } from '@/components/ui/contextual-alert'
import { LimiteErro } from '@/components/ui/limite-erro'
import { usePerfilStore } from '@/stores/app-store'
import { useConsentimentoCookies } from '@/hooks/useConsentimentoCookies'
import { toast } from 'sonner'

const AIFab = dynamic(() => import('@/components/ui/ai-fab').then(m => ({ default: m.AIFab })), { ssr: false, loading: () => null })
const WelcomeOverlay = dynamic(() => import('@/components/ui/welcome-overlay').then(m => ({ default: m.WelcomeOverlay })), { ssr: false, loading: () => null })
const GuiaPrimeiroAcesso = dynamic(() => import('@/components/ui/guia-primeiro-acesso').then(m => ({ default: m.GuiaPrimeiroAcesso })), { ssr: false, loading: () => null })
const BotEngineInit = dynamic(() => import('@/components/bots/motor-inicializador').then(m => ({ default: m.BotEngineInit })), { ssr: false, loading: () => null })
const CommandPalette = dynamic(() => import('@/components/ui/command-palette').then(m => ({ default: m.CommandPalette })), { ssr: false, loading: () => null })


function BackgroundBlobs() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <div style={{position:'absolute',top:'8%',right:'-6%',width:'340px',height:'340px',borderRadius:'58% 42% 52% 48% / 52% 44% 56% 48%',background:'radial-gradient(ellipse,rgba(232,98,42,0.04) 0%,transparent 70%)',animation:'blobMorphA 12s ease-in-out infinite'}}/>
      <div style={{position:'absolute',bottom:'15%',left:'-4%',width:'260px',height:'260px',borderRadius:'44% 56% 58% 42% / 50% 58% 42% 50%',background:'radial-gradient(ellipse,rgba(58,122,196,0.03) 0%,transparent 65%)',animation:'blobMorphC 14s ease-in-out infinite'}}/>
      <div style={{position:'absolute',top:'45%',left:'25%',width:'180px',height:'180px',borderRadius:'48% 52% 64% 36% / 52% 44% 56% 48%',background:'radial-gradient(ellipse,rgba(139,92,246,0.025) 0%,transparent 70%)',animation:'blobMorphB 16s ease-in-out infinite'}}/>
    </div>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { fotoPerfil, setFotoPerfil } = usePerfilStore()
  const { analytics } = useConsentimentoCookies()

  useEffect(() => {
    if (session?.user?.image && session.user.image !== fotoPerfil) {
      setFotoPerfil(session.user.image)
    }
  }, [session?.user?.image, fotoPerfil, setFotoPerfil])

  useEffect(() => {
    if (!analytics) return
    if (!session?.user?.id) return
    if (localStorage.getItem('anderflow-notif-requested')) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'default') return

    const timer = setTimeout(() => {
      localStorage.setItem('anderflow-notif-requested', '1')
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          toast.success('Notificacoes ativadas!')
        }
      })
    }, 5000)

    return () => clearTimeout(timer)
  }, [analytics, session?.user?.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const enviarHeartbeat = useCallback(() => {
    const userId = (session?.user as any)?.id
    fetch('/api/users/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pathname }),
    }).catch(() => {})
    if (userId) {
      fetch('/api/analytics/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'heartbeat' }),
      }).catch(() => {})
    }
  }, [pathname, session?.user])

  useEffect(() => {
    enviarHeartbeat()
    const interval = setInterval(enviarHeartbeat, 60000)
    return () => clearInterval(interval)
  }, [enviarHeartbeat])

  return (
    <SessionProvider>
      <FetchErrorSuppressor>
      <BackgroundBlobs />
      <div className="flex h-screen overflow-hidden bg-[var(--bg)]" suppressHydrationWarning>
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-y-auto scroll-area">
          <Header />
          <ContextualAlert />
          <PageTip />
          <main className="flex-1">
            <LimiteErro>{children}</LimiteErro>
          </main>
        </div>
      </div>
      <AIFab />
      <GuiaPrimeiroAcesso />
      <WelcomeOverlay />
      <BotEngineInit />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </FetchErrorSuppressor>
    </SessionProvider>
  )
}
