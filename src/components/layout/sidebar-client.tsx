'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useUIStore, useOnlineStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import {
  IconDashboard, IconProject, IconClient, IconCRM, IconChat,
  IconFinancial, IconAnalytics, IconKnowledge, IconNotification,
  IconSettings, IconChevronLeft, IconChevronRight, IconMenu,
  IconLogout, IconProfile, IconTicket, IconFile,
  IconAutomation,
} from '@/components/icons'
import { Star, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

const adminNavSections = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: IconDashboard },
      { name: 'Projetos', href: '/projects', icon: IconProject },
      { name: 'Clientes', href: '/clients', icon: IconClient },
      { name: 'Inbox', href: '/inbox', icon: IconNotification },
      { name: 'Equipe', href: '/team', icon: IconCRM },
    ]
  },
  {
    label: 'Vendas',
    items: [
      { name: 'CRM', href: '/crm', icon: IconCRM },
      { name: 'Financeiro', href: '/financial', icon: IconFinancial },
      { name: 'Contratos', href: '/contracts', icon: IconFile },
    ]
  },
  {
    label: 'Analise',
    items: [
      { name: 'Analytics', href: '/analytics', icon: IconAnalytics },
      { name: 'Tickets', href: '/tickets', icon: IconTicket },
      { name: 'Conhecimento', href: '/knowledge', icon: IconKnowledge },
      { name: 'Feedbacks IA', href: '/feedbacks-ia', icon: IconNotification },
    ]
  },
]

const adminNavItems = adminNavSections.flatMap(s => s.items)

const clientNavItems = [
  { name: 'Inicio', href: '/dashboard', icon: IconDashboard },
  { name: 'Meus Projetos', href: '/projects', icon: IconProject },
  { name: 'Chat', href: '/clients', icon: IconChat },
  { name: 'Financeiro', href: '/financial', icon: IconFinancial },
]

const clientBottomNav = [
  { name: 'Notificacoes', href: '/notifications', icon: IconNotification },
  { name: 'Configuracoes', href: '/settings', icon: IconSettings },
]

const iconMap: Record<string, any> = {
  IconDashboard,
  IconProject,
  IconClient,
  IconCRM,
  IconChat,
  IconFinancial,
  IconAnalytics,
  IconKnowledge,
  IconNotification,
  IconTicket,
  IconFile,
  IconAutomation,
  IconSettings,
}

