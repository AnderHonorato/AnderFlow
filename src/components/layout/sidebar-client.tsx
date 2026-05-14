'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUIStore, useOnlineStore } from '@/stores/app-store'

export function SidebarClient({ topNav, bottomNav }: { topNav: any[]; bottomNav: any[] }) {
  const pathname = usePathname()
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const { onlineNow, setStats } = useOnlineStore()

  // Analytics ping + stats refresh
  useEffect(() => {
    const ping = () => fetch('/api/analytics/online', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'heartbeat' }) })
    const fetchStats = () => fetch('/api/analytics/online').then(r => r.json()).then(setStats)
    ping()
    fetchStats()
    const interval = setInterval(() => { ping(); fetchStats() }, 30000)
    return () => clearInterval(interval)
  }, [setStats])

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-[260px] flex flex-col
        bg-[hsl(228,80%,3.5%)] border-r border-[hsl(222,25%,12%)]
        transform transition-transform duration-200
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="flex h-16 items-center px-5 border-b border-[hsl(222,25%,12%)]">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="#1D6FFF"/>
              <path d="M7 22l6-15h4l4 10h-4l-3-5-4 10H7z" fill="#fff" opacity="0.9"/>
              <path d="M13 19c2-2 3-3 5-3h3c-1 2-2 3-4 3h-4z" fill="#fff" opacity="0.5"/>
            </svg>
            <span className="text-base font-semibold text-[#EAF2FF] tracking-tight">ANDERFLOW</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scroll-area">
          {topNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium
                  transition-all duration-150 group
                  ${active
                    ? 'bg-[hsl(217,100%,56%,.12)] text-[hsl(217,100%,56%)]'
                    : 'text-[#94A3B8] hover:bg-[hsl(222,40%,10%)] hover:text-[#EAF2FF] hover:pl-4'
                  }
                `}
              >
                <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Stats + bottom nav */}
        <div className="border-t border-[hsl(222,25%,12%)] py-3 px-3 space-y-2">
          {/* Online counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[hsl(222,40%,8%)]">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-[#94A3B8]">{onlineNow} online agora</span>
          </div>

          {bottomNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm font-medium
                  transition-all duration-150
                  ${active
                    ? 'bg-[hsl(217,100%,56%,.12)] text-[hsl(217,100%,56%)]'
                    : 'text-[#94A3B8] hover:bg-[hsl(222,40%,10%)] hover:text-[#EAF2FF] hover:pl-4'
                  }
                `}
              >
                <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
