'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { OnboardingTip } from '@/components/ui/onboarding-tip'
import { GlassCard } from '@/components/ui/glass-card'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { IconProject, IconFinancial, IconClient, IconAnalytics, IconPlus, IconChat, IconCheck, IconKnowledge } from '@/components/icons'
import { cn } from '@/lib/utils'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { GripVertical, RotateCcw, LayoutDashboard } from 'lucide-react'
import { StreakWidget } from '@/components/ui/streak-widget'

const DEFAULT_WIDGETS = ['stats', 'active-project', 'projects', 'revenue']

function TaskItem({ task, daysOverdue }: { task: any; daysOverdue?: number }) {
  const handleToggle = async () => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' }),
    })
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-2 py-1 text-[12px]">
      <button onClick={handleToggle} className="h-4 w-4 rounded border border-[var(--border)] hover:border-[var(--accent)] transition-colors shrink-0" title="Marcar concluida" />
      <span className="flex-1 truncate text-[var(--text)]">{task.title}</span>
      {task.project && (
        <a href={`/projects/${task.project.id}`} className="text-[var(--accent)] hover:opacity-80 shrink-0 text-[10px] truncate max-w-[100px]">{task.project.name}</a>
      )}
      {daysOverdue !== undefined && daysOverdue > 0 && (
        <span className="text-[10px] text-[var(--destructive)] shrink-0">{daysOverdue}d atraso</span>
      )}
    </div>
  )
}

