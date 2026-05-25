'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { IconSparkles } from '@/components/icons'
import {
  Plus, Search, TicketIcon, MessageSquare, MoreHorizontal, Loader2,
} from 'lucide-react'

export default function TicketsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', category: '' })
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  const loadTickets = () => {
    fetch('/api/tickets')
      .then(r => r.json())
      .then(json => { setTickets(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadTickets() }, [])

  const handleCreate = async () => {
    setSaving(true)
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, creatorId: session?.user?.id }),
    })
    if (res.ok) { toast.success('Ticket criado'); setShowNew(false); loadTickets(); setForm({ title: '', description: '', priority: 'MEDIUM', category: '' }) }
    else toast.error('Erro ao criar ticket')
    setSaving(false)
  }

  const handleUseAIReply = () => {
    if (selectedTicket?.aiSuggestedReply) {
      setReplyText(selectedTicket.aiSuggestedReply)
    }
  }

  const handleUpdateTicket = async (ticketId: string, data: any) => {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast.success('Ticket atualizado')
      loadTickets()
      setSelectedTicket(null)
      setReplyText('')
    } else {
      toast.error('Erro ao atualizar ticket')
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return
    setReplying(true)
    await handleUpdateTicket(selectedTicket.id, { status: 'IN_PROGRESS' })
    setReplying(false)
  }

  const filtered = tickets.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    open: tickets.filter(t => t.status === 'OPEN').length,
    progress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
  }

  if (loading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 space-y-6">
      <OnboardingTip
        id="tickets_tip"
        title="Central de Suporte"
        description="Acompanhe tickets dos clientes. Cada ticket tem prioridade (Baixa/Média/Alta/Urgente) e status. Crie um novo para testar."
      />
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-medium">Tickets</h1><p className="text-sm text-muted-foreground mt-1">Central de suporte</p></div>
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" /> Novo Ticket</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><TicketIcon className="h-5 w-5 text-info" /></div><div><p className="text-xl font-semibold">{stats.open}</p><p className="text-xs text-muted-foreground">Abertos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><TicketIcon className="h-5 w-5 text-warning" /></div><div><p className="text-xl font-semibold">{stats.progress}</p><p className="text-xs text-muted-foreground">Em Progresso</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><TicketIcon className="h-5 w-5 text-success" /></div><div><p className="text-xl font-semibold">{stats.resolved}</p><p className="text-xs text-muted-foreground">Resolvidos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><MessageSquare className="h-5 w-5" /></div><div><p className="text-xl font-semibold">{tickets.length}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
      </div>

      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => { setSelectedTicket(t); setReplyText('') }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-xs font-mono text-muted-foreground">#{t.number || t.id.slice(-4)}</span><p className="text-sm font-medium truncate">{t.title}</p>
                    {t.aiSuggestedReply && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="shrink-0 cursor-help"><IconSparkles className="w-3.5 h-3.5 text-[var(--accent)]" /></span>
                        </TooltipTrigger>
                        <TooltipContent>IA analisou este ticket</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1"><span className="text-xs text-muted-foreground">{t.creator?.name || 'Cliente'}</span>{t.category && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{t.category}</span>}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={t.priority === 'URGENT' ? 'destructive' : t.priority === 'HIGH' ? 'warning' : t.priority === 'MEDIUM' ? 'info' : 'secondary'} className="text-2xs">{t.priority}</Badge>
                  <Badge variant={t.status === 'OPEN' ? 'info' : t.status === 'IN_PROGRESS' ? 'warning' : t.status === 'RESOLVED' ? 'success' : 'secondary'} className="text-2xs">
                    {t.status === 'OPEN' ? 'Aberto' : t.status === 'IN_PROGRESS' ? 'Em Progresso' : t.status === 'RESOLVED' ? 'Resolvido' : t.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => router.push(`/tickets/${t.id}`)}>Ver detalhes</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={async () => {
                        await fetch(`/api/tickets/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CLOSED' }) })
                        toast.success('Ticket arquivado'); loadTickets()
                      }}>Arquivar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="p-12 text-center text-muted-foreground text-sm">Nenhum ticket encontrado</div>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            <Input placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
              <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option>
            </select>
            <Input placeholder="Categoria (ex: Bug)" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null) }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              #{selectedTicket?.number || selectedTicket?.id?.slice(-4)} {selectedTicket?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--text-2)]">{selectedTicket?.description}</p>

            <div className="flex items-center gap-3">
              <Badge variant={selectedTicket?.priority === 'URGENT' ? 'destructive' : selectedTicket?.priority === 'HIGH' ? 'warning' : selectedTicket?.priority === 'MEDIUM' ? 'info' : 'secondary'}>
                Prioridade: {selectedTicket?.priority}
              </Badge>
              <Badge variant={selectedTicket?.status === 'OPEN' ? 'info' : selectedTicket?.status === 'IN_PROGRESS' ? 'warning' : selectedTicket?.status === 'RESOLVED' ? 'success' : 'secondary'}>
                {selectedTicket?.status === 'OPEN' ? 'Aberto' : selectedTicket?.status === 'IN_PROGRESS' ? 'Em Progresso' : selectedTicket?.status === 'RESOLVED' ? 'Resolvido' : selectedTicket?.status}
              </Badge>
              {selectedTicket?.category && <span className="text-xs text-muted-foreground">{selectedTicket.category}</span>}
            </div>

            {selectedTicket?.aiSuggestedReply && (
              <Card className="bg-[var(--info-subtle)] border-[var(--border)]">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <IconSparkles className="w-4 h-4 text-[var(--accent)]" />
                    <p className="text-[12px] font-[500] text-[var(--text)]">Sugestoes da IA</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[var(--text-3)]">Categoria:</span>
                      <span className="ml-1 text-[var(--text)]">{selectedTicket.aiCategory || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-3)]">Prioridade:</span>
                      <span className="ml-1 text-[var(--text)]">{selectedTicket.aiPriority || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--text-3)] mb-1">Resposta sugerida:</p>
                    <p className="text-[12px] text-[var(--text)] bg-[var(--surface)] rounded-md p-2 border border-[var(--border)]">{selectedTicket.aiSuggestedReply}</p>
                    <Button variant="outline" size="sm" className="mt-2 text-[11px] h-7" onClick={handleUseAIReply}>
                      <IconSparkles className="w-3 h-3 mr-1" /> Usar esta resposta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedTicket?.status !== 'RESOLVED' && selectedTicket?.status !== 'CLOSED' && (
              <div className="space-y-2">
                <p className="text-[12px] font-[500] text-[var(--text)]">Responder</p>
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="min-h-[80px] text-[13px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleUpdateTicket(selectedTicket.id, { status: 'RESOLVED' })}>
                    Marcar Resolvido
                  </Button>
                  <Button size="sm" onClick={handleSendReply} disabled={replying || !replyText.trim()}>
                    {replying ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
