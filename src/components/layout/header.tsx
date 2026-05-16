'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useUIStore } from '@/stores/app-store'
import { IconNotification, IconClose, IconMenu, IconArrowRight, IconProject } from '@/components/icons'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  createdAt: string
  metadata?: any
}

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const { setMobileMenuOpen } = useUIStore()
  const [unreadItems, setUnreadItems] = useState<NotificationItem[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [activeProject, setActiveProject] = useState<any>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const prevIdsRef = useRef<Set<string>>(new Set())
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem('anderflow_seen_notifications')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch { return new Set() }
  })

  const role = session?.user?.role as string || 'CLIENT'
  const isClient = role === 'CLIENT'

  useEffect(() => {
    if (isClient) {
      fetch('/api/projects?status=IN_PROGRESS')
        .then(r => r.json())
        .then(json => {
          const first = (json.data || [])[0]
          if (first) setActiveProject(first)
        })
        .catch(() => {})
    }
  }, [role, isClient])

  useEffect(() => {
    const fetchNotifications = () => {
      if (!session?.user?.id) return
      fetch('/api/notifications?unread=true')
        .then(r => r.json())
        .then(json => {
          const items: any[] = json.data || []
          const parsed: NotificationItem[] = items.map((n: any) => {
            let meta: any = null
            try { if (n.metadata) meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata } catch {}
            return { id: n.id, title: n.title, message: n.message, type: n.type, createdAt: n.createdAt, metadata: meta }
          })

          const currentIds = new Set(items.map((n: any) => n.id))
          prevIdsRef.current.forEach((id: string) => {
            if (!currentIds.has(id) || items.length > prevIdsRef.current.size) {
              const newItem = parsed.find(p => !prevIdsRef.current.has(p.id))
              if (newItem) toast.info(newItem.title)
            }
          })
          prevIdsRef.current = currentIds

          if (parsed.length !== unreadItems.length) {
            setCarouselIdx(0)
          }
          setUnreadItems(parsed)

          const newIds = items.map(n => n.id)
          const nextIds = new Set(seenIds)
          let changed = false
          newIds.forEach((id: string) => { if (!nextIds.has(id)) { nextIds.add(id); changed = true } })
          if (changed) {
            setSeenIds(nextIds)
            try { sessionStorage.setItem('anderflow_seen_notifications', JSON.stringify(Array.from(nextIds))) } catch {}
          }
        })
        .catch(() => {})
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [session?.user?.id])

  useEffect(() => {
    if (unreadItems.length === 0) return
    const timer = setInterval(() => {
      setCarouselIdx(prev => (prev + 1) % unreadItems.length)
    }, 60000)
    return () => clearInterval(timer)
  }, [unreadItems.length])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [dropdownOpen])

  const dismissOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setUnreadItems(prev => prev.filter(n => n.id !== id))
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {})
  }

  const getNotifLink = (n: NotificationItem) => {
    if (n.metadata?.projectId) return `/projects/${n.metadata.projectId}`
    if (n.type === 'MESSAGE') return '/clients'
    if (n.type === 'CONTRACT') return '/contracts'
    return '/notifications'
  }

  const currentNotification = unreadItems[carouselIdx] || null

  return (
    <header
      className="sticky top-0 z-30 h-[48px] flex items-center justify-between px-3 lg:px-4 shrink-0"
      style={{
        background: 'rgba(10,10,15,0.5)',
        backdropFilter: 'blur(16px) saturate(200%)',
        WebkitBackdropFilter: 'blur(16px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden flex items-center justify-center h-7 w-7 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
        >
          <IconMenu className="w-[16px] h-[16px]" />
        </button>

        {isClient && activeProject && (
          <div
            className="hidden md:flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer animate-fade-in"
            onClick={() => router.push(`/projects/${activeProject.id}`)}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--accent-subtle)] shrink-0">
                <IconProject className="w-3 h-3 text-[var(--accent)]" />
              </div>
              <span className="text-[12px] text-[var(--text)] truncate font-[500]">
                {activeProject.name}
              </span>
            </div>
            <span className="text-[12px] text-[var(--accent)] font-[500] shrink-0">
              {activeProject.progress || 0}%
            </span>
            <div className="h-1.5 w-20 rounded-full bg-[var(--surface-3)] overflow-hidden shrink-0 relative">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
                style={{ width: `${activeProject.progress || 0}%` }}
              />
              <div
                className="absolute inset-0 w-full h-full opacity-30"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                  animation: 'shimmer 2s ease-in-out infinite',
                  transform: 'translateX(-100%)',
                }}
              />
            </div>
            <span className="flex items-center gap-1 text-[10px] text-[var(--success)] shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              Em andamento
            </span>
          </div>
        )}

        {!isClient && currentNotification && (
          <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 animate-fade-in"
            onClick={() => router.push(getNotifLink(currentNotification))}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
            <span className="text-[12px] text-[var(--text-2)] truncate cursor-pointer hover:text-[var(--text)]">
              {currentNotification.title}
            </span>
            <span className="text-[11px] text-[var(--text-3)] truncate hidden lg:inline">
              — {currentNotification.message}
            </span>
            <span className="text-[10px] text-[var(--text-3)] shrink-0">
              {carouselIdx + 1}/{unreadItems.length}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="relative flex items-center justify-center h-7 w-9 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
        >
          <IconNotification className="w-[16px] h-[16px]" />
          {unreadItems.length > 0 && (
            <span className="absolute top-0.5 right-0 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-[500] text-white px-1">
              {unreadItems.length > 9 ? '9+' : unreadItems.length}
            </span>
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-16px)] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in"
            style={{ position: 'fixed', top: '48px', right: '1rem' }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
              <span className="text-[13px] font-[500] text-[var(--text)]">Notificacoes</span>
              <Link
                href="/notifications"
                onClick={() => setDropdownOpen(false)}
                className="text-[12px] text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                Ver todas
              </Link>
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {unreadItems.length === 0 && (
                <p className="p-6 text-center text-[12px] text-[var(--text-3)]">
                  Nenhuma notificacao nova
                </p>
              )}
              {unreadItems.slice(0, 10).map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    setDropdownOpen(false)
                    router.push(getNotifLink(n))
                  }}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] cursor-pointer transition-colors group"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-[500] text-[var(--text)] truncate">{n.title}</p>
                    <p className="text-[11px] text-[var(--text-3)] mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                  <button
                    onClick={(e) => dismissOne(n.id, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center h-5 w-5 rounded text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
                  >
                    <IconClose className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
