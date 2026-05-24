'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { SessionProvider } from '@/providers/session-provider'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { IconCheck } from '@/components/icons'
import {
  LayoutDashboard, FolderKanban, MessageSquare,
  CreditCard, FileText, LogOut, Headphones, Sun, Moon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { WelcomeOverlay } from '@/components/ui/welcome-overlay'
import { PushPermission } from '@/components/ui/push-permission'
import { PwaInstallPrompt } from '@/components/ui/pwa-install-prompt'

const navItems = [
  { name: 'Início', href: '/portal', icon: LayoutDashboard },
  { name: 'Meus Projetos', href: '/portal/projects', icon: FolderKanban },
]

const navItemsSupport = [
  { name: 'Mensagens', href: '/portal/chat', icon: MessageSquare },
  { name: 'Financeiro', href: '/portal/financial', icon: CreditCard },
  { name: 'Contratos', href: '/portal/contracts', icon: FileText },
]

function PortalSidebarContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const initials = (session?.user?.name || 'CL').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [brandLogo, setBrandLogo] = useState<string | null>(null)

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
      <aside className="w-[220px] flex flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)]">
        <div className="flex h-12 items-center gap-2 border-b border-[var(--border)] px-3">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--primary)]">
              {brandLogo ? (
                <img src={brandLogo} alt="" className="h-5 w-5 object-contain" />
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
          <main className="flex-1">{children}</main>
        </div>
      <PushPermission />

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
    <SessionProvider>
      <PortalSidebarContent>{children}</PortalSidebarContent>
      <WelcomeOverlay />
      <PwaInstallPrompt />
    </SessionProvider>
  )
}
