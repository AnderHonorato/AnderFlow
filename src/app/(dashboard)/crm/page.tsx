'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus, Search, DollarSign, TrendingUp, Users, Target,
  MoreHorizontal, Building2, Loader2,
} from 'lucide-react'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const pipelineStages = [
  { id: 'NEW', title: 'Novo', color: 'bg-muted-foreground' },
  { id: 'CONTACTED', title: 'Contato Feito', color: 'bg-info' },
  { id: 'QUALIFIED', title: 'Qualificado', color: 'bg-warning' },
  { id: 'PROPOSAL', title: 'Proposta', color: 'bg-purple-500' },
  { id: 'NEGOTIATION', title: 'Negociação', color: 'bg-orange-500' },
  { id: 'WON', title: 'Fechado', color: 'bg-success' },
]

export default function CRMPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: '', value: '' })

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

  const filtered = leads.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.company || '').toLowerCase().includes(search.toLowerCase()))

  const totalValue = useMemo(() => leads.reduce((s, l) => s + (l.value || 0), 0), [leads])
  const wonValue = useMemo(() => leads.filter(l => l.status === 'WON').reduce((s, l) => s + (l.value || 0), 0), [leads])

  if (loading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div><div className="flex gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-96 w-[280px]" />)}</div></div>

  return (
    <div className="p-6 space-y-6">
      <OnboardingTip
        id="crm_tip"
        title="Pipeline de Vendas"
        description="Gerencie leads no funil: Novo → Contato → Qualificado → Proposta → Negociação → Fechado. Clique 'Novo Lead' para começar."
      />
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-medium">CRM</h1><p className="text-sm text-muted-foreground mt-1">Pipeline de vendas</p></div>
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" /> Novo Lead</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><DollarSign className="h-5 w-5 text-success" /></div><div><p className="text-xl font-semibold">R$ {(totalValue/1000).toFixed(0)}k</p><p className="text-xs text-muted-foreground">Pipeline</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><Users className="h-5 w-5 text-info" /></div><div><p className="text-xl font-semibold">{leads.length}</p><p className="text-xs text-muted-foreground">Leads</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Target className="h-5 w-5 text-primary" /></div><div><p className="text-xl font-semibold">{leads.filter(l => l.status === 'WON').length}</p><p className="text-xs text-muted-foreground">Fechados</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><TrendingUp className="h-5 w-5 text-warning" /></div><div><p className="text-xl font-semibold">R$ {(wonValue/1000).toFixed(0)}k</p><p className="text-xs text-muted-foreground">Receita Fechada</p></div></CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineStages.map(stage => {
          const stageLeads = filtered.filter(l => l.status === stage.id)
          const stageValue = stageLeads.reduce((s, l) => s + (l.value || 0), 0)
          return (
            <div key={stage.id} className="flex-shrink-0 w-[280px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                  <span className="text-sm font-medium">{stage.title}</span>
                  <Badge variant="secondary" className="text-2xs h-5 px-1.5">{stageLeads.length}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">R$ {(stageValue/1000).toFixed(0)}k</span>
              </div>
              <div className="space-y-3">
                {stageLeads.map(lead => (
                  <Card key={lead.id} className="card-hover cursor-pointer">
                    <CardContent className="p-3 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8"><AvatarFallback className="text-2xs">{lead.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
                          <div><p className="text-sm font-medium">{lead.name}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.company || '-'}</p></div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => router.push(`/crm/${lead.id}`)}>Ver detalhes</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={async () => {
                              await fetch(`/api/leads/${lead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'LOST' }) })
                              toast.success('Lead arquivado'); loadLeads()
                            }}>Arquivar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-success">{lead.value ? `R$ ${(lead.value/1000).toFixed(0)}k` : '-'}</span>
                        <Badge variant="secondary" className="text-2xs">{lead.source || '-'}</Badge>
                      </div>
                      {lead.score > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Score</span><span className="font-medium">{lead.score}%</span></div>
                          <Progress value={lead.score} className="h-1" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <Input placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            <Input placeholder="Empresa" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
            <Input placeholder="Origem (ex: Site)" value={form.source} onChange={e => setForm({...form, source: e.target.value})} />
            <Input placeholder="Valor estimado (R$)" type="number" value={form.value} onChange={e => setForm({...form, value: e.target.value})} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
