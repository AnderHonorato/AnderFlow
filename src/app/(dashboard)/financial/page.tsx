'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, Search, DollarSign, TrendingUp, Clock, MoreHorizontal, Loader2, ArrowUpRight, ReceiptText as ReceiptIcon, Download, QrCode, Copy,
} from 'lucide-react'

export default function FinancialPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ clientName: '', projectName: '', amount: '', dueDate: '', notes: '', clientId: '', isRecurring: false })

  const [hoursData, setHoursData] = useState<any>(null)
  const [hoursLoading, setHoursLoading] = useState(true)
  const [hoursStartDate, setHoursStartDate] = useState('')
  const [hoursEndDate, setHoursEndDate] = useState('')
  const [hoursClientFilter, setHoursClientFilter] = useState('')
  const [hoursBillableOnly, setHoursBillableOnly] = useState(true)
  const [activeTab, setActiveTab] = useState<'invoices' | 'hours'>('invoices')
  const [pixOpen, setPixOpen] = useState(false)
  const [pixInvoiceId, setPixInvoiceId] = useState<string | null>(null)
  const [pixData, setPixData] = useState<{ pixPayload: string; qrCodeBase64: string; amount: number } | null>(null)
  const [pixLoading, setPixLoading] = useState(false)

  const loadInvoices = useCallback(() => {
    fetch('/api/invoices')
      .then(r => r.json())
      .then(json => { setInvoices(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const loadHours = useCallback(() => {
    setHoursLoading(true)
    const params = new URLSearchParams()
    params.set('billable', String(hoursBillableOnly))
    if (hoursClientFilter) params.set('clientId', hoursClientFilter)
    if (hoursStartDate) params.set('startDate', hoursStartDate)
    if (hoursEndDate) params.set('endDate', hoursEndDate)

    fetch(`/api/reports/hours?${params.toString()}`)
      .then(r => r.json())
      .then(json => { setHoursData(json.data || {}); setHoursLoading(false) })
      .catch(() => setHoursLoading(false))
  }, [hoursStartDate, hoursEndDate, hoursClientFilter, hoursBillableOnly])

  useEffect(() => {
    loadInvoices()
    loadHours()
    fetch('/api/clients')
      .then(r => r.json())
      .then(json => setClients(json.data || []))
      .catch(() => {})
  }, [loadInvoices, loadHours])

  const handleCreate = async () => {
    setSaving(true)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ description: form.notes || 'Serviço', quantity: 1, price: parseFloat(form.amount) }],
        dueDate: form.dueDate || new Date().toISOString(),
        notes: form.notes,
        clientId: form.clientId,
        projectId: null,
        isRecurring: form.isRecurring,
      }),
    })
    if (res.ok) { toast.success('Fatura criada'); setShowNew(false); loadInvoices(); setForm({ clientName: '', projectName: '', amount: '', dueDate: '', notes: '', clientId: '', isRecurring: false }) }
    else toast.error('Erro ao criar fatura')
    setSaving(false)
  }

  const handleExportCsv = () => {
    if (!hoursData?.entries?.length) return
    const headers = ['Data', 'Profissional', 'Projeto', 'Cliente', 'Tarefa', 'Horas', 'Faturável', 'Valor']
    const rows = hoursData.entries.map((e: any) => [
      new Date(e.date).toLocaleDateString('pt-BR'),
      e.user?.name || '',
      e.project?.name || '',
      e.project?.client?.name || '',
      e.task?.title || '',
      e.hours,
      e.billable ? 'Sim' : 'Não',
      `R$ ${(e.hours * 120).toFixed(2)}`,
    ])
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `horas-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const totalPending = invoices.filter(i => i.status === 'SENT' || i.status === 'PENDING').reduce((s, i) => s + i.total, 0)
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0)
  const totalOverdue = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + i.total, 0)

  if (loading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}</div><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 space-y-6">
      <OnboardingTip
        id="financial_tip"
        title="Controle Financeiro"
        description="Acompanhe faturas, pagamentos e relatorio de horas. Clique 'Nova Fatura' para gerar cobranca."
      />
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-medium">Financeiro</h1><p className="text-sm text-muted-foreground mt-1">{invoices.length} faturas</p></div>
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="mr-2 h-4 w-4" /> Nova Fatura</Button>
      </div>

      <div className="flex gap-1 border-b border-[var(--border)] mb-4">
        <button onClick={() => setActiveTab('invoices')} className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'invoices' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-3)] hover:text-[var(--text)]'}`}>Faturas</button>
        <button onClick={() => setActiveTab('hours')} className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'hours' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-3)] hover:text-[var(--text)]'}`}>Relatorio de Horas</button>
      </div>

      {activeTab === 'invoices' && (
      <div className="space-y-6">
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
                    {i.status === 'PAID' && (
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/api/invoices/${i.id}/receipt`, '_blank')} className="h-6 text-[10px]">
                        <ReceiptIcon className="w-3 h-3" /> Recibo
                      </Button>
                    )}
                    {(i.status === 'SENT' || i.status === 'DRAFT' || i.status === 'OVERDUE') && (
                      <Button variant="outline" size="sm" onClick={() => { setPixInvoiceId(i.id); setPixOpen(true); setPixData(null) }} className="h-7 text-[11px]">
                        <QrCode className="w-[12px] h-[12px]" /> Pix
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => router.push(`/financial/${i.id}`)}>Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={async () => {
                          await fetch(`/api/invoices/${i.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CANCELLED' }) })
                          toast.success('Fatura arquivada'); loadInvoices()
                        }}>Arquivar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'hours' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input type="date" value={hoursStartDate} onChange={e => setHoursStartDate(e.target.value)} className="w-auto" />
            <span className="text-xs text-muted-foreground">até</span>
            <Input type="date" value={hoursEndDate} onChange={e => setHoursEndDate(e.target.value)} className="w-auto" />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={hoursClientFilter}
              onChange={e => setHoursClientFilter(e.target.value)}
            >
              <option value="">Todos clientes</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={hoursBillableOnly} onChange={e => setHoursBillableOnly(e.target.checked)} className="rounded" />
              Apenas faturáveis
            </label>
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-8 text-[11px] ml-auto">
              <Download className="mr-1 h-3 w-3" /> Exportar CSV
            </Button>
          </div>

          {hoursLoading ? (
            <Card><CardContent className="p-8"><Skeleton className="h-64" /></CardContent></Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card><CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Horas</p>
                  <p className="text-2xl font-bold">{hoursData?.summary?.totalHours?.toFixed(1) || 0}h</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Valor Faturável</p>
                  <p className="text-2xl font-bold">R$ {(hoursData?.summary?.totalBillable || 0).toLocaleString('pt-BR')}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Registros</p>
                  <p className="text-2xl font-bold">{hoursData?.entries?.length || 0}</p>
                </CardContent></Card>
              </div>

              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Profissional</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Projeto</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Tarefa</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Horas</th>
                        <th className="text-center p-3 font-medium text-muted-foreground">Faturável</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!hoursData?.entries || hoursData.entries.length === 0) && (
                        <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum registro de horas encontrado</td></tr>
                      )}
                      {(hoursData?.entries || []).map((entry: any) => (
                        <tr key={entry.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)]">
                          <td className="p-3">{new Date(entry.date).toLocaleDateString('pt-BR')}</td>
                          <td className="p-3">{entry.user?.name}</td>
                          <td className="p-3">{entry.project?.client?.name} — {entry.project?.name}</td>
                          <td className="p-3 text-muted-foreground">{entry.task?.title || '-'}</td>
                          <td className="p-3 text-right font-mono">{entry.hours}h</td>
                          <td className="p-3 text-center">{entry.billable ? '✓' : '-'}</td>
                          <td className="p-3 text-right font-mono">R$ {(entry.hours * 120).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[var(--border)] font-bold">
                        <td colSpan={4} className="p-3 text-right text-muted-foreground">Totais:</td>
                        <td className="p-3 text-right font-mono">{(hoursData?.summary?.totalHours || 0).toFixed(1)}h</td>
                        <td className="p-3" />
                        <td className="p-3 text-right font-mono">R$ {(hoursData?.summary?.totalBillable || 0).toLocaleString('pt-BR')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Fatura</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.clientId}
              onChange={e => setForm({...form, clientId: e.target.value})}
            >
              <option value="">Selecionar cliente...</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
              ))}
            </select>
            <Input placeholder="Valor (R$) *" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            <Input placeholder="Vencimento" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
            <Input placeholder="Descrição" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="isRecurring"
                checked={form.isRecurring}
                onCheckedChange={(v) => setForm({...form, isRecurring: !!v})}
              />
              <Label htmlFor="isRecurring" className="text-[12px] cursor-pointer">Fatura recorrente (mensalidade)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !form.amount || !form.clientId}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pixOpen} onOpenChange={setPixOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>QR Code PIX</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {!pixData && !pixLoading && (
              <p className="text-[12px] text-[var(--text-3)] text-center">Clique para gerar o QR Code PIX desta fatura</p>
            )}
            <div className="flex flex-col items-center gap-3">
              <Button
                variant="outline"
                className="w-full h-9 text-[12px] gap-2"
                onClick={async () => {
                  setPixLoading(true)
                  try {
                    const res = await fetch(`/api/invoices/${pixInvoiceId}/pix`)
                    const json = await res.json()
                    if (json.data) {
                      setPixData(json.data)
                    } else {
                      toast.error(json.error || 'Erro ao gerar PIX')
                    }
                  } catch {
                    toast.error('Erro ao gerar QR Code PIX')
                  }
                  setPixLoading(false)
                }}
                disabled={pixLoading}
              >
                <QrCode className="h-4 w-4" />
                {pixLoading ? 'Gerando...' : pixData ? 'Regenerar QR Code' : 'Gerar QR Code PIX'}
              </Button>
              {pixData && (
                <>
                  <div className="bg-white p-3 rounded-xl border border-[var(--border)]">
                    <Image src={pixData.qrCodeBase64} alt="QR Code PIX" width={224} height={224} unoptimized />
                  </div>
                  <p className="text-[17px] font-[600] text-[var(--accent)]">R$ {(pixData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <div className="w-full space-y-1.5">
                    <p className="text-[11px] text-[var(--text-3)]">Codigo PIX (copie e cole):</p>
                    <div className="flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2">
                      <code className="flex-1 text-[10px] text-[var(--text)] break-all select-all">{pixData.pixPayload}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(pixData.pixPayload)
                          toast.success('Codigo PIX copiado!')
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPixOpen(false); setPixData(null) }}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
