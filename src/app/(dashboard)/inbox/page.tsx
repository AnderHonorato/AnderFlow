'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Bell, Ticket, MessageSquare, CheckCheck } from 'lucide-react'

const typeConfig = {
  notification: { icon: Bell, color: 'var(--warning)', label: 'Notificação' },
  ticket: { icon: Ticket, color: 'var(--info)', label: 'Ticket' },
  message: { icon: MessageSquare, color: 'var(--accent)', label: 'Mensagem' },
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function InboxPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await fetch('/api/inbox')
      const json = await res.json()
      setItems(json.items || [])
      setTotalUnread(json.totalUnread || 0)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleClick = async (item: any) => {
    if (item.type === 'notification' && !item.isRead) {
      try { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [item.id] }) }) } catch {}
    }
    router.push(item.href)
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAll: true }) })
      setItems(prev => prev.map(i => ({ ...i, isRead: true })))
      toast.success('Tudo marcado como lido')
    } catch { toast.error('Erro') }
  }

  if (loading) return <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-[17px] font-[500]">Inbox</h1>
          {totalUnread > 0 && <Badge variant="warning" className="text-xs">{totalUnread} não lido{totalUnread !== 1 ? 's' : ''}</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} className="h-7 text-[11px] gap-1">
          <CheckCheck className="h-3 w-3" /> Marcar todos como lidos
        </Button>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><p className="text-sm text-[var(--text-3)]">Inbox vazio</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-[var(--border)]">
            {items.map(item => {
              const cfg = typeConfig[item.type as keyof typeof typeConfig] || typeConfig.notification
              const Icon = cfg.icon
              return (
                <button key={`${item.type}-${item.id}`} onClick={() => handleClick(item)}
                  className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-[var(--surface)] transition-colors">
                  {!item.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] shrink-0 mt-1" />}
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: cfg.color, opacity: 0.1 }}>
                    <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] truncate ${!item.isRead ? 'font-[500] text-[var(--text)]' : 'text-[var(--text-2)]'}`}>{item.title}</p>
                    <p className="text-[11px] text-[var(--text-3)] truncate mt-0.5">{item.subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-[var(--text-3)]">{relativeTime(item.createdAt)}</p>
                    <Badge variant="secondary" className="text-2xs mt-0.5">{cfg.label}</Badge>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
