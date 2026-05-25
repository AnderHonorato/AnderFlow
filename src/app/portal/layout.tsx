'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { SessionProvider } from '@/providers/session-provider'
import { I18nProvider } from '@/providers/i18n-provider'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import {
  LayoutDashboard, FolderKanban, MessageSquare,
  CreditCard, FileText, LogOut, Headphones, Sun, Moon,
  Home, Bell, Globe, Sparkles,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { WelcomeOverlay } from '@/components/ui/welcome-overlay'
import { PushPermission } from '@/components/ui/push-permission'
import { PwaInstallPrompt } from '@/components/ui/pwa-install-prompt'
import { BotChat } from '@/components/portal/bot-chat'
import { FaqWidget } from '@/components/portal/faq-widget'
import { useMediaQuery } from '@/hooks/use-media-query'

import { useI18n } from '@/providers/i18n-provider'

const navItems = [
  { name: 'Inicio', href: '/portal', icon: LayoutDashboard },
  { name: 'Meus Projetos', href: '/portal/projects', icon: FolderKanban },
  { name: 'Tickets', href: '/portal/tickets', icon: MessageSquare },
  { name: 'Novidades', href: '/portal/changelog', icon: Sparkles },
]

const navItemsSupport = [
  { name: 'Mensagens', href: '/portal/chat', icon: MessageSquare },
  { name: 'Financeiro', href: '/portal/financial', icon: CreditCard },
  { name: 'Contratos', href: '/portal/contracts', icon: FileText },
]

function PortalSidebarContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const initials = (session?.user?.name || 'CL').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [brandLogo, setBrandLogo] = useState<string | null>(null)
  const isMobile = useMediaQuery('(max-width: 767px)')

  const bottomNavItems = [
    { name: t('portal.welcome').split(' ')[0] || 'Home', href: '/portal', icon: Home },
    { name: 'Projetos', href: '/portal/projects', icon: FolderKanban },
    { name: 'Tickets', href: '/portal/tickets', icon: MessageSquare },
    { name: 'Notif.', href: '/notifications', icon: Bell },
  ]

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') {
      const user = session?.user as any
      if (!user?.isAccountActive) router.push('/login?error=account_inactive')
      if (user?.role !== 'CLIENT' && user?.role !== 'ADMIN') router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (!session?.user?.id) return
    const visited = localStorage.getItem('portal_visited')
    if (!visited) {
      setShowOnboarding(true)
    }

    fetch('/api/portal/branding')
      .then(r => r.json())
      .then(json => {
        const data = json.data
        if (data?.brandColor) {
          document.documentElement.style.setProperty('--accent', data.brandColor)
          document.documentElement.style.setProperty('--primary', data.brandColor)
        }
        if (data?.brandLogo) {
          setBrandLogo(data.brandLogo)
        }
      })
      .catch(() => {})
  }, [session?.user?.id])

  const dismissOnboarding = () => {
    localStorage.setItem('portal_visited', 'true')
    setShowOnboarding(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <aside className={cn('w-[220px] flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)]', isMobile ? 'hidden' : 'flex')}>
        <div className="flex h-12 items-center gap-2 border-b border-[var(--border)] px-3">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--primary)]">
              {brandLogo ? (
                <Image src={brandLogo} alt="" width={20} height={20} className="object-contain" />
              ) : (
                <span className="text-2xs font-bold text-white">AF</span>
              )}
            </div>
            <span className="text-sm font-medium text-[var(--text)]">ANDERFLOW</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 py-2">
          <div className="px-3 py-2 mb-1">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--accent-subtle)]">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="text-xs bg-[var(--accent-subtle)] text-[var(--accent)] font-[500]">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[12px] font-[500] text-[var(--text)] truncate">{session?.user?.name || 'Cliente'}</p>
                <Badge status="ACTIVE" className="text-2xs mt-0.5" />
              </div>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.name} href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-normal transition-colors border-l-[2px]',
                    isActive ? 'border-l-[var(--primary)] text-[var(--text)]' : 'border-l-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                  )}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
          <div className="px-3 py-2">
            <div className="border-t border-[var(--border)] my-1" />
          </div>
          <nav className="flex flex-col gap-0.5 px-2">
            {navItemsSupport.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.name} href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-normal transition-colors border-l-[2px]',
                    isActive ? 'border-l-[var(--primary)] text-[var(--text)]' : 'border-l-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                  )}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
        <div className="border-t border-[var(--border)] p-2 space-y-1">
          <div className="flex items-center justify-between px-3 py-1">
            <button
              onClick={() => setLanguage(language === 'pt-BR' ? 'en' : 'pt-BR')}
              className="flex items-center gap-2 text-[10px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
              title={language === 'pt-BR' ? 'Switch to English' : 'Mudar para Portugues'}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{language === 'pt-BR' ? '🇧🇷 PT' : '🇺🇸 EN'}</span>
            </button>
          </div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Alternar tema"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors">
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
          </button>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors">
            <LogOut className="h-3.5 w-3.5" /><span>Sair</span>
          </button>
          <Link href="/portal/chat"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-xs text-[var(--accent)] hover:bg-[var(--surface-hover)] transition-colors">
            <Headphones className="h-3.5 w-3.5" /><span>Suporte</span>
          </Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto scroll-area">
          <Header />
          <main className={cn('flex-1', isMobile && 'pb-16')}>{children}</main>
        </div>
      <PushPermission />

      {isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-[var(--surface)] border-t border-[var(--border)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] transition-colors',
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--text-3)] hover:text-[var(--text)]'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'text-[var(--accent)]')} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      )}

      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Bem-vindo ao seu portal ANDERFLOW!</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-[13px] text-[var(--text-2)]">
              Veja como funciona o fluxo de trabalho:
            </p>
            <div className="space-y-3">
              <div className="flex gap-2.5">
                <span className="text-[15px] shrink-0 text-[var(--accent)]">1</span>
                <div>
                  <p className="text-[13px] font-[500] text-[var(--text)]">Preencha o briefing completo</p>
                  <p className="text-[11px] text-[var(--text-3)] mt-0.5">Quanto mais detalhes voce fornecer, mais precisa sera nossa proposta.</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <span className="text-[15px] shrink-0 text-[var(--accent)]">2</span>
                <div>
                  <p className="text-[13px] font-[500] text-[var(--text)]">Acompanhe o progresso</p>
                  <p className="text-[11px] text-[var(--text-3)] mt-0.5">No fluxo do projeto voce ve cada etapa sendo concluida em tempo real.</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <span className="text-[15px] shrink-0 text-[var(--accent)]">3</span>
                <div>
                  <p className="text-[13px] font-[500] text-[var(--text)]">Responda as solicitacoes</p>
                  <p className="text-[11px] text-[var(--text-3)] mt-0.5">Quando o desenvolvedor pedir dados extras, responda rapido para nao atrasar.</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <span className="text-[15px] shrink-0 text-[var(--accent)]">4</span>
                <div>
                  <p className="text-[13px] font-[500] text-[var(--text)]">Finalizacao e entrega</p>
                  <p className="text-[11px] text-[var(--text-3)] mt-0.5">Acompanhe a entrega final, revise e aprove seu projeto.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={dismissOnboarding} className="w-full">Entendido!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SessionProvider>
        <PortalSidebarContent>{children}</PortalSidebarContent>
        <WelcomeOverlay />
        <PwaInstallPrompt />
        <BotChat />
        <FaqWidget />
      </SessionProvider>
    </I18nProvider>
  )
}
