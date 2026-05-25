'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GripVertical } from 'lucide-react'
import { Plus, Search, DollarSign, TrendingUp, Users, Target,
  MoreHorizontal, Building2, Loader2, LayoutGrid, List,
} from 'lucide-react'

type ViewMode = 'funnel' | 'list'

const PIPELINE_STAGES = [
  { id: 'NEW', title: 'Novo', color: 'var(--info)', bg: 'var(--info-subtle)' },
  { id: 'CONTACTED', title: 'Contatado', color: 'var(--info)', bg: 'var(--info-subtle)' },
  { id: 'QUALIFIED', title: 'Qualificado', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
  { id: 'PROPOSAL', title: 'Proposta', color: 'var(--warning)', bg: 'var(--warning-subtle)' },
  { id: 'NEGOTIATION', title: 'Negociação', color: 'var(--warning)', bg: 'var(--warning-subtle)' },
  { id: 'WON', title: 'Fechado', color: 'var(--success)', bg: 'var(--success-subtle)' },
  { id: 'LOST', title: 'Perdido', color: 'var(--destructive)', bg: 'var(--destructive-subtle)' },
]

function getTemperature(lead: any): { label: string; emoji: string } {
  const days = lead.lastContact ? Math.floor((Date.now() - new Date(lead.lastContact).getTime()) / 86400000) : 30
  if (days <= 7) return { label: 'Quente', emoji: '🔥' }
  if (days <= 21) return { label: 'Morno', emoji: '🌤️' }
  return { label: 'Frio', emoji: '❄️' }
}

function SortableLeadCard({ lead, onView, onScore }: { lead: any; onView: (id: string) => void; onScore?: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 50 : 'auto' }
  const temp = getTemperature(lead)

  const scoreColor = lead.leadScore !== null && lead.leadScore !== undefined
    ? lead.leadScore >= 70 ? 'bg-success' : lead.leadScore >= 40 ? 'bg-warning' : 'bg-destructive'
    : null

  return (
    <Card ref={setNodeRef} style={style} className="card-hover cursor-pointer" onClick={() => onView(lead.id)}>
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center gap-1.5" {...attributes} {...listeners}>
          <GripVertical className="h-3 w-3 text-[var(--text-3)] opacity-40 cursor-grab shrink-0" />
          <span className="text-[9px] text-[var(--text-3)]" title={temp.label}>{temp.emoji}</span>
          {scoreColor && (
            <span className={`ml-auto text-2xs px-1.5 py-0.5 rounded-full text-white ${scoreColor}`}>
              {Math.round(lead.leadScore)}
            </span>
          )}
        </div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8"><AvatarFallback className="text-2xs">{lead.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
            <div><p className="text-sm font-medium">{lead.name}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.company || '-'}</p></div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onView(lead.id)}>Ver detalhes</DropdownMenuItem>
              {onScore && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onScore(lead.id) }}>Pontuar com IA</DropdownMenuItem>}
              <DropdownMenuItem className="text-destructive" onClick={async (e) => {
                e.stopPropagation()
                await fetch(`/api/leads/${lead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'LOST' }) })
                toast.success('Lead movido para Perdido')
                window.location.reload()
              }}>Marcar como Perdido</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-success">{lead.value ? `R$ ${(lead.value / 1000).toFixed(0)}k` : '-'}</span>
          <Badge variant="secondary" className="text-2xs">{lead.source || '-'}</Badge>
        </div>
        {lead.lastContact && (
          <p className="text-[10px] text-[var(--text-3)]">Contato: {new Date(lead.lastContact).toLocaleDateString('pt-BR')}</p>
        )}
      </CardContent>
    </Card>
  )
}

function FunnelColumn({ stage, leads, onView, onScore }: { stage: typeof PIPELINE_STAGES[0]; leads: any[]; onView: (id: string) => void; onScore?: (id: string) => void }) {
  const stageValue = leads.reduce((s, l) => s + (l.value || 0), 0)
  return (
    <div className="flex-shrink-0 w-[280px]">
      <div className="flex items-center justify-between mb-3 px-1 py-1.5 rounded-lg" style={{ background: stage.bg }}>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
          <span className="text-xs font-semibold text-[var(--text)]">{stage.title}</span>
          <Badge variant="secondary" className="text-2xs h-5 px-1.5">{leads.length}</Badge>
        </div>
        <span className="text-[10px] text-[var(--text-3)] font-mono">R$ {(stageValue / 1000).toFixed(0)}k</span>
      </div>
      <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {leads.length === 0 && (
            <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center">
              <p className="text-[11px] text-[var(--text-3)]">Arraste leads para ca</p>
            </div>
          )}
          {leads.map(lead => <SortableLeadCard key={lead.id} lead={lead} onView={onView} onScore={onScore} />)}
        </div>
      </SortableContext>
    </div>
  )
}

export default function CRMPage() {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>('funnel')
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: '', value: '' })
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [, setScoring] = useState<string | null>(null)
  const [sortByScore, setSortByScore] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const loadLeads = () => {
    fetch('/api/leads')
      .then(r => r.json())
      .then(json => { setLeads(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadLeads() }, [])

  const handleCreate = async () => {
    setSaving(true)
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, value: form.value ? parseFloat(form.value) : null }),
    })
    if (res.ok) { toast.success('Lead criado'); setShowNew(false); loadLeads(); setForm({ name: '', email: '', phone: '', company: '', source: '', value: '' }) }
    else toast.error('Erro ao criar lead')
    setSaving(false)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const leadId = active.id as string
    const overId = over.id as string

    let newStatus: string | null = null
    const targetLead = leads.find(l => l.id === overId)
    if (targetLead) newStatus = targetLead.status
    else {
      const stage = PIPELINE_STAGES.find(s => s.id === overId)
      if (stage) newStatus = stage.id
    }

    if (!newStatus) return

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))

    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(`Lead movido para ${PIPELINE_STAGES.find(s => s.id === newStatus)?.title}`)
    } catch {
      toast.error('Erro ao mover lead')
      loadLeads()
    }
  }

  const scoreLead = async (leadId: string) => {
    setScoring(leadId)
    try {
      const res = await fetch('/api/leads/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId }) })
      const json = await res.json()
      if (json.score) { toast.success(`Score: ${json.score}`); loadLeads() }
      else toast.error('Erro ao pontuar')
    } catch { toast.error('Erro de conexao') }
    setScoring(null)
  }

  const filtered = leads.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.company || '').toLowerCase().includes(search.toLowerCase()))
  const sorted = sortByScore ? [...filtered].sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0)) : filtered
  const totalValue = useMemo(() => leads.reduce((s, l) => s + (l.value || 0), 0), [leads])
  const wonValue = useMemo(() => leads.filter(l => l.status === 'WON').reduce((s, l) => s + (l.value || 0), 0), [leads])

  if (loading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}</div><div className="flex gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-96 w-[280px]" />)}</div></div>

  return (
    <div className="p-6 space-y-6">
      <OnboardingTip id="crm_tip" title="Pipeline de Vendas" description="Arraste leads entre as etapas do funil. Clique 'Novo Lead' para começar." />
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-medium">CRM</h1><p className="text-sm text-muted-foreground mt-1">Pipeline de vendas</p></div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[var(--border)] rounded-lg">
            <Button variant={view === 'funnel' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setView('funnel')}><LayoutGrid className="w-[14px] h-[14px]" /></Button>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setView('list')}><List className="w-[14px] h-[14px]" /></Button>
          </div>
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" /> Novo Lead</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><DollarSign className="h-5 w-5 text-success" /></div><div><p className="text-xl font-semibold">R$ {(totalValue / 1000).toFixed(0)}k</p><p className="text-xs text-muted-foreground">Pipeline</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><Users className="h-5 w-5 text-info" /></div><div><p className="text-xl font-semibold">{leads.length}</p><p className="text-xs text-muted-foreground">Leads</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Target className="h-5 w-5 text-primary" /></div><div><p className="text-xl font-semibold">{leads.filter(l => l.status === 'WON').length}</p><p className="text-xs text-muted-foreground">Fechados</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><TrendingUp className="h-5 w-5 text-warning" /></div><div><p className="text-xl font-semibold">R$ {(wonValue / 1000).toFixed(0)}k</p><p className="text-xs text-muted-foreground">Receita Fechada</p></div></CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Button variant={sortByScore ? 'default' : 'outline'} size="sm" onClick={() => setSortByScore(!sortByScore)}>
          Por score
        </Button>
      </div>

      {view === 'funnel' && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
              {PIPELINE_STAGES.map(stage => {
                const stageLeads = sorted.filter(l => l.status === stage.id)
                return <FunnelColumn key={stage.id} stage={stage} leads={stageLeads} onView={(id) => setSelectedLead(leads.find(l => l.id === id) || null)} onScore={scoreLead} />
              })}
          </div>
        </DndContext>
      )}

      {view === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum lead encontrado</p>}
              {filtered.map(lead => {
                const temp = getTemperature(lead)
                return (
                  <div key={lead.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                    <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{lead.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium">{lead.name} <span className="text-xs">{temp.emoji}</span></p><p className="text-xs text-muted-foreground">{lead.company || '-'} · {lead.email || '-'}</p></div>
                    <span className="text-sm font-semibold">{lead.value ? `R$ ${(lead.value / 1000).toFixed(0)}k` : '-'}</span>
                    <Badge variant={lead.status === 'WON' ? 'success' : lead.status === 'LOST' ? 'destructive' : 'secondary'} className="text-2xs">{PIPELINE_STAGES.find(s => s.id === lead.status)?.title || lead.status}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent><DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <Input placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <Input placeholder="Empresa" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
            <Input placeholder="Origem (ex: Site)" value={form.source} onChange={e => setForm({...form, source: e.target.value})} />
            <Input placeholder="Valor estimado (R$)" type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={saving || !form.name}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar Lead</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedLead?.name}</DialogTitle></DialogHeader>
          {selectedLead && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Empresa</p><p className="text-sm font-medium">{selectedLead.company || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Origem</p><p className="text-sm font-medium">{selectedLead.source || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium">{selectedLead.email || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Telefone</p><p className="text-sm font-medium">{selectedLead.phone || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor</p><p className="text-sm font-semibold text-success">{selectedLead.value ? `R$ ${selectedLead.value.toLocaleString('pt-BR')}` : '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge variant={selectedLead.status === 'WON' ? 'success' : 'secondary'} className="text-2xs">{PIPELINE_STAGES.find(s => s.id === selectedLead.status)?.title}</Badge></div>
              </div>
              {selectedLead.notes && <div><p className="text-xs text-muted-foreground mb-1">Notas</p><p className="text-sm">{selectedLead.notes}</p></div>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLead(null)}>Fechar</Button>
            <Button variant="outline" size="sm" onClick={() => { setSelectedLead(null); router.push(`/crm/${selectedLead?.id}`) }}>Ver detalhes completos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
