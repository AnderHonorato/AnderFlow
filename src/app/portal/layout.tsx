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
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-[240px] flex flex-col border-r border-border bg-sidebar">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
          <Link href="/portal" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">AF</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">ANDERFLOW</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 py-3">
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.name} href={item.href}
                  className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                  )}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-6 w-6"><AvatarFallback className="text-2xs">{initials}</AvatarFallback></Avatar>
            <span className="text-sm text-muted-foreground">{session?.user?.name || 'Cliente'}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" /><span>Sair</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 items-center border-b bg-background px-6">
          <h1 className="text-lg font-semibold">Portal do Cliente</h1>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PortalSidebarContent>{children}</PortalSidebarContent>
    </SessionProvider>
  )
}
