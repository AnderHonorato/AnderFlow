'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import {
  Plus, Search, Mail, Building2, ArrowUpRight, Loader2,
} from 'lucide-react'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', phone: '' })

  const loadClients = () => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(json => { setClients(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadClients() }, [])

  const handleCreate = async () => {
    setSaving(true)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Cliente criado')
      setShowNew(false)
      setForm({ name: '', email: '', password: '', company: '', phone: '' })
      loadClients()
    } else {
      toast.error('Erro ao criar cliente')
    }
    setSaving(false)
  }

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.company || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid gap-4 grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 space-y-6">
      <OnboardingTip
        id="clients_tip"
        title="Gestão de Clientes"
        description="Cadastre seus clientes, veja projetos vinculados e acompanhe o plano de cada um. Use 'Novo Cliente' para adicionar."
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{clients.length} clientes cadastrados</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{clients.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{clients.filter(c => c.isActive).length}</p><p className="text-xs text-muted-foreground">Ativos</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{clients.filter(c => c.plan === 'PRO').length}</p><p className="text-xs text-muted-foreground">Plano Pro</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{clients.reduce((sum, c) => sum + (c._count?.projects || 0), 0)}</p><p className="text-xs text-muted-foreground">Projetos</p></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <Avatar className="h-10 w-10"><AvatarFallback>{c.name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{c.name}</p>
                    <Badge variant={c.plan === 'ENTERPRISE' ? 'default' : c.plan === 'PRO' ? 'info' : 'secondary'} className="text-2xs">{c.plan}</Badge>
                    {c.isOnline && <span className="h-2 w-2 rounded-full bg-success" />}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />{c.company || 'Sem empresa'}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center"><span className="font-medium">{c._count?.projects || 0}</span><p className="text-2xs text-muted-foreground">Projetos</p></div>
                  <Button variant="ghost" size="icon-sm"><ArrowUpRight className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <Input placeholder="Email *" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <Input placeholder="Senha *" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            <Input placeholder="Empresa" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
            <Input placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.email || !form.password}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
