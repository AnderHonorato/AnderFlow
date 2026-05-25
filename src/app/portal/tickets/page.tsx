'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { IconLoader, IconPlus } from '@/components/icons'
import { MessageSquare, CheckCircle2 } from 'lucide-react'

export default function PortalTicketsPage() {
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  const fetchTickets = () => {
    setLoading(true)
    fetch('/api/tickets')
      .then(r => r.json())
      .then(json => {
        setTickets(json.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchTickets() }, [])

  const openTickets = tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED')
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED')
  const displayed = tab === 'open' ? openTickets : resolvedTickets

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return
    setSendingMsg(true)
    const res = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newMessage }),
    })
    if (res.ok) {
      toast.success('Mensagem enviada')
      setNewMessage('')
      fetchTickets()
      const json = await res.json()
      if (json.data) {
        setSelectedTicket((prev: any) => ({
          ...prev,
          messages: [...(prev.messages || []), json.data],
        }))
      }
    } else {
      toast.error('Erro ao enviar mensagem')
    }
    setSendingMsg(false)
  }

  const handleCloseTicket = async (ticketId: string) => {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED' }),
    })
    if (res.ok) {
      toast.success('Ticket marcado como resolvido')
      fetchTickets()
      setSelectedTicket(null)
    } else {
      toast.error('Erro ao fechar ticket')
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-[500] tracking-[-0.015em]">Meus Tickets</h2>
          <p className="text-[12px] text-[var(--text-3)] mt-1">
            {openTickets.length} abertos · {resolvedTickets.length} resolvidos
          </p>
        </div>
        <Button size="sm" asChild className="h-8 text-[12px]">
          <a href="/portal/tickets/new">
            <IconPlus className="w-[14px] h-[14px]" /> Novo ticket
          </a>
        </Button>
      </div>

      <div className="flex gap-1 border-b border-[var(--border)]">
        <button
          className={`px-4 py-2 text-[13px] font-[500] border-b-2 transition-colors ${
            tab === 'open'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-3)] hover:text-[var(--text)]'
          }`}
          onClick={() => setTab('open')}
        >
          Abertos ({openTickets.length})
        </button>
        <button
          className={`px-4 py-2 text-[13px] font-[500] border-b-2 transition-colors ${
            tab === 'resolved'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-3)] hover:text-[var(--text)]'
          }`}
          onClick={() => setTab('resolved')}
        >
          Resolvidos ({resolvedTickets.length})
        </button>
      </div>

      {displayed.length === 0 ? (
        <Card><CardContent className="p-8 text-center">
          <p className="text-[var(--text-3)]">{tab === 'open' ? 'Nenhum ticket aberto' : 'Nenhum ticket resolvido'}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {displayed.map((ticket: any) => {
            const lastMsg = ticket.messages?.[ticket.messages.length - 1]
            return (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:border-[var(--accent)]/30 transition-colors"
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {ticket.number && (
                          <span className="text-[10px] font-[500] text-[var(--text-3)]">{ticket.number}</span>
                        )}
                        <p className="text-[13px] font-[500] truncate">{ticket.title}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? 'success' : ticket.status === 'IN_PROGRESS' ? 'info' : 'warning'} className="text-[10px]">
                          {ticket.status === 'RESOLVED' ? 'Resolvido' : ticket.status === 'CLOSED' ? 'Fechado' : ticket.status === 'IN_PROGRESS' ? 'Em andamento' : 'Aberto'}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">{ticket.priority || 'MEDIUM'}</Badge>
                        <span className="text-[10px] text-[var(--text-3)]">{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {lastMsg && (
                        <p className="text-[11px] text-[var(--text-3)] mt-1 truncate">{lastMsg.content?.slice(0, 80)}</p>
                      )}
                    </div>
                    <MessageSquare className="h-4 w-4 text-[var(--text-3)] shrink-0" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket?.number && (
                <span className="text-[11px] font-[500] text-[var(--text-3)]">{selectedTicket.number}</span>
              )}
              {selectedTicket?.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px]">
                <Badge variant={selectedTicket?.priority === 'CRITICAL' ? 'destructive' : selectedTicket?.priority === 'HIGH' ? 'warning' : 'secondary'} className="text-[10px]">
                  {selectedTicket?.priority || 'MEDIUM'}
                </Badge>
                {selectedTicket?.project && (
                  <span className="text-[var(--text-3)]">Projeto: {selectedTicket.project.name}</span>
                )}
              </div>
              {selectedTicket?.messages?.map((msg: any, i: number) => (
                <div key={i} className={`flex ${msg.userId === (session?.user as any)?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    msg.userId === (session?.user as any)?.id
                      ? 'bg-[var(--accent-subtle)] border border-[var(--accent)]/20 rounded-br-sm'
                      : 'bg-[var(--surface-2)] border border-[var(--border)] rounded-bl-sm'
                  }`}>
                    <p className="text-[10px] font-[600] text-[var(--accent)] mb-0.5">{msg.user?.name || 'Admin'}</p>
                    <p className="text-[12px] text-[var(--text)]">{msg.content}</p>
                    <p className="text-[9px] text-[var(--text-3)] mt-1">{new Date(msg.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
              {(!selectedTicket?.messages || selectedTicket.messages.length === 0) && (
                <p className="text-[12px] text-[var(--text-3)] text-center py-4">Nenhuma mensagem ainda</p>
              )}
            </div>
          </ScrollArea>
          {selectedTicket?.status !== 'CLOSED' && selectedTicket?.status !== 'RESOLVED' && (
            <div className="flex items-start gap-2 pt-3 border-t border-[var(--border)]">
              <textarea
                className="flex-1 min-h-[50px] rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[12px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
                placeholder="Adicionar mensagem..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={handleSendMessage} disabled={sendingMsg || !newMessage.trim()} className="h-8 text-[11px]">
                  {sendingMsg && <IconLoader className="w-[12px] h-[12px] animate-spin mr-1" />}Enviar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleCloseTicket(selectedTicket.id)} className="h-7 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Resolvido
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
