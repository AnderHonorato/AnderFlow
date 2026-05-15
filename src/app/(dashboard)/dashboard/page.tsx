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
import {
  FolderKanban, DollarSign, Users, TrendingUp, Plus,
} from 'lucide-react'

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
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-6 w-36" /><Skeleton className="h-3 w-48 mt-1.5" /></div>
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
    { value: data?.stats?.activeProjects || 0, label: 'Projetos ativos', icon: <FolderKanban className="w-[16px] h-[16px]" /> },
    { value: `R$ ${((data?.stats?.totalRevenue || 0) / 1000).toFixed(0)}k`, label: 'Receita total', icon: <DollarSign className="w-[16px] h-[16px]" /> },
    { value: data?.stats?.activeClients || 0, label: 'Clientes ativos', icon: <Users className="w-[16px] h-[16px]" /> },
    { value: `${data?.stats?.conversionRate || 0}%`, label: 'Taxa conversão', icon: <TrendingUp className="w-[16px] h-[16px]" /> },
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
    <div className="p-4 space-y-5">
      <OnboardingTip
        id="dashboard_welcome"
        title="Bem-vindo ao seu painel de controle"
        description="Aqui você vê tudo em tempo real: projetos ativos, receita, clientes e notificações."
      />
      <PageHeader
        title="Painel de Controle"
        description="Visão geral da sua plataforma"
      >
        <Button size="sm" asChild>
          <a href="/portal/briefing"><Plus className="mr-1.5 h-3.5 w-3.5" /> Novo Projeto</a>
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-subtle)]">
              <FolderKanban className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text)] truncate">{activeProject.name}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Em andamento — {activeProject.progress}% concluído
              </p>
            </div>
            <Progress value={activeProject.progress} className="h-1.5 w-24" />
            <Button size="sm" variant="ghost" asChild className="h-7 text-xs shrink-0">
              <a href={`/projects/${activeProject.id}`}>Ver projeto</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Projetos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentProjects.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-center py-6">Nenhum projeto ainda.</p>
                )}
                {recentProjects.map((project: any) => (
                  <div key={project.name} className="flex items-center gap-3 rounded px-2 py-2 transition-colors hover:bg-[var(--surface-hover)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <Badge variant={project.status === 'COMPLETED' ? 'success' : project.status === 'REVIEW' ? 'warning' : 'info'} className="text-2xs">
                          {project.status === 'COMPLETED' ? 'Concluído' : project.status === 'REVIEW' ? 'Revisão' : 'Em andamento'}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{project.client}</p>
                    </div>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress value={project.progress} className="h-1 flex-1" />
                      <span className="text-2xs text-[var(--text-muted)] w-6">{project.progress}%</span>
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
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Saldo pendente</span>
                  <span className="text-sm font-medium text-[var(--warning)]">
                    R$ {((data?.stats?.pendingRevenue || 0) / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Recebido este mês</span>
                  <span className="text-sm font-medium text-[var(--success)]">
                    R$ {((data?.stats?.paidThisMonth || 0) / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notificações</span>
                  <span className="text-sm font-medium">{data?.stats?.unreadNotifications || 0} não lidas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
