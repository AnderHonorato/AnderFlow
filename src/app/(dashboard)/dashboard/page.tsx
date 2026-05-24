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
import { IconProject, IconFinancial, IconClient, IconAnalytics, IconPlus, IconChat, IconFile, IconCheck, IconArrowRight, IconKnowledge } from '@/components/icons'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const roleLevel = (session?.user as any)?.roleLevel || 0
  const isAdmin = roleLevel >= 80

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
    id: p.id,
    name: p.name,
    client: p.client,
    progress: p.progress,
    status: p.status,
  }))

  const activeProject = recentProjects.find((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')

  return (
    <div className="p-4 space-y-5 animate-page-enter">
      <OnboardingTip
        id="dashboard_welcome"
        title={isAdmin ? "Bem-vindo ao seu painel de controle" : "Bem-vindo ao ANDERFLOW"}
        description={isAdmin ? "Aqui voce ve tudo em tempo real." : "Solicite projetos e acompanhe o andamento."}
      />
      <PageHeader
        title={isAdmin ? "Painel de Controle" : `Ola, ${session?.user?.name?.split(' ')[0] || 'Cliente'}`}
        description={isAdmin ? "Visao geral da sua plataforma" : "Acompanhe seus projetos"}
      >
        <Button size="sm" asChild>
          <a href="/portal/briefing"><IconPlus className="w-[14px] h-[14px]" /> Novo Projeto</a>
        </Button>
      </PageHeader>

      {isAdmin && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      {!isAdmin && (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="bg-[var(--accent-subtle)] border-[var(--accent)]/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/15">
                  <IconProject className="w-[18px] h-[18px] text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-xl font-[500] text-[var(--text)]">{recentProjects.length}</p>
                  <p className="text-[11px] text-[var(--text-3)]">Projetos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[var(--success-subtle)] border-[var(--success)]/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success)]/15">
                  <IconCheck className="w-[18px] h-[18px] text-[var(--success)]" />
                </div>
                <div>
                  <p className="text-xl font-[500] text-[var(--text)]">{recentProjects.filter((p: any) => p.status === 'COMPLETED').length}</p>
                  <p className="text-[11px] text-[var(--text-3)]">Concluidos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[var(--info-subtle)] border-[var(--info)]/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--info)]/15">
                  <IconKnowledge className="w-[18px] h-[18px] text-[var(--info)]" />
                </div>
                <div>
                  <p className="text-xl font-[500] text-[var(--text)]">{recentProjects.filter((p: any) => p.status === 'IN_PROGRESS').length}</p>
                  <p className="text-[11px] text-[var(--text-3)]">Em andamento</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[var(--surface-2)] border-[var(--border)]">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent)]">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-[500] text-[var(--text)]">Como funciona?</h3>
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[12px] text-[var(--text-2)] flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[10px] font-[600] text-[var(--accent)] shrink-0">1</span>
                      Solicite um projeto preenchendo o briefing
                    </p>
                    <p className="text-[12px] text-[var(--text-2)] flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[10px] font-[600] text-[var(--accent)] shrink-0">2</span>
                      O desenvolvedor analisa e envia uma proposta
                    </p>
                    <p className="text-[12px] text-[var(--text-2)] flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[10px] font-[600] text-[var(--accent)] shrink-0">3</span>
                      Voce aceita, assina o contrato e o projeto inicia
                    </p>
                    <p className="text-[12px] text-[var(--text-2)] flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[10px] font-[600] text-[var(--accent)] shrink-0">4</span>
                      Acompanhe cada etapa em tempo real pelo portal
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button size="sm" asChild>
              <a href="/portal/briefing"><IconPlus className="w-[14px] h-[14px]" /> Novo Projeto</a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="/portal/chat"><IconChat className="w-[14px] h-[14px]" /> Falar com Desenvolvedor</a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="/knowledge"><IconKnowledge className="w-[14px] h-[14px]" /> Meu Conhecimento</a>
            </Button>
          </div>
        </>
      )}

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
        <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">
                {isAdmin ? "Projetos Recentes" : "Meus Projetos"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentProjects.length === 0 && (
                  <p className="text-[12px] text-[var(--text-3)] text-center py-6">Nenhum projeto ainda.</p>
                )}
                {recentProjects.map((project: any) => (
                  <div key={project.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--surface-hover)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {project.number && <span className="text-[10px] font-[500] text-[var(--text-3)]">{project.number}</span>}
                        <p className="text-[13px] font-[500] truncate">{project.name}</p>
                        <Badge status={project.status}>
                          {project.status === 'COMPLETED' ? 'Concluido' : project.status === 'REVIEW' ? 'Revisao' : project.status === 'PENDING' ? 'Solicitacao' : project.status === 'DRAFT' ? 'Rascunho' : 'Em andamento'}
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

        {isAdmin && (
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">A Receber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className={cn(
                  'flex items-center justify-between p-2 -mx-2 rounded-lg',
                  (data?.stats?.pendingRevenue || 0) > 0 && 'animate-balance-negative'
                )}>
                  <span className="text-[13px] text-[var(--text-2)]">Saldo pendente</span>
                  <span className={cn(
                    'text-[13px] font-[500]',
                    (data?.stats?.pendingRevenue || 0) > 0 ? 'text-[var(--destructive)]' : 'text-[var(--warning)]'
                  )}>
                    R$ {((data?.stats?.pendingRevenue || 0) / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className={cn(
                  'flex items-center justify-between p-2 -mx-2 rounded-lg',
                  (data?.stats?.paidThisMonth || 0) > 0 && 'animate-balance-positive'
                )}>
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
        )}
      </div>
    </div>
  )
}
