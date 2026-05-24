'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Database, Mail, MessageCircle, Cpu, Server } from 'lucide-react'

export default function HealthPage() {
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = () => {
    setLoading(true)
    fetch('/api/health')
      .then(r => r.json())
      .then(json => { setHealth(json.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !health) return <PageWrapper><div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div></div></PageWrapper>

  const statusIcon = (s: string) => s === 'operational' ? <CheckCircle className="h-4 w-4 text-[var(--success)]" /> : s === 'degraded' ? <AlertTriangle className="h-4 w-4 text-[var(--warning)]" /> : <XCircle className="h-4 w-4 text-[var(--destructive)]" />
  const statusColor = (s: string) => s === 'operational' ? 'var(--success)' : s === 'degraded' ? 'var(--warning)' : 'var(--destructive)'

  return (
    <PageWrapper>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-lg font-medium">Saúde do Sistema</h1><p className="text-sm text-muted-foreground mt-1">Monitoramento em tempo real</p></div>
          <Button variant="outline" size="sm" onClick={fetchHealth}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" />Banco de Dados</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">{statusIcon(health?.db?.status || 'outage')}<span className="text-sm font-medium" style={{ color: statusColor(health?.db?.status) }}>{health?.db?.status === 'operational' ? 'Operacional' : 'Indisponível'}</span></div>
              {health?.db?.latencyMs != null && <p className="text-xs text-muted-foreground">Latência: {health.db.latencyMs}ms</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4" />Sistema</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm">Uptime: <span className="font-mono">{health?.uptime || 'N/A'}</span></p>
              <p className="text-xs text-muted-foreground mt-1">Versão: {health?.version || 'N/A'}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Serviços</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health?.services?.map((s: any) => (
                <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]">
                  <div className="flex items-center gap-3">
                    {s.name.includes('Email') ? <Mail className="h-4 w-4 text-muted-foreground" /> : s.name.includes('IA') ? <Cpu className="h-4 w-4 text-muted-foreground" /> : <MessageCircle className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm">{s.name}</span>
                  </div>
                  <Badge variant={s.status === 'operational' ? 'success' : 'warning'}>{s.status === 'operational' ? 'Configurado' : 'Não configurado'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">Última verificação: {health?.timestamp ? new Date(health.timestamp).toLocaleString('pt-BR') : 'N/A'}</p>
      </div>
    </PageWrapper>
  )
}
