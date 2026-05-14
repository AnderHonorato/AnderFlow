'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import {
  FolderKanban,
  DollarSign,
  Users,
  TrendingUp,
  ArrowUpRight,
  Plus,
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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-32 mt-2" /></div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  const stats = [
    { title: 'Projetos Ativos', value: data?.stats?.activeProjects || 0, change: `+${data?.stats?.completedProjects || 0} concluídos`, trend: 'up', icon: FolderKanban, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Receita Total', value: `R$ ${((data?.stats?.totalRevenue || 0) / 1000).toFixed(0)}k`, change: `R$ ${((data?.stats?.paidThisMonth || 0) / 1000).toFixed(0)}k este mês`, trend: 'up', icon: DollarSign, color: 'text-success', bg: 'bg-success/10' },
    { title: 'Clientes Ativos', value: data?.stats?.activeClients || 0, change: `+${(data?.stats?.totalClients || 0) - (data?.stats?.activeClients || 0)}`, trend: 'up', icon: Users, color: 'text-info', bg: 'bg-info/10' },
    { title: 'Taxa Conversão', value: `${data?.stats?.conversionRate || 0}%`, change: 'projetos/cliente', trend: 'up', icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10' },
  ]

  const recentProjects = (data?.recentProjects || []).map((p: any) => ({
    name: p.name,
    client: p.client,
    progress: p.progress,
    status: p.status,
  }))

  return (
    <div className="p-6 space-y-6">
      <OnboardingTip
        id="dashboard_welcome"
        title="Bem-vindo ao seu painel de controle"
        description="Aqui você vê tudo em tempo real: projetos ativos, receita, clientes e notificações. Use o menu lateral para navegar entre os módulos."
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel de Controle</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral da sua plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" asChild>
            <a href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-success">
                  <ArrowUpRight className="h-3 w-3" />
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-medium">Projetos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto ainda. Crie seu primeiro projeto!</p>
                )}
                {recentProjects.map((project: any) => (
                  <div key={project.name} className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <Badge variant={project.status === 'COMPLETED' ? 'success' : project.status === 'REVIEW' ? 'warning' : 'info'} className="text-2xs">
                          {project.status === 'COMPLETED' ? 'Concluído' : project.status === 'REVIEW' ? 'Revisão' : 'Em andamento'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
                    </div>
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <Progress value={project.progress} className="h-1.5 flex-1" />
                      <span className="text-xs font-medium text-muted-foreground w-8">{project.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">A Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Saldo pendente</span>
                  <span className="text-lg font-semibold text-warning">
                    R$ {((data?.stats?.pendingRevenue || 0) / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Recebido este mês</span>
                  <span className="text-lg font-semibold text-success">
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
