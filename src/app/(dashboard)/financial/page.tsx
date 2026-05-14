'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Plus, Search, DollarSign, TrendingUp, Clock, MoreHorizontal, Loader2, ArrowUpRight,
} from 'lucide-react'

export default function FinancialPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ clientName: '', projectName: '', amount: '', dueDate: '', notes: '' })

  const loadInvoices = () => {
    fetch('/api/invoices')
      .then(r => r.json())
      .then(json => { setInvoices(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadInvoices() }, [])

  const handleCreate = async () => {
    setSaving(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ description: form.notes || 'Serviço', quantity: 1, price: parseFloat(form.amount) }],
        dueDate: form.dueDate || new Date().toISOString(),
        notes: form.notes,
        clientId: 'cm1_example',
        projectId: null,
      }),
    })
    if (res.ok) { toast.success('Fatura criada'); setShowNew(false); loadInvoices(); setForm({ clientName: '', projectName: '', amount: '', dueDate: '', notes: '' }) }
    else toast.error('Erro ao criar fatura')
    setSaving(false)
  }

  const totalPending = invoices.filter(i => i.status === 'SENT' || i.status === 'PENDING').reduce((s, i) => s + i.total, 0)
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0)
  const totalOverdue = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + i.total, 0)

  if (loading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 space-y-6">
      <OnboardingTip
        id="financial_tip"
        title="Controle Financeiro"
        description="Acompanhe faturas, pagamentos e saldo pendente. Clique 'Nova Fatura' para gerar uma cobrança para o cliente."
      />
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1><p className="text-sm text-muted-foreground mt-1">{invoices.length} faturas</p></div>
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" /> Nova Fatura</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><DollarSign className="h-5 w-5 text-success" /></div><div><p className="text-xl font-semibold">R$ {totalPaid.toLocaleString('pt-BR')}</p><p className="text-xs text-muted-foreground">Recebido</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-xl font-semibold">R$ {totalPending.toLocaleString('pt-BR')}</p><p className="text-xs text-muted-foreground">Pendente</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><TrendingUp className="h-5 w-5 text-info" /></div><div><p className="text-xl font-semibold">{invoices.length}</p><p className="text-xs text-muted-foreground">Total Faturas</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><ArrowUpRight className="h-5 w-5 text-destructive" /></div><div><p className="text-xl font-semibold">R$ {totalOverdue.toLocaleString('pt-BR')}</p><p className="text-xs text-muted-foreground">Vencido</p></div></CardContent></Card>
      </div>

      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar faturas..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {invoices.map(i => (
              <div key={i.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{i.number}</p>
                  <p className="text-xs text-muted-foreground">{i.client?.name} {i.client?.company ? `(${i.client.company})` : ''}</p>
                </div>
                <span className="text-sm font-semibold">R$ {i.total.toLocaleString('pt-BR')}</span>
                <span className="text-xs text-muted-foreground w-28">{new Date(i.dueDate).toLocaleDateString('pt-BR')}</span>
                <Badge variant={i.status === 'PAID' ? 'success' : i.status === 'OVERDUE' ? 'destructive' : 'warning'} className="text-2xs">
                  {i.status === 'PAID' ? 'Pago' : i.status === 'SENT' ? 'Pendente' : i.status === 'OVERDUE' ? 'Vencido' : i.status}
                </Badge>
                <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Fatura</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Valor (R$) *" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            <Input placeholder="Vencimento" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
            <Input placeholder="Descrição" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !form.amount}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
