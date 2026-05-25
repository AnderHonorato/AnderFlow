'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Crown, DollarSign, TrendingUp, Users,
  Star, AlertTriangle, Target,
} from 'lucide-react'

export default function FounderPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = session?.user as any
    if (!user || user.roleLevel < 100) {
      router.push('/dashboard')
      return
    }
    fetch('/api/analytics/founder')
      .then(r => r.json())
      .then(json => setData(json.data))
      .finally(() => setLoading(false))
  }, [session, router])

  if (loading) return (
    <div className="p-6 space-y-4" style={{ background: '#060608', minHeight: '100vh' }}>
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
    </div>
  )

  const d = data || {}

  return (
    <div style={{ background: '#060608', minHeight: '100vh', color: '#e0e0e0' }}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6" style={{ color: 'rgba(200,160,60,1)' }} />
            <div>
              <h1 className="text-xl font-semibold">Visao do Fundador</h1>
              <p className="text-sm text-muted-foreground">Painel estrategico ANDERFLOW</p>
            </div>
          </div>
        </div>

        {/* MRR & Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,160,60,0.15)', borderWidth: 1 }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">MRR</span>
                <DollarSign className="h-4 w-4" style={{ color: 'rgba(200,160,60,0.7)' }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: '#fff' }}>R$ {(d.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`h-3 w-3 ${d.mrrGrowth >= 0 ? 'text-success' : 'text-destructive'}`} />
                <span className={`text-xs ${d.mrrGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>{d.mrrGrowth || 0}% vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,160,60,0.15)', borderWidth: 1 }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Clientes Ativos</span>
                <Users className="h-4 w-4" style={{ color: 'rgba(200,160,60,0.7)' }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: '#fff' }}>{d.activeClients || 0}</p>
              <span className="text-xs text-success mt-1 block">+{d.newClientsThisMonth || 0} este mes</span>
            </CardContent>
          </Card>

          <Card style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,160,60,0.15)', borderWidth: 1 }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">NPS</span>
                <Star className="h-4 w-4" style={{ color: 'rgba(200,160,60,0.7)' }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: '#fff' }}>{d.npsAverage || 0}</p>
              <span className="text-xs text-muted-foreground mt-1 block">media geral</span>
            </CardContent>
          </Card>

          <Card style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,160,60,0.15)', borderWidth: 1 }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Receita YTD</span>
                <Target className="h-4 w-4" style={{ color: 'rgba(200,160,60,0.7)' }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: '#fff' }}>R$ {(d.revenueYTD || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              <span className="text-xs text-muted-foreground mt-1 block">Projecao: R$ {d.revenueProjection?.toLocaleString('pt-BR') || 0}</span>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Clients */}
          <Card style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,160,60,0.15)', borderWidth: 1 }}>
            <CardHeader><CardTitle className="text-sm" style={{ color: '#fff' }}>Top 5 Clientes por Receita</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(d.topClients || []).map((client: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xs font-bold w-5" style={{ color: 'rgba(200,160,60,0.6)' }}>#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#fff' }}>{client.name}</p>
                        <p className="text-2xs text-muted-foreground">{client.projects || 0} projetos</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: '#4ade80' }}>
                      R$ {client.revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 0 }) || 0}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(200,160,60,0.15)', borderWidth: 1 }}>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2" style={{ color: '#fff' }}>
              <AlertTriangle className="h-4 w-4 text-warning" /> Alertas do Dia
            </CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(d.alerts || []).length === 0 && <p className="text-xs text-success">Nenhum alerta critico. Tudo em ordem!</p>}
                {(d.alerts || []).map((alert: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,100,100,0.05)' }}>
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    <span className="text-xs text-muted-foreground">{alert}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Projetos ativos</span>
                  <span style={{ color: '#fff' }}>{d.activeProjects || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Concluidos este mes</span>
                  <span style={{ color: '#fff' }}>{d.completedThisMonth || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Utilizacao da equipe</span>
                  <span style={{ color: '#fff' }}>{d.teamUtilization || 0}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">LTV estimado</span>
                  <span style={{ color: '#fff' }}>R$ {d.ltv?.toLocaleString('pt-BR') || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
