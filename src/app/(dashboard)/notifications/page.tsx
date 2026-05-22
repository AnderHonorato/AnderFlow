'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  IconNotification, IconCheck, IconProject, IconFinancial, IconChat, IconFile,
  IconArrowRight, IconChevronDown, IconClose,
} from '@/components/icons'
import { cn } from '@/lib/utils'

function getIcon(type: string) {
  switch (type) {
    case 'PROJECT_UPDATE': return <IconProject className="w-[14px] h-[14px] text-[var(--info)]" />
    case 'PAYMENT': return <IconFinancial className="w-[14px] h-[14px] text-[var(--success)]" />
    case 'MESSAGE': return <IconChat className="w-[14px] h-[14px] text-[var(--info)]" />
    case 'APPROVAL': return <IconCheck className="w-[14px] h-[14px] text-[var(--warning)]" />
    case 'CONTRACT': return <IconFile className="w-[14px] h-[14px] text-[var(--accent)]" />
    case 'BRIEFING_COMPLETED': return <IconProject className="w-[14px] h-[14px] text-[var(--accent)]" />
    case 'ACCOUNT_UPDATE': return <IconNotification className="w-[14px] h-[14px] text-[var(--warning)]" />
    default: return <IconNotification className="w-[14px] h-[14px] text-[var(--text-3)]" />
  }
}

function getAction(n: any) {
  let meta: any = null
  try { if (n.metadata) meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata } catch {}

  const actions: { label: string; href: string }[] = []
  if (meta?.projectId) actions.push({ label: 'Ir para o projeto', href: `/projects/${meta.projectId}` })
  if (n.type === 'MESSAGE') actions.push({ label: 'Ir para o chat', href: '/chat' })
  if (n.type === 'CONTRACT') actions.push({ label: 'Ver contratos', href: '/contracts' })
  if (n.type === 'PAYMENT') actions.push({ label: 'Ver financeiro', href: '/financial' })
  if (n.type === 'PROJECT_UPDATE' && meta?.projectId) actions.push({ label: 'Ir para o projeto', href: `/projects/${meta.projectId}` })

  return actions
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadNotifications = () => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(json => { setNotifications(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadNotifications() }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session?.user?.id, markAll: true }),
    })
    toast.success('Todas marcadas como lidas')
    loadNotifications()
  }

  const markOne = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
    loadNotifications()
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) return <div className="p-6 space-y-6 max-w-3xl mx-auto"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Notificações</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">{unreadCount} não lidas</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <IconCheck className="w-[14px] h-[14px]" /> Marcar todas lidas
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--border)]">
            {notifications.length === 0 && (
              <div className="p-12 text-center text-[var(--text-3)] text-[13px]">Nenhuma notificação</div>
            )}
            {notifications.map(n => {
              const isExpanded = expandedId === n.id
              const actions = getAction(n)
              return (
                <div key={n.id} className={cn(!n.isRead && 'bg-[var(--accent-subtle)]')}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!n.isRead) markOne(n.id)
                      setExpandedId(isExpanded ? null : n.id)
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { if (!n.isRead) markOne(n.id); setExpandedId(isExpanded ? null : n.id) }}}
                    className="flex items-start gap-3 p-3 transition-colors cursor-pointer hover:bg-[var(--surface-hover)] w-full text-left"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-3)] mt-0.5 shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-[13px]', !n.isRead && 'font-[500]')}>{n.title}</p>
                        {!n.isRead && <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
                      </div>
                      <p className="text-[12px] text-[var(--text-3)] mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[var(--text-3)]">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString('pt-BR') : ''}
                      </span>
                      <IconChevronDown className={cn('w-[14px] h-[14px] text-[var(--text-3)] transition-transform', isExpanded && 'rotate-180')} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 animate-fade-in">
                      <div className="pl-11 space-y-3">
                        <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                          <p className="text-[12px] text-[var(--text-2)] leading-relaxed">{n.message}</p>
                          {n.metadata && (
                            <pre className="mt-2 text-[10px] text-[var(--text-3)] whitespace-pre-wrap break-all">
                              {typeof n.metadata === 'string' ? n.metadata : JSON.stringify(n.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                        {actions.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {actions.map((action) => (
                              <Button
                                key={action.label}
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px]"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(action.href)
                                }}
                              >
                                {action.label}
                                <IconArrowRight className="w-[12px] h-[12px]" />
                              </Button>
                            ))}
                          </div>
                        )}
                        <div className="text-[11px] text-[var(--text-3)]">
                          {n.createdAt && (
                            <>Criado em {new Date(n.createdAt).toLocaleString('pt-BR')}</>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