function SortableWidget({ id, children, editMode }: { id: string; children: React.ReactNode; editMode: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={false}
      className="relative group"
    >
      {editMode && (
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-hover)] transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-[var(--text-3)]" />
        </button>
      )}
      {children}
    </motion.div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const roleLevel = (session?.user as any)?.roleLevel || 0
  const isAdmin = roleLevel >= 80

  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDGETS
    try {
      const saved = localStorage.getItem('dashboard-widgets')
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS
    } catch {
      return DEFAULT_WIDGETS
    }
  })

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    if (isAdmin) {
      fetch('/api/admin/streak')
        .then(r => r.json())
        .then(json => { if (json.data) setStreakData(json.data) })
        .catch(() => {})

      fetch('/api/dashboard/today-tasks')
        .then(r => r.json())
        .then(json => { if (json.data) setTodayTasks(json.data) })
        .catch(() => {})
    }
  }, [isAdmin])

  const [revenueIdx, setRevenueIdx] = useState(0)
  const [streakData, setStreakData] = useState<any>(null)
  const [todayTasks, setTodayTasks] = useState<any>({ overdue: [], today: [] })

  const revenueMetric = useMemo(() => [
    { label: 'Hoje', value: data?.stats?.revenueToday || 0 },
    { label: 'Esta semana', value: data?.stats?.revenueWeek || 0 },
    { label: 'Este mês', value: data?.stats?.totalRevenue || 0 },
  ], [data?.stats])

  useEffect(() => {
    if (!isAdmin) return
    const timer = setInterval(() => {
      setRevenueIdx(prev => (prev + 1) % 3)
    }, 4000)
    return () => clearInterval(timer)
  }, [isAdmin])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setWidgetOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string)
      const newIndex = prev.indexOf(over.id as string)
      const next = arrayMove(prev, oldIndex, newIndex)
      try { localStorage.setItem('dashboard-widgets', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const resetLayout = useCallback(() => {
    setWidgetOrder(DEFAULT_WIDGETS)
    try { localStorage.setItem('dashboard-widgets', JSON.stringify(DEFAULT_WIDGETS)) } catch {}
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
  const completed = recentProjects.filter((p: any) => p.status === 'COMPLETED').length
  const inProgress = recentProjects.filter((p: any) => p.status === 'IN_PROGRESS').length

  const formatRevenue = (v: number) => {
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`
    return `R$ ${v.toFixed(0)}`
  }

  const currentRevenue = revenueMetric[revenueIdx]

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'stats':
        return (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {stats.slice(0, 1).map((stat) => (
              <GlassCard key={stat.label} className="p-0">
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-subtle)]">
                    <span className="w-4 h-4 text-[var(--accent)]">{stat.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={revenueIdx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="font-numeric font-bold text-[15px] text-[var(--text)] tabular-nums block"
                      >
                        {formatRevenue(currentRevenue.value)}
                      </motion.span>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`label-${revenueIdx}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[10px] text-[var(--text-3)] uppercase tracking-wide font-sans"
                      >
                        {currentRevenue.label}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </motion.div>
              </GlassCard>
            ))}
            {stats.slice(1).map((stat, i) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <StatCard
                  {...stat}
                  index={i + 1}
                  className="h-[56px]"
                />
              </motion.div>
            ))}
          </div>
        )

      case 'active-project':
        if (!activeProject) return null
        return (
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
        )

      case 'projects':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">
                Projetos Recentes
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
        )

      case 'revenue':
        return (
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
                  <span className="font-numeric text-[13px] font-bold text-[var(--text-2)] tabular-nums">Saldo pendente</span>
                  <span className={cn(
                    'font-numeric text-[13px] font-bold',
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
                  <span className="font-numeric text-[13px] font-bold text-[var(--success)]">
                    R$ {((data?.stats?.paidThisMonth || 0) / 1000).toFixed(1)}k
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[var(--text-2)]">Notificacoes</span>
                  <span className="font-numeric text-[13px] font-bold">{data?.stats?.unreadNotifications || 0} nao lidas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <PageWrapper>
      <div className="p-4 space-y-4">
      <OnboardingTip
        id="dashboard_welcome"
        title={isAdmin ? "Bem-vindo ao seu painel de controle" : "Bem-vindo ao ANDERFLOW"}
        description={isAdmin ? "Aqui voce ve tudo em tempo real." : "Solicite projetos e acompanhe o andamento."}
      />
      <PageHeader
        title={isAdmin ? "Painel de Controle" : `Ola, ${session?.user?.name?.split(' ')[0] || 'Cliente'}`}
        description={isAdmin ? "Visao geral da sua plataforma" : "Acompanhe seus projetos"}
        className="font-display"
      >
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button
                size="sm"
                variant={editMode ? "default" : "outline"}
                onClick={() => setEditMode(prev => !prev)}
                className="h-8 text-[11px]"
              >
                <LayoutDashboard className="w-[14px] h-[14px]" />
                {editMode ? 'Concluir' : 'Personalizar'}
              </Button>
              {editMode && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={resetLayout}
                  className="h-8 text-[11px]"
                >
                  <RotateCcw className="w-[14px] h-[14px]" />
                  Resetar
                </Button>
              )}
            </>
          )}
          <Button size="sm" asChild>
            <a href="/portal/briefing"><IconPlus className="w-[14px] h-[14px]" /> Novo Projeto</a>
          </Button>
        </div>
      </PageHeader>

      {isAdmin && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgetOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {widgetOrder.map((widgetId) => (
                <SortableWidget key={widgetId} id={widgetId} editMode={editMode}>
                  {renderWidget(widgetId)}
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {isAdmin && streakData && (
        <StreakWidget
          currentStreak={streakData.currentStreak}
          longestStreak={streakData.longestStreak}
          today={streakData.today}
          last7Days={streakData.last7Days}
        />
      )}

      {isAdmin && (todayTasks.overdue?.length > 0 || todayTasks.today?.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">
              Tarefas de Hoje ({(todayTasks.overdue?.length || 0) + (todayTasks.today?.length || 0)})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.overdue?.length > 0 && (
              <div>
                <p className="text-[11px] font-[600] text-[var(--destructive)] mb-1.5 flex items-center gap-1">
                  ⚠️ Vencidas ({todayTasks.overdue.length})
                </p>
                {todayTasks.overdue.slice(0, 5).map((task: any) => {
                  const daysOverdue = task.dueDate ? Math.floor((Date.now() - new Date(task.dueDate).getTime()) / 86400000) : 0
                  return (
                    <TaskItem key={task.id} task={task} daysOverdue={daysOverdue} />
                  )
                })}
              </div>
            )}
            {todayTasks.today?.length > 0 && (
              <div>
                <p className="text-[11px] font-[600] text-[var(--accent)] mb-1.5 flex items-center gap-1">
                  📋 Para hoje ({todayTasks.today.length})
                </p>
                {todayTasks.today.map((task: any) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )}
            {(todayTasks.overdue?.length || 0) + (todayTasks.today?.length || 0) === 0 && (
              <p className="text-[12px] text-[var(--text-3)] text-center py-4">Nenhuma tarefa para hoje 🎉</p>
            )}
          </CardContent>
        </Card>
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
<p className="font-numeric text-xl font-bold text-[var(--text)]"><AnimatedCounter value={recentProjects.length} /></p>
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
<p className="font-numeric text-xl font-bold text-[var(--text)]"><AnimatedCounter value={completed} /></p>
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
<p className="font-numeric text-xl font-bold text-[var(--text)]"><AnimatedCounter value={inProgress} /></p>
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

          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">
                Meus Projetos
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
        </>
      )}
      </div>
    </PageWrapper>
  )
}
