'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { IconNotification, IconCheck, IconProject, IconFinancial, IconChat, IconFile } from '@/components/icons'

function getIcon(type: string) {
  switch (type) {
    case 'PROJECT_UPDATE': return <IconProject className="w-[14px] h-[14px] text-[var(--info)]" />
    case 'PAYMENT': return <IconFinancial className="w-[14px] h-[14px] text-[var(--success)]" />
    case 'MESSAGE': return <IconChat className="w-[14px] h-[14px] text-[var(--info)]" />
    case 'APPROVAL': return <IconCheck className="w-[14px] h-[14px] text-[var(--warning)]" />
    case 'CONTRACT': return <IconFile className="w-[14px] h-[14px] text-[var(--accent)]" />
    default: return <IconNotification className="w-[14px] h-[14px] text-[var(--text-3)]" />
  }
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
    <div className="p-6 space-y-6 max-w-3xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Notificacoes</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">{unreadCount} nao lidas</p>
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
              <div className="p-12 text-center text-[var(--text-3)] text-[13px]">Nenhuma notificacao</div>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markOne(n.id)}
                className={`flex items-start gap-3 p-3 transition-colors cursor-pointer hover:bg-[var(--surface-hover)] ${!n.isRead ? 'bg-[var(--accent-subtle)]' : ''}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-3)] mt-0.5 shrink-0">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-[13px] ${!n.isRead ? 'font-[500]' : ''}`}>{n.title}</p>
                    {!n.isRead && <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />}
                  </div>
                  <p className="text-[12px] text-[var(--text-3)] mt-0.5">{n.message}</p>
                </div>
                <span className="text-[11px] text-[var(--text-3)] shrink-0">
                  {n.createdAt ? new Date(n.createdAt).toLocaleDateString('pt-BR') : ''}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
