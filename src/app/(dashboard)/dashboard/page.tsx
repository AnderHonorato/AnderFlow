'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import { IconProject, IconFinancial, IconClient, IconAnalytics, IconPlus } from '@/components/icons'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-4 space-y-5 animate-page-enter">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-5 w-36" /><Skeleton className="h-3 w-48 mt-1.5" /></div>
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[52px]" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5"><Skeleton className="h-52" /><Skeleton className="h-40" /></div>
          <div className="space-y-5"><Skeleton className="h-52" /><Skeleton className="h-40" /></div>
        </div>
      </div>
    )
  }

  const stats = [
    { value: data?.stats?.activeProjects || 0, label: 'Projetos ativos', icon: <IconProject className="w-[16px] h-[16px]" /> },
    { value: `R$ ${((data?.stats?.totalRevenue || 0) / 1000).toFixed(0)}k`, label: 'Receita total', icon: <IconFinancial className="w-[16px] h-[16px]" /> },
    { value: data?.stats?.activeClients || 0, label: 'Clientes ativos', icon: <IconClient className="w-[16px] h-[16px]" /> },
    { value: `${data?.stats?.conversionRate || 0}%`, label: 'Taxa conversao', icon: <IconAnalytics className="w-[16px] h-[16px]" /> },
  ]

  const recentProjects = (data?.recentProjects || []).map((p: any) => ({
    name: p.name,
    client: p.client,
    progress: p.progress,
    status: p.status,
    id: p.id,
  }))

  const activeProject = recentProjects.find((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')

  return (
    <div className="p-4 space-y-5 animate-page-enter">
      <OnboardingTip
        id="dashboard_welcome"
        title="Bem-vindo ao seu painel de controle"
        description="Aqui voce ve tudo em tempo real: projetos ativos, receita, clientes e notificacoes."
      />
      <PageHeader
        title="Painel de Controle"
        description="Visao geral da sua plataforma"
      >
        <Button size="sm" asChild>
          <a href="/portal/briefing"><IconPlus className="w-[14px] h-[14px]" /> Novo Projeto</a>
        </Button>
      </PageHeader>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {activeProject && (
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-subtle)]">
              <IconProject className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[500] text-[var(--text)] truncate">{activeProject.name}</p>
              <p className="text-[12px] text-[var(--text-3)] mt-0.5">
                Em andamento — {activeProject.progress}% concluido
              </p>
            </div>
            <Progress value={activeProject.progress} className="h-[2px] w-24" />
            <Button size="sm" variant="ghost" asChild className="h-7 text-[11px] shrink-0">
              <a href={`/projects/${activeProject.id}`}>Ver projeto</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Projetos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentProjects.length === 0 && (
                  <p className="text-[12px] text-[var(--text-3)] text-center py-6">Nenhum projeto ainda.</p>
                )}
                {recentProjects.map((project: any) => (
                  <div key={project.name} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--surface-hover)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-[500] truncate">{project.name}</p>
                        <Badge status={project.status}>
                          {project.status === 'COMPLETED' ? 'Concluido' : project.status === 'REVIEW' ? 'Revisao' : project.status === 'DRAFT' ? 'Rascunho' : 'Em andamento'}
                        </Badge>
                      </div>
                      <p className="text-[12px] text-[var(--text-3)] mt-0.5">{project.client}</p>
                    </div>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress value={project.progress} className="h-[2px] flex-1" />
                      <span className="text-[11px] text-[var(--text-3)] w-6">{project.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">A Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[var(--text-2)]">Saldo pendente</span>
                  <span className="text-[13px] font-[500] text-[var(--warning)]">
                    R$ {((data?.stats?.pendingRevenue || 0) / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[var(--text-2)]">Recebido este mes</span>
                  <span className="text-[13px] font-[500] text-[var(--success)]">
                    R$ {((data?.stats?.paidThisMonth || 0) / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[var(--text-2)]">Notificacoes</span>
                  <span className="text-[13px] font-[500]">{data?.stats?.unreadNotifications || 0} nao lidas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
