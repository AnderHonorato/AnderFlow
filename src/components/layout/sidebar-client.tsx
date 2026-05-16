'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUIStore, useOnlineStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import {
  IconDashboard, IconProject, IconClient, IconCRM, IconChat,
  IconFinancial, IconAnalytics, IconKnowledge, IconNotification,
  IconSettings, IconChevronLeft, IconChevronRight, IconMenu,
} from '@/components/icons'

const topNav = [
  { name: 'Dashboard', href: '/dashboard', icon: IconDashboard },
  { name: 'Projetos', href: '/projects', icon: IconProject },
  { name: 'Clientes', href: '/clients', icon: IconClient },
  { name: 'CRM', href: '/crm', icon: IconCRM },
  { name: 'Chat', href: '/chat', icon: IconChat },
  { name: 'Financeiro', href: '/financial', icon: IconFinancial },
  { name: 'Analytics', href: '/analytics', icon: IconAnalytics },
  { name: 'Conhecimento', href: '/knowledge', icon: IconKnowledge },
]

const bottomNav = [
  { name: 'Notificacoes', href: '/notifications', icon: IconNotification },
  { name: 'Configuracoes', href: '/settings', icon: IconSettings },
]

export function SidebarClient() {
  const pathname = usePathname()
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const { onlineNow, setStats } = useOnlineStore()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const fetchStats = () => fetch('/api/analytics/online').then(r => r.json()).then(setStats)
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [setStats])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const navItemClass = (active: boolean) =>
    cn(
      'flex items-center gap-2.5 h-[34px] px-3 rounded-lg text-[13px] transition-all duration-150 relative',
      collapsed && 'justify-center px-2',
      active
        ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
        : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
    )

  return (
    <>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={cn(
        'fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col',
        'bg-[var(--bg-secondary)] border-r border-[var(--border)]',
        'transform transition-all duration-200 ease-out',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:flex',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}>
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
            {!collapsed && <span className="text-[14px] font-[500] text-[var(--text)] tracking-[-0.01em]">ANDERFLOW</span>}
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
          {topNav.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={collapsed ? item.name : undefined}
                className={navItemClass(active)}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--accent)] rounded-r" />
                )}
                <item.icon className="w-[16px] h-[16px] shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[var(--border)] py-2 px-2 space-y-0.5">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] text-[var(--text-3)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] shrink-0 animate-pulse" />
              <span>{onlineNow} online</span>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
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
                className={navItemClass(active)}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--accent)] rounded-r" />
                )}
                <item.icon className="w-[16px] h-[16px] shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
