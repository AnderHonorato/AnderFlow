'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Bell, Check, FolderKanban, DollarSign, MessageSquare, AlertCircle, FileText,
} from 'lucide-react'

function getIcon(type: string) {
  switch (type) {
    case 'PROJECT_UPDATE': return <FolderKanban className="h-4 w-4 text-primary" />
    case 'PAYMENT': return <DollarSign className="h-4 w-4 text-success" />
    case 'MESSAGE': return <MessageSquare className="h-4 w-4 text-info" />
    case 'APPROVAL': return <AlertCircle className="h-4 w-4 text-warning" />
    case 'CONTRACT': return <FileText className="h-4 w-4 text-purple-500" />
    default: return <Bell className="h-4 w-4 text-muted-foreground" />
  }
}

export default function NotificationsPage() {
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
      body: JSON.stringify({ userId: 'seed_admin', markAll: true }),
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
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Notificações</h1>
          <p className="text-sm text-muted-foreground mt-1">{unreadCount} não lidas</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="mr-2 h-4 w-4" /> Marcar todas lidas
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {notifications.length === 0 && (
              <div className="p-12 text-center text-muted-foreground text-sm">Nenhuma notificação</div>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markOne(n.id)}
                className={`flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-muted/50 ${!n.isRead ? 'bg-primary/[0.02]' : ''}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted mt-0.5">{getIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!n.isRead ? 'font-medium' : ''}`}>{n.title}</p>
                    {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
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