export function SidebarClient() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const { onlineNow, setStats } = useOnlineStore()
  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('anderflow-compact-mode')
      if (stored !== null) setCollapsed(stored === 'true')
    } catch { /* noop */ }
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('anderflow-compact-mode', String(collapsed))
  }, [collapsed, mounted])

  const [favorites, setFavorites] = useState<{ name: string; href: string; iconType: string }[]>([])
  const [recents, setRecents] = useState<string[]>([])

  useEffect(() => {
    try {
      const fav = localStorage.getItem('anderflow-favorites')
      if (fav) setFavorites(JSON.parse(fav))
      const rec = localStorage.getItem('anderflow-recents')
      if (rec) setRecents(JSON.parse(rec))
    } catch { /* noop */ }
  }, [])

  const isFav = (href: string) => favorites.some(f => f.href === href)

  const toggleFavorite = (item: { name: string; href: string; iconType: string }) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.href === item.href)
      const next = exists
        ? prev.filter(f => f.href !== item.href)
        : [item, ...prev].slice(0, 5)
      localStorage.setItem('anderflow-favorites', JSON.stringify(next))
      return next
    })
  }

  const [openTicketsCount, setOpenTicketsCount] = useState(0)
  const [chatUnread, setChatUnread] = useState(0)

  const role = (session?.user as any)?.role || 'USER'
  const roleLevel = (session?.user as any)?.roleLevel || 0
  const [hierarquiaVerificada, setHierarquiaVerificada] = useState(false)
  const [permissaoNivel, setPermissaoNivel] = useState(roleLevel)
  const [permissaoErro, setPermissaoErro] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    let cancelled = false

    fetch('/api/auth/permissao', { signal })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.autorizado) {
          setPermissaoNivel(data.nivel)
          setHierarquiaVerificada(true)
        } else {
          setPermissaoErro(true)
        }
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || cancelled) return
        setPermissaoErro(true)
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  const nivelEfetivo = hierarquiaVerificada ? permissaoNivel : roleLevel
  const isAdminOrAbove = nivelEfetivo >= 80
  const isModOrAbove = nivelEfetivo >= 60
  const isOwner = nivelEfetivo >= 100
  const topNav = isModOrAbove ? adminNavItems : clientNavItems

  useEffect(() => {
    if (!mounted || !pathname) return
    const allItems = [...topNav, ...bottomNav]
    const match = allItems.find(i => {
      if (i.href === '/dashboard') return pathname === '/dashboard'
      return pathname === i.href || pathname.startsWith(i.href + '/')
    })
    if (!match) return
    setRecents(prev => {
      const next = [match.href, ...prev.filter(u => u !== match.href)].slice(0, 10)
      localStorage.setItem('anderflow-recents', JSON.stringify(next))
      return next
    })
  }, [pathname, mounted])

  useEffect(() => {
    if (!isModOrAbove) return
    const fetchTickets = async () => {
      try {
        const [openRes, progRes] = await Promise.all([
          fetch('/api/tickets?status=OPEN&limit=1'),
          fetch('/api/tickets?status=IN_PROGRESS&limit=1'),
        ])
        const openData = await openRes.json()
        const progData = await progRes.json()
        setOpenTicketsCount((openData.pagination?.total || 0) + (progData.pagination?.total || 0))
      } catch { /* noop */ }
    }
    fetchTickets()
    const interval = setInterval(fetchTickets, 60000)
    return () => clearInterval(interval)
  }, [isModOrAbove])

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await fetch('/api/chat/unread-count')
        const data = await res.json()
        setChatUnread(data.count || 0)
      } catch { /* noop */ }
    }
    fetchChat()
    const interval = setInterval(fetchChat, 30000)
    return () => clearInterval(interval)
  }, [])

  const bottomNav = useMemo(() => {
    if (!isModOrAbove) return clientBottomNav
    return [
      ...(isOwner ? [{ name: 'Chaves API', href: '/settings/api-keys', icon: IconSettings }] : []),
      ...(isAdminOrAbove ? [{ name: 'Integracoes', href: '/settings/integrations', icon: IconAutomation }] : []),
      ...(isOwner ? [{ name: 'Usuarios', href: '/users', icon: IconClient }] : []),
      ...(isOwner ? [{ name: 'Founder', href: '/founder', icon: IconDashboard }] : []),
      { name: 'Notificações', href: '/notifications', icon: IconNotification },
      { name: 'Configurações', href: '/settings', icon: IconSettings },
    ]
  }, [isModOrAbove, isAdminOrAbove, isOwner])

  const initials = (session?.user?.name || 'AD')
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

  useEffect(() => {
    if (!isModOrAbove) return
    const fetchStats = () => fetch('/api/analytics/online').then(r => r.json()).then(setStats)
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [setStats, isModOrAbove])

  const [inboxUnread, setInboxUnread] = useState(0)
  const [notifUnread, setNotifUnread] = useState(0)
  useEffect(() => {
    if (!isModOrAbove) return
    const fetchInbox = () => fetch('/api/inbox?count=true').then(r => r.json()).then(j => setInboxUnread(j.totalUnread || 0))
    fetchInbox()
    const interval = setInterval(fetchInbox, 30000)
    return () => clearInterval(interval)
  }, [isModOrAbove])
  useEffect(() => {
    const fetchNotif = () => fetch('/api/notifications?unread=true').then(r => r.json()).then(j => setNotifUnread((j.data || []).length))
    fetchNotif()
    const interval = setInterval(fetchNotif, 30000)
    return () => clearInterval(interval)
  }, [])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const navItemClass = (active: boolean) =>
    cn(
      'flex items-center gap-2.5 h-[34px] px-3 rounded-lg text-[13px]',
      'transition-all duration-200 ease-emphasized',
      'relative select-none',
      collapsed && 'justify-center px-2',
      active
        ? 'glass text-[var(--text)] font-medium'
        : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
    )

  return (
    <>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <motion.aside
        animate={{ width: collapsed ? 60 : 220 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        className={cn(
        'fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col',
        'bg-[var(--bg-secondary)] border-r border-[var(--border)]',
        'transform transition-all transition-duration-[300ms] transition-timing-function-[cubic-bezier(0.2,0,0,1)]',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:flex',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )} suppressHydrationWarning>
        <div className={cn(
          'flex h-12 items-center border-b border-[var(--border)] px-3',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="shrink-0">
              <rect width="28" height="28" rx="6" fill="var(--accent)"/>
              <path d="M7 22l6-15h4l4 10h-4l-3-5-4 10H7z" fill="#fff" opacity="0.9"/>
              <path d="M13 19c2-2 3-3 5-3h3c-1 2-2 3-4 3h-4z" fill="#fff" opacity="0.5"/>
            </svg>
            {!collapsed && <span className="text-[14px] font-display font-semibold text-gradient tracking-tight">ANDERFLOW</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center h-5 w-5 rounded text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
          >
            {collapsed ? <IconChevronRight className="w-3 h-3" /> : <IconChevronLeft className="w-3 h-3" />}
          </button>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-[var(--text-3)]">
            <IconChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scroll-area">
          {favorites.length > 0 && (
            <div className="mb-1">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider">
                  Favoritos
                </div>
              )}
              {favorites.map(fav => {
                const FavIcon = iconMap[fav.iconType]
                if (!FavIcon) return null
                const active = isActive(fav.href)
                return (
                  <Link
                    key={fav.href}
                    href={fav.href}
                    onClick={() => setMobileMenuOpen(false)}
                    title={collapsed ? fav.name : undefined}
                    className={navItemClass(active)}
                  >
                    <FavIcon className="w-[16px] h-[16px] shrink-0" />
                    {!collapsed && <span className="truncate">{fav.name}</span>}
                  </Link>
                )
              })}
            </div>
          )}

          {recents.length > 0 && (
            <div className="mb-1">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider">
                  Recentes
                </div>
              )}
              {recents.slice(0, 3).map(url => {
                const item = topNav.find(i => i.href === url) || bottomNav.find(i => i.href === url)
                if (!item) return null
                const active = isActive(url)
                return (
                  <Link
                    key={url}
                    href={url}
                    onClick={() => setMobileMenuOpen(false)}
                    title={collapsed ? item.name : undefined}
                    className={navItemClass(active)}
                  >
                    <Clock className="w-[16px] h-[16px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                )
              })}
            </div>
          )}
          {isModOrAbove ? adminNavSections.map((section, si) => (
            <div key={si} className="mb-1">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider">
                  {section.label}
                </div>
              )}
              {section.items.map(item => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    title={collapsed ? item.name : undefined}
                    className={cn(navItemClass(active), 'group')}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r bg-[var(--accent)] animate-scale-in origin-center" style={{ height: '16px' }} />
                    )}
                    <item.icon className="w-[16px] h-[16px] shrink-0" />
                    {!collapsed && <span className="truncate flex-1 min-w-0">{item.name}</span>}
                    {!collapsed && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite({ name: item.name, href: item.href, iconType: item.icon.name }) }}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Star className={cn('w-3 h-3', isFav(item.href) ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--text-3)]')} />
                      </button>
                    )}
                    {!collapsed && item.name === 'Inbox' && inboxUnread > 0 && (
                      <span className="badge-pulse ml-auto text-[10px] font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5 font-numeric">{inboxUnread}</span>
                    )}
                    {!collapsed && item.name === 'Tickets' && openTicketsCount > 0 && (
                      <span className="badge-pulse ml-auto text-[10px] font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5 font-numeric">{openTicketsCount}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          )) : (topNav as typeof clientNavItems).map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={collapsed ? item.name : undefined}
                className={cn(navItemClass(active), 'group')}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r bg-[var(--accent)] animate-scale-in origin-center" style={{ height: '16px' }} />
                )}
                <span className="relative">
                  <item.icon className="w-[16px] h-[16px] shrink-0" />
                  {item.name === 'Chat' && chatUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500" />
                  )}
                </span>
                {!collapsed && <span className="truncate flex-1 min-w-0">{item.name}</span>}
                {!collapsed && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite({ name: item.name, href: item.href, iconType: item.icon.name }) }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Star className={cn('w-3 h-3', isFav(item.href) ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--text-3)]')} />
                  </button>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[var(--border)] py-2 px-2 space-y-0.5">
          {isModOrAbove && (
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] text-[var(--text-3)]',
              collapsed && 'justify-center'
            )}>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] shrink-0 animate-pulse" />
              {!collapsed && <span>{onlineNow} online</span>}
            </div>
          )}

          {bottomNav.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={collapsed ? item.name : undefined}
                className={cn(navItemClass(active), 'group')}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r bg-[var(--accent)] animate-scale-in origin-center" style={{ height: '16px' }} />
                )}
                <span className="relative">
                  <item.icon className="w-[16px] h-[16px] shrink-0" />
                  {item.name === 'Notificações' && notifUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 badge-pulse" />
                  )}
                </span>
                {!collapsed && <span className="truncate flex-1 min-w-0">{item.name}</span>}
                {!collapsed && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite({ name: item.name, href: item.href, iconType: item.icon.name }) }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Star className={cn('w-3 h-3', isFav(item.href) ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--text-3)]')} />
                  </button>
                )}
              </Link>
            )
          })}

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen) }}
              className={cn(
                'w-full flex items-center gap-2.5 h-[34px] px-3 rounded-lg text-[13px] transition-all duration-150 text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? (session?.user?.name || 'Perfil') : undefined}
            >
              <div className="w-[16px] h-[16px] rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[9px] font-[500] text-[var(--text-2)] shrink-0">
                {initials}
              </div>
              {!collapsed && <span className="truncate">{session?.user?.name || 'Perfil'}</span>}
            </button>
            {profileOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg py-1 z-50" onClick={e => e.stopPropagation()}>
                <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-[var(--text-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors" onClick={() => setProfileOpen(false)}>
                  <IconProfile className="w-[14px] h-[14px]" /> Perfil
                </Link>
                <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[var(--destructive)] hover:bg-[var(--destructive-subtle)] transition-colors">
                  <IconLogout className="w-[14px] h-[14px]" /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  )
}
