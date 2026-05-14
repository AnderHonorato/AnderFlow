'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, Clock, TrendingUp } from 'lucide-react'

export default function PortalFinancial() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invoices')
      .then(r => r.json())
      .then(json => { setInvoices(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const pending = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.total, 0)
  const paid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0)

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Financeiro</h2>
        <p className="text-sm text-muted-foreground mt-1">Suas faturas e pagamentos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
          <div><p className="text-xl font-semibold">R$ {pending.toLocaleString('pt-BR')}</p><p className="text-xs text-muted-foreground">Pendente</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><DollarSign className="h-5 w-5 text-success" /></div>
          <div><p className="text-xl font-semibold">R$ {paid.toLocaleString('pt-BR')}</p><p className="text-xs text-muted-foreground">Pago</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><TrendingUp className="h-5 w-5 text-info" /></div>
          <div><p className="text-xl font-semibold">R$ {(pending + paid).toLocaleString('pt-BR')}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Faturas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {invoices.map(i => (
              <div key={i.id} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{i.number}</p>
                  <p className="text-xs text-muted-foreground">Vencimento: {new Date(i.dueDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="text-sm font-semibold">R$ {i.total.toLocaleString('pt-BR')}</span>
                <Badge variant={i.status === 'PAID' ? 'success' : i.status === 'OVERDUE' ? 'destructive' : 'warning'} className="text-2xs">
                  {i.status === 'PAID' ? 'Pago' : i.status === 'SENT' ? 'Pendente' : i.status === 'OVERDUE' ? 'Vencido' : i.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
