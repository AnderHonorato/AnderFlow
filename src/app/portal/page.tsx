'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { IconProject, IconCheck, IconAnalytics, IconPlus, IconFinancial, IconNotification, IconArrowRight } from '@/components/icons'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return 'Boa noite'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function PortalDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Ola')

  useEffect(() => { setGreeting(getGreeting()) }, [])

  const firstName = session?.user?.name?.split(' ')[0] || 'Cliente'

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [projRes, invRes, notifRes] = await Promise.all([
          fetch('/api/projects', { credentials: 'include' }),
          fetch('/api/invoices', { credentials: 'include' }),
          fetch('/api/notifications', { credentials: 'include' }),
        ])
        const projJson = await projRes.json()
        const invJson = await invRes.json()
        const notifJson = await notifRes.json()
        setProjects(projJson.data || [])
        setInvoices(invJson.data || [])
        setNotifications((notifJson.data || []).slice(0, 5))
      } catch {}
      setLoading(false)
    }
    loadAll()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const active = projects.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length
  const completed = projects.filter((p: any) => p.status === 'COMPLETED').length
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((s: number, p: any) => s + (p.progress || 0), 0) / projects.length)
    : 0

  const pendingInvoices = invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED')
  const pendingTotal = pendingInvoices.reduce((s: number, i: any) => s + (i.total || 0), 0)
  const overdueCount = invoices.filter((i: any) => i.status === 'OVERDUE').length

  return (
    <div className="p-6 space-y-5 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-[500] tracking-[-0.015em]">
            {greeting}, {firstName}
          </h2>
          <p className="text-[12px] text-[var(--text-3)] mt-1">
            Veja aqui o resumo dos projetos solicitados por voce
          </p>
        </div>
        <Button size="sm" asChild>
          <a href="/portal/briefing">
            <IconPlus className="w-[14px] h-[14px]" /> Solicitar Projeto
          </a>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-subtle)]"><IconProject className="w-[16px] h-[16px] text-[var(--accent)]" /></div>
          <div><p className="text-[17px] font-[500]">{active}</p><p className="text-[11px] text-[var(--text-3)]">Projetos ativos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--success-subtle)]"><IconCheck className="w-[16px] h-[16px] text-[var(--success)]" /></div>
          <div><p className="text-[17px] font-[500]">{completed}</p><p className="text-[11px] text-[var(--text-3)]">Concluidos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--warning-subtle)]"><IconFinancial className="w-[16px] h-[16px] text-[var(--warning)]" /></div>
          <div>
            <p className="text-[17px] font-[500]">{pendingInvoices.length > 0 ? `R$ ${pendingTotal.toLocaleString('pt-BR')}` : '-'}</p>
            <p className="text-[11px] text-[var(--text-3)]">
              Financeiro pendente
              {overdueCount > 0 && <span className="text-[var(--destructive)]"> ({overdueCount} venc.)</span>}
            </p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--info-subtle)]"><IconAnalytics className="w-[16px] h-[16px] text-[var(--info)]" /></div>
          <div><p className="text-[17px] font-[500]">{projects.length ? `${avgProgress}%` : '-'}</p><p className="text-[11px] text-[var(--text-3)]">Media progresso</p></div>
        </CardContent></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Meus Projetos</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-[11px]" asChild>
                <a href="/portal/projects">Ver todos <IconArrowRight className="w-[10px] h-[10px]" /></a>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {projects.length === 0 && (
                <p className="text-[13px] text-[var(--text-3)] text-center py-6">Nenhum projeto. Clique em Solicitar Projeto!</p>
              )}
              {projects.map((p: any) => (
                <div key={p.id} className="flex items-center gap-4 p-2.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {p.number && <span className="text-[10px] font-[500] text-[var(--text-3)]">{p.number}</span>}
                      <p className="text-[13px] font-[500] truncate">{p.name}</p>
                      <Badge status={p.status === 'COMPLETED' ? 'COMPLETED' : p.status === 'REVIEW' ? 'REVIEW' : p.status === 'PENDING' ? 'PENDING' : p.status === 'DRAFT' ? 'DRAFT' : p.status === 'TODO' ? 'TODO' : 'IN_PROGRESS'}>
                        {p.status === 'COMPLETED' ? 'Concluido' : p.status === 'REVIEW' ? 'Revisao' : p.status === 'PENDING' ? 'Solicitacao' : p.status === 'DRAFT' ? 'Rascunho' : p.status === 'TODO' ? 'A fazer' : 'Em andamento'}
                      </Badge>
                    </div>
                    {p.status === 'PENDING' ? (
                      <p className="text-[11px] text-[var(--warning)] mt-0.5">Sua solicitacao esta em analise. Aguarde ate 24 horas.</p>
                    ) : (
                      <p className="text-[11px] text-[var(--text-3)] mt-0.5">
                        Prazo: {p.deadline ? new Date(p.deadline).toLocaleDateString('pt-BR') : 'Nao definido'}
                      </p>
                    )}
                  </div>
                  <Progress value={p.progress || 0} className="w-20 h-[2px]" />
                  <span className="text-[12px] font-[500] w-8">{p.progress || 0}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Dicas Uteis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2.5">
                  <span className="text-[15px] shrink-0">1</span>
                  <div>
                    <p className="text-[13px] font-[500] text-[var(--text)]">Preencha o briefing completo</p>
                    <p className="text-[11px] text-[var(--text-3)] mt-0.5">Quanto mais detalhes voce fornecer, mais precisa sera nossa proposta.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[15px] shrink-0">2</span>
                  <div>
                    <p className="text-[13px] font-[500] text-[var(--text)]">Acompanhe o progresso</p>
                    <p className="text-[11px] text-[var(--text-3)] mt-0.5">No fluxo do projeto voce ve cada etapa sendo concluida em tempo real.</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="text-[15px] shrink-0">3</span>
                  <div>
                    <p className="text-[13px] font-[500] text-[var(--text)]">Responda as solicitacoes</p>
                    <p className="text-[11px] text-[var(--text-3)] mt-0.5">Quando o desenvolvedor pedir dados extras, responda rapido para nao atrasar.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Notificacoes</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-[11px]" asChild>
                <a href="/notifications">Ver todas <IconArrowRight className="w-[10px] h-[10px]" /></a>
              </Button>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-[12px] text-[var(--text-3)] text-center py-4">Nenhuma notificacao</p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {notifications.map((n: any) => (
                      <div key={n.id} className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                        onClick={() => n.metadata?.projectId ? router.push(`/projects/${n.metadata.projectId}`) : null}>
                        <div className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[12px] font-[500] text-[var(--text)] truncate">{n.title}</p>
                            <p className="text-[11px] text-[var(--text-3)] mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-[var(--text-3)] mt-0.5">{new Date(n.createdAt).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingInvoices.length === 0 && invoices.length === 0 ? (
                <p className="text-[12px] text-[var(--text-3)] text-center py-3">Nenhuma fatura</p>
              ) : (
                <>
                  {invoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED').slice(0, 3).map((i: any) => (
                    <div key={i.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer" onClick={() => router.push('/portal/financial')}>
                      <div>
                        <p className="text-[12px] font-[500]">{i.number}</p>
                        <p className="text-[10px] text-[var(--text-3)]">Venc: {i.dueDate ? new Date(i.dueDate).toLocaleDateString('pt-BR') : '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] font-[500]">R$ {(i.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <Badge variant={i.status === 'OVERDUE' ? 'destructive' : 'warning'} className="text-[10px]">
                          {i.status === 'OVERDUE' ? 'Vencido' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {pendingInvoices.length > 3 && (
                    <p className="text-[11px] text-[var(--text-3)] text-center">+{pendingInvoices.length - 3} faturas</p>
                  )}
                </>
              )}
              <Button variant="ghost" size="sm" className="w-full h-7 text-[11px]" asChild>
                <a href="/portal/financial">Ir para Financeiro <IconArrowRight className="w-[10px] h-[10px]" /></a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
