'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { Bell, BookOpen, LogOut, User, Settings, X } from 'lucide-react'

interface NotificationBanner {
  id: string
  title: string
  message: string
  type: string
  createdAt: number
}

export function Header() {
  const { data: session } = useSession()
  const initials = (session?.user?.name || 'AD').split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
  const [unreadCount, setUnreadCount] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const [banners, setBanners] = useState<NotificationBanner[]>([])
  const [currentBanner, setCurrentBanner] = useState(0)
  const seenIds = useRef<Set<string>>(new Set())
  const bannerTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())

  useEffect(() => {
    const fetchNotifications = () => {
      const userId = session?.user?.id
      if (!userId) return
      fetch(`/api/notifications?unread=true&userId=${userId}`)
        .then(r => r.json())
        .then(json => {
          const items = json.data || []
          setUnreadCount(items.length)

          const newItems = items.filter((n: any) => !seenIds.current.has(n.id))
          if (newItems.length > 0) {
            newItems.forEach((n: any) => seenIds.current.add(n.id))
            setBanners(prev => {
              const existingIds = new Set(prev.map(b => b.id))
              const toAdd = newItems.filter((n: any) => !existingIds.has(n.id))
                .map((n: any) => ({ id: n.id, title: n.title, message: n.message, type: n.type, createdAt: Date.now() }))
              return [...prev, ...toAdd]
            })
          }
        })
        .catch(() => {})
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    banners.forEach(b => {
      if (!bannerTimers.current.has(b.id)) {
        const timer = setTimeout(() => {
          setBanners(prev => prev.filter(x => x.id !== b.id))
          bannerTimers.current.delete(b.id)
        }, 600000)
        bannerTimers.current.set(b.id, timer)
      }
    })
    return () => {
      bannerTimers.current.forEach(t => clearTimeout(t))
    }
  }, [banners])

  useEffect(() => {
    const close = () => setProfileOpen(false)
    if (profileOpen) {
      document.addEventListener('click', close)
      return () => document.removeEventListener('click', close)
    }
  }, [profileOpen])

  useEffect(() => {
    if (banners.length === 0) return
    const rotator = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(rotator)
  }, [banners.length])

  const dismissBanner = (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id))
    const timer = bannerTimers.current.get(id)
    if (timer) { clearTimeout(timer); bannerTimers.current.delete(id) }
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {})
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-12 border-b border-[var(--border)] bg-[var(--header-bg)] flex items-center justify-between px-3 lg:px-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Link href="/dashboard" className="text-[var(--text)] font-medium hover:opacity-70 transition-opacity">
            ANDERFLOW
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/knowledge"
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            title="Conhecimento"
          >
            <BookOpen className="w-[16px] h-[16px]" />
          </Link>

          <Link
            href="/notifications"
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors relative"
          >
            <Bell className="w-[16px] h-[16px]" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--destructive)] text-[8px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="relative ml-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen) }}
              className="flex items-center justify-center h-7 w-7 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] text-2xs font-medium hover:opacity-80 transition-opacity"
            >
              {initials}
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-md py-1 z-50" onClick={e => e.stopPropagation()}>
                <div className="px-3 py-2 border-b border-[var(--border)]">
                  <p className="text-xs font-medium text-[var(--text)]">{session?.user?.name || 'Usuário'}</p>
                  <p className="text-2xs text-[var(--text-muted)]">{session?.user?.email}</p>
                </div>
                <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors" onClick={() => setProfileOpen(false)}>
                  <User className="w-3 h-3" /> Perfil
                </Link>
                <Link href="/settings" className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors" onClick={() => setProfileOpen(false)}>
                  <Settings className="w-3 h-3" /> Configurações
                </Link>
                <button onClick={() => signOut()} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--destructive)] hover:bg-[var(--destructive-subtle)] transition-colors">
                  <LogOut className="w-3 h-3" /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {banners.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div
            className="pointer-events-auto bg-[var(--primary)] text-white rounded-b-md px-4 py-2.5 max-w-lg w-[calc(100%-16px)] flex items-start gap-2.5 animate-slide-up shadow-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {banners[currentBanner]?.title}
              </p>
              <p className="text-2xs text-white/75 mt-0.5 line-clamp-1">
                {banners[currentBanner]?.message}
              </p>
              {banners.length > 1 && (
                <div className="flex gap-1 mt-1.5">
                  {banners.map((_, i) => (
                    <span key={i} className={`h-1 rounded-full transition-all ${i === currentBanner ? 'w-3 bg-white' : 'w-1 bg-white/40'}`} />
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => dismissBanner(banners[currentBanner]?.id)}
              className="shrink-0 flex items-center justify-center h-4 w-4 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
