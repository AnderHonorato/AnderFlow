'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { SessionProvider } from '@/providers/session-provider'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard, FolderKanban, MessageSquare,
  CreditCard, FileText, LogOut,
} from 'lucide-react'
import { WelcomeOverlay } from '@/components/ui/welcome-overlay'

const navItems = [
  { name: 'Início', href: '/portal', icon: LayoutDashboard },
  { name: 'Meus Projetos', href: '/portal/projects', icon: FolderKanban },
  { name: 'Mensagens', href: '/portal/chat', icon: MessageSquare },
  { name: 'Financeiro', href: '/portal/financial', icon: CreditCard },
  { name: 'Contratos', href: '/portal/contracts', icon: FileText },
]

function PortalSidebarContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const initials = (session?.user?.name || 'CL').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <aside className="w-[220px] flex flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)]">
        <div className="flex h-12 items-center gap-2 border-b border-[var(--border)] px-3">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--primary)]">
              <span className="text-2xs font-bold text-white">AF</span>
            </div>
            <span className="text-sm font-medium text-[var(--text)]">ANDERFLOW</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 py-2">
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
        </ScrollArea>
        <div className="border-t border-[var(--border)] p-2 space-y-1">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <Avatar className="h-5 w-5"><AvatarFallback className="text-2xs">{initials}</AvatarFallback></Avatar>
            <span className="text-xs text-[var(--text-muted)]">{session?.user?.name || 'Cliente'}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors">
            <LogOut className="h-3.5 w-3.5" /><span>Sair</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-12 items-center border-b border-[var(--border)] bg-[var(--header-bg)] px-4">
          <h1 className="text-[15px] font-medium text-[var(--text)]">Portal do Cliente</h1>
        </header>
        <main className="flex-1 overflow-y-auto scroll-area">{children}</main>
      </div>
    </div>
  )
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PortalSidebarContent>{children}</PortalSidebarContent>
      <WelcomeOverlay />
    </SessionProvider>
  )
}
