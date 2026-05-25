'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface MRRData {
  mrr: number
  mrrChange: number
  churnRate: number
  ltv: number
  recurringClients: number
  history: { month: string; value: number }[]
  projection: { month: string; value: number }[]
  upcomingRenewals: { id: string; clientName: string; company: string | null; amount: number; dueDate: string }[]
}

export default function MRRPage() {
  const { data: session } = useSession()
  const roleLevel = (session?.user as any)?.roleLevel || 0
  const [data, setData] = useState<MRRData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (roleLevel < 80) return
    fetch('/api/analytics/mrr')
      .then(r => r.json())
      .then(json => { setData(json.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [roleLevel])

  if (loading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-64" /></div>
  if (!data) return null

  const chartData = [...data.history, ...data.projection.map(p => ({ ...p, projected: true }))]

  return (
    <div className="p-6 space-y-6 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--accent)]" /> Receita Recorrente (MRR)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Metricas de receita mensal recorrente</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wider">MRR Atual</p>
            <p className="text-[24px] font-[600] text-[var(--text)] mt-1">R$ {data.mrr.toLocaleString('pt-BR')}</p>
            <div className="flex items-center gap-1 mt-1">
              {data.mrrChange >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-[var(--success)]" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-[var(--destructive)]" />
              )}
              <span className={`text-[11px] font-[500] ${data.mrrChange >= 0 ? 'text-[var(--success)]' : 'text-[var(--destructive)]'}`}>
                {data.mrrChange >= 0 ? '+' : ''}{data.mrrChange}%
              </span>
              <span className="text-[10px] text-[var(--text-3)]">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wider">Churn Rate</p>
            <p className="text-[24px] font-[600] text-[var(--text)] mt-1">{data.churnRate}%</p>
            <p className="text-[10px] text-[var(--text-3)] mt-1">Clientes que cancelaram recorrencia</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wider">LTV Medio</p>
            <p className="text-[24px] font-[600] text-[var(--text)] mt-1">R$ {data.ltv.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-[var(--text-3)] mt-1">Valor vitalicio por cliente</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] text-[var(--text-3)] uppercase tracking-wider">Clientes Recorrentes</p>
            <p className="text-[24px] font-[600] text-[var(--text)] mt-1">{data.recurringClients}</p>
            <p className="text-[10px] text-[var(--text-3)] mt-1">Com contratos ativos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-[500]">Evolucao do MRR (12 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" fontSize={11} stroke="var(--text-3)" />
              <YAxis fontSize={11} stroke="var(--text-3)" tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
              />
              <Area type="monotone" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {data.upcomingRenewals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-[500] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
              Renovacoes nos proximos 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[var(--border)]">
              {data.upcomingRenewals.map(r => (
                <div key={r.id} className="flex items-center gap-4 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-[500]">{r.clientName}</p>
                    <p className="text-[11px] text-[var(--text-3)]">{r.company || 'Sem empresa'}</p>
                  </div>
                  <p className="text-[13px] font-[600]">R$ {r.amount.toLocaleString('pt-BR')}</p>
                  <p className="text-[11px] text-[var(--text-3)] w-24 text-right">{new Date(r.dueDate).toLocaleDateString('pt-BR')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
