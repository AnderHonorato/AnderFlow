'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Plus, Search, TicketIcon, MessageSquare, MoreHorizontal, Loader2,
} from 'lucide-react'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', category: '' })

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
      body: JSON.stringify({ ...form, creatorId: 'cm1_example' }),
    })
    if (res.ok) { toast.success('Ticket criado'); setShowNew(false); loadTickets(); setForm({ title: '', description: '', priority: 'MEDIUM', category: '' }) }
    else toast.error('Erro ao criar ticket')
    setSaving(false)
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
        <div><h1 className="text-2xl font-semibold tracking-tight">Tickets</h1><p className="text-sm text-muted-foreground mt-1">Central de suporte</p></div>
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
              <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-xs font-mono text-muted-foreground">#{t.number || t.id.slice(-4)}</span><p className="text-sm font-medium truncate">{t.title}</p></div>
                  <div className="flex items-center gap-3 mt-1"><span className="text-xs text-muted-foreground">{t.creator?.name || 'Cliente'}</span>{t.category && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{t.category}</span>}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={t.priority === 'URGENT' ? 'destructive' : t.priority === 'HIGH' ? 'warning' : t.priority === 'MEDIUM' ? 'info' : 'secondary'} className="text-2xs">{t.priority}</Badge>
                  <Badge variant={t.status === 'OPEN' ? 'info' : t.status === 'IN_PROGRESS' ? 'warning' : t.status === 'RESOLVED' ? 'success' : 'secondary'} className="text-2xs">
                    {t.status === 'OPEN' ? 'Aberto' : t.status === 'IN_PROGRESS' ? 'Em Progresso' : t.status === 'RESOLVED' ? 'Resolvido' : t.status}
                  </Badge>
                  <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
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
    </div>
  )
}
