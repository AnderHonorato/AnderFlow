'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { DollarSign, Clock, TrendingUp, CreditCard, AlertCircle } from 'lucide-react'

export default function PortalFinancial() {
  const { data: session } = useSession()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payOpen, setPayOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

  useEffect(() => {
    fetch('/api/invoices', { credentials: 'include' })
      .then(r => r.json())
      .then(json => { setInvoices(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const pending = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((s, i) => s + (i.total || 0), 0)
  const paid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.total || 0), 0)
  const overdue = invoices.filter(i => i.status === 'OVERDUE')

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-page-enter">
      <div>
        <h2 className="text-[17px] font-[500] tracking-[-0.015em]">Financeiro</h2>
        <p className="text-[12px] text-[var(--text-3)] mt-1">Suas faturas e pagamentos</p>
      </div>

      {overdue.length > 0 && (
        <div className="p-3 rounded-lg bg-[var(--destructive-subtle)] border border-[var(--destructive)]/20 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-[var(--destructive)] shrink-0" />
          <div>
            <p className="text-[13px] font-[500] text-[var(--destructive)]">Voce tem {overdue.length} fatura(s) vencida(s)</p>
            <p className="text-[11px] text-[var(--text-3)]">Regularize para evitar bloqueios no servico</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--warning-subtle)]"><Clock className="h-5 w-5 text-[var(--warning)]" /></div>
          <div><p className="text-[17px] font-[500]">R$ {pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><p className="text-[11px] text-[var(--text-3)]">Pendente</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-subtle)]"><DollarSign className="h-5 w-5 text-[var(--success)]" /></div>
          <div><p className="text-[17px] font-[500]">R$ {paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><p className="text-[11px] text-[var(--text-3)]">Pago</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--info-subtle)]"><TrendingUp className="h-5 w-5 text-[var(--info)]" /></div>
          <div><p className="text-[17px] font-[500]">R$ {(pending + paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p><p className="text-[11px] text-[var(--text-3)]">Total</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Suas Faturas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--border)]">
            {invoices.length === 0 && (
              <p className="text-[13px] text-[var(--text-3)] text-center py-12">Nenhuma fatura disponivel</p>
            )}
            {invoices.map(i => (
              <div key={i.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-[500]">{i.number}</p>
                    <Badge status={i.status}>
                      {i.status === 'PAID' ? 'Pago' : i.status === 'SENT' ? 'Pendente' : i.status === 'OVERDUE' ? 'Vencido' : i.status === 'DRAFT' ? 'Rascunho' : i.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[var(--text-3)] mt-0.5">Vencimento: {i.dueDate ? new Date(i.dueDate).toLocaleDateString('pt-BR') : '-'}</p>
                  {i.project?.name && <p className="text-[11px] text-[var(--text-3)]">Projeto: {i.project.name}</p>}
                </div>
                <span className="text-[13px] font-[500] shrink-0">R$ {(i.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                {i.status !== 'PAID' && (
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { setSelectedInvoice(i); setPayOpen(true) }}>
                    <CreditCard className="w-[12px] h-[12px]" /> Pagar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pagar Fatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
              <p className="text-[13px] font-[500]">{selectedInvoice?.number}</p>
              <p className="text-[17px] font-[500] text-[var(--accent)] mt-1">R$ {(selectedInvoice?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[11px] text-[var(--text-3)] mt-1">Vencimento: {selectedInvoice?.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[12px] font-[500] text-[var(--text)]">Forma de pagamento</p>
              <div className="space-y-1.5">
                {['PIX', 'Cartao de Credito', 'Boleto'].map(method => (
                  <label key={method} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer">
                    <input type="radio" name="payment" className="accent-[var(--accent)]" />
                    <span className="text-[13px] text-[var(--text)]">{method}</span>
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-[var(--text-3)] mt-1">Pagamentos serao processados em breve. Voce recebera confirmacao por email.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success('Pagamento sera processado em breve!'); setPayOpen(false) }}>
              Confirmar pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
