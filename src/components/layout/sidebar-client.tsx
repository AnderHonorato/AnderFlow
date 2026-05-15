'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUIStore, useOnlineStore } from '@/stores/app-store'
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'

const topNav = [
  { name: 'Dashboard', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Projetos', href: '/projects', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
  { name: 'Clientes', href: '/clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: 'CRM', href: '/crm', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { name: 'Chat', href: '/chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { name: 'Financeiro', href: '/financial', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Analytics', href: '/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Conhecimento', href: '/knowledge', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
]

const bottomNav = [
  { name: 'Notificações', href: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { name: 'Configurações', href: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
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
    `flex items-center rounded-md text-[13px] font-normal transition-colors duration-150 border-l-[2px] ${
      collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
    } ${
      active
        ? 'border-l-[var(--primary)] text-[var(--text)]'
        : 'border-l-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
    }`

  return (
    <>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col
        bg-[var(--sidebar-bg)] border-r border-[var(--border)]
        transform transition-all duration-200 ease-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:flex
        ${collapsed ? 'w-[60px]' : 'w-[230px]'}
      `}>
        <div className={`flex h-12 items-center border-b border-[var(--border)] px-3 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="shrink-0">
              <rect width="28" height="28" rx="6" fill="var(--primary)"/>
              <path d="M7 22l6-15h4l4 10h-4l-3-5-4 10H7z" fill="#fff" opacity="0.9"/>
              <path d="M13 19c2-2 3-3 5-3h3c-1 2-2 3-4 3h-4z" fill="#fff" opacity="0.5"/>
            </svg>
            {!collapsed && <span className="text-sm font-medium text-[var(--text)]">ANDERFLOW</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center h-5 w-5 rounded border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-base"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-[var(--text-muted)]">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scroll-area">
          {topNav.map(item => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              title={collapsed ? item.name : undefined}
              className={navItemClass(isActive(item.href))}
            >
              <svg className="w-[16px] h-[16px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
              {!collapsed && <span className="ml-2.5 truncate">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] py-2 px-2 space-y-0.5">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-[var(--text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] shrink-0" />
              <span>{onlineNow} online</span>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            </div>
          )}
          {bottomNav.map(item => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              title={collapsed ? item.name : undefined}
              className={navItemClass(isActive(item.href))}
            >
              <svg className="w-[16px] h-[16px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
              {!collapsed && <span className="ml-2.5 truncate">{item.name}</span>}
            </Link>
          ))}
        </div>
      </aside>
    </>
  )
}
