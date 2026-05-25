'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AchievementBadge, achievementConfig } from '@/components/ui/achievement-badge'
import { ProjectCompleteModal } from '@/components/ui/project-complete-modal'
import { IconProject, IconCheck, IconAnalytics, IconPlus, IconFinancial, IconArrowRight, IconArrowUpRight } from '@/components/icons'
import { CheckCircle2, Circle, X, Sparkles, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getPlan } from '@/lib/plans'

const ONBOARDING_STEPS = [
  { id: 'profile', label: 'Complete seu perfil', description: 'Adicione seus dados de contato', href: '/portal/profile', icon: null },
  { id: 'briefing', label: 'Envie um briefing', description: 'Solicite seu primeiro projeto', href: '/portal/briefing', icon: null },
  { id: 'contract', label: 'Assine o contrato', description: 'Formalize a parceria', href: '/portal/contracts', icon: null },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return 'Boa noite'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function AnimatedCounter({ value, formatter }: { value: number; formatter?: (v: number) => string }) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / 1200, 1)
      setDisplay(Math.round(value * easeOutCubic(progress)))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [value])

  const text = formatter ? formatter(display) : String(display)
  return <>{text}</>
}

export default function PortalDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [newAchievement, setNewAchievement] = useState<any>(null)
  const [celebratingProject, setCelebratingProject] = useState<{ id: string; name: string } | null>(null)
  const [contracts, setContracts] = useState<any[]>([])
  const [onboardingHidden, setOnboardingHidden] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [progressHistory, setProgressHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('Ola')
  const [aiSummaryExpanded, setAiSummaryExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [planNearLimit, setPlanNearLimit] = useState(false)
  const [isAnniversary, setIsAnniversary] = useState(false)
  const [anniversaryYears, setAnniversaryYears] = useState(0)
  const touchStartY = useRef(0)

  useEffect(() => { setGreeting(getGreeting()) }, [])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const hidden = localStorage.getItem('onboarding_checklist_hidden')
    if (hidden === 'true') setOnboardingHidden(true)
  }, [])

  const firstName = session?.user?.name?.split(' ')[0] || 'Cliente'

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [projRes, invRes, notifRes, achRes, conRes] = await Promise.all([
          fetch('/api/projects', { credentials: 'include' }),
          fetch('/api/invoices', { credentials: 'include' }),
          fetch('/api/notifications', { credentials: 'include' }),
          fetch('/api/achievements', { credentials: 'include' }),
          fetch('/api/contracts', { credentials: 'include' }),
        ])
        const projJson = await projRes.json()
        const invJson = await invRes.json()
        const notifJson = await notifRes.json()
        const achJson = await achRes.json()
        const conJson = await conRes.json()
        setProjects(projJson.data || [])
        setInvoices(invJson.data || [])
        setNotifications((notifJson.data || []).slice(0, 5))
        setContracts(conJson.data || [])
        const achData = achJson.data || []
        setAchievements(achData)

        const stored = localStorage.getItem('anderflow_achievements')
        const prevIds = stored ? JSON.parse(stored) : []
        const newOnes = achData.filter((a: any) => !prevIds.includes(a.id))
        if (newOnes.length > 0) {
          setNewAchievement(newOnes[0])
          try {
            const confetti = (await import('canvas-confetti')).default
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
          } catch {}
        }
        localStorage.setItem('anderflow_achievements', JSON.stringify(achData.map((a: any) => a.id)))

        const projData = projJson.data || []
        const lastStatusesStr = sessionStorage.getItem('lastProjectStatuses')
        const lastStatuses: Record<string, string> = lastStatusesStr ? JSON.parse(lastStatusesStr) : {}
        const currentStatuses: Record<string, string> = {}
        projData.forEach((p: any) => { currentStatuses[p.id] = p.status })
        for (const p of projData) {
          if (p.status === 'COMPLETED' && lastStatuses[p.id] && lastStatuses[p.id] !== 'COMPLETED') {
            setCelebratingProject({ id: p.id, name: p.name })
            break
          }
        }
        sessionStorage.setItem('lastProjectStatuses', JSON.stringify(currentStatuses))

        const u = session?.user as any
        if (u?.plan) {
          const plan = getPlan(u.plan)
          const activeProjects = projData.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length
          if (plan.maxProjects !== -1 && activeProjects >= plan.maxProjects - 1 && activeProjects < plan.maxProjects) {
            setPlanNearLimit(true)
          }
        }

        const currentUser = session?.user as any
        if (currentUser?.createdAt) {
          const created = new Date(currentUser.createdAt)
          const now = new Date()
          if (created.getMonth() === now.getMonth()) {
            const years = now.getFullYear() - created.getFullYear()
            if (years >= 1) {
              setIsAnniversary(true)
              setAnniversaryYears(years)
            }
          }
        }
      } catch {}
      setLoading(false)
      fetch('/api/portal/ai-summary', { credentials: 'include' })
        .then(r => r.json())
        .then(json => { if (json.data?.summary) setAiSummary(json.data.summary) })
        .catch(() => {})
      fetch('/api/portal/progress-history', { credentials: 'include' })
        .then(r => r.json())
        .then(json => { setProgressHistory(json.data?.history || []) })
        .catch(() => {})
    }
    loadAll()
  }, [session])

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

  const onboardingResults = ONBOARDING_STEPS.map(step => {
    if (step.id === 'profile') return { ...step, done: !!(session?.user as any)?.phone }
    if (step.id === 'briefing') return { ...step, done: projects.length > 0 }
    if (step.id === 'contract') return { ...step, done: contracts.some((c: any) => c.status === 'SIGNED') }
    return { ...step, done: false }
  })
  const onboardingDone = onboardingResults.filter(s => s.done).length
  const onboardingTotal = onboardingResults.length
  const onboardingProgress = onboardingTotal > 0 ? Math.round((onboardingDone / onboardingTotal) * 100) : 0
  const hideOnboarding = () => {
    localStorage.setItem('onboarding_checklist_hidden', 'true')
    setOnboardingHidden(true)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (refreshing) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 80 && window.scrollY === 0) {
      setRefreshing(true)
      setTimeout(() => {
        window.location.reload()
      }, 1200)
    }
  }

  return (
    <div className="p-6 space-y-5 animate-page-enter" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
      {refreshing && (
        <div className="flex items-center justify-center gap-2 py-3 animate-fade-in">
          <div className="h-5 w-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[12px] text-[var(--text-3)]">Atualizando...</span>
        </div>
      )}
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

      {isAnniversary && (
        <Card className="border-[var(--accent)]/30 bg-gradient-to-r from-[var(--accent-subtle)] to-[var(--surface)] animate-card-pop">
          <CardContent className="p-4 flex items-center gap-4">
            <span className="text-3xl">🎂</span>
            <div>
              <p className="text-[14px] font-[500] text-[var(--text)]">
                {anniversaryYears} ano(s) de parceria com ANDERFLOW!
              </p>
              <p className="text-[12px] text-[var(--text-2)] mt-0.5">Obrigado pela confianca. E um prazer ter voce conosco.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {planNearLimit && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--warning-subtle)] border border-[var(--warning)]/20 text-[12px] text-[var(--warning)]">
          <span className="text-sm">📊</span>
          <span>Voce esta proximo do limite de projetos do seu plano. Considere fazer upgrade.</span>
        </div>
      )}

      {aiSummary !== null && (
        <Card className="border-[var(--accent)]/20 bg-[var(--accent-subtle)] animate-card-pop">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <button
                  className="flex items-center gap-2 w-full text-left"
                  onClick={() => setAiSummaryExpanded(!aiSummaryExpanded)}
                >
                  <p className="text-[11px] font-[500] text-[var(--accent)] uppercase tracking-wider">Resumo Inteligente</p>
                  {isMobile && (
                    aiSummaryExpanded ? <ChevronUp className="h-3 w-3 text-[var(--accent)]" /> : <ChevronDown className="h-3 w-3 text-[var(--accent)]" />
                  )}
                </button>
                {(!isMobile || aiSummaryExpanded) && (
                  <p className="text-[13px] text-[var(--text-2)] leading-relaxed mt-1">{aiSummary}</p>
                )}
                {isMobile && !aiSummaryExpanded && (
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] mt-1 p-0" onClick={() => setAiSummaryExpanded(true)}>
                    Ver resumo
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        <Card className="animate-card-pop stagger-1"><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-subtle)]"><IconProject className="w-[16px] h-[16px] text-[var(--accent)]" /></div>
          <div><p className="text-[17px] font-[500]"><AnimatedCounter value={active} /></p><p className="text-[11px] text-[var(--text-3)]">Projetos ativos</p></div>
        </CardContent></Card>
        <Card className="animate-card-pop stagger-2"><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--success-subtle)]"><IconCheck className="w-[16px] h-[16px] text-[var(--success)]" /></div>
          <div><p className="text-[17px] font-[500]"><AnimatedCounter value={completed} /></p><p className="text-[11px] text-[var(--text-3)]">Concluidos</p></div>
        </CardContent></Card>
        <Card className="animate-card-pop stagger-3"><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--warning-subtle)]"><IconFinancial className="w-[16px] h-[16px] text-[var(--warning)]" /></div>
          <div>
            <p className="text-[17px] font-[500]">{pendingInvoices.length > 0 ? <>R$ <AnimatedCounter value={pendingTotal} formatter={v => v.toLocaleString('pt-BR')} /></> : '-'}</p>
            <p className="text-[11px] text-[var(--text-3)]">
              Financeiro pendente
              {overdueCount > 0 && <span className="text-[var(--destructive)]"> ({overdueCount} venc.)</span>}
            </p>
          </div>
        </CardContent></Card>
        <Card className="animate-card-pop stagger-4"><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--info-subtle)]"><IconAnalytics className="w-[16px] h-[16px] text-[var(--info)]" /></div>
          <div><p className="text-[17px] font-[500]">{projects.length ? <><AnimatedCounter value={avgProgress} />%</> : '-'}</p><p className="text-[11px] text-[var(--text-3)]">Media progresso</p></div>
        </CardContent></Card>
      </div>

      {achievements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Suas conquistas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {achievements.map((a: any) => (
              <AchievementBadge key={a.id} type={a.type} unlockedAt={a.unlockedAt} />
            ))}
            {Object.keys(achievementConfig).filter(t => !achievements.some((a: any) => a.type === t)).map(t => (
              <AchievementBadge key={t} type={t} locked />
            ))}
          </CardContent>
          </Card>
        )}

      {progressHistory.length > 0 && (
        <Card className="animate-card-pop">
          <CardHeader className="pb-2">
            <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Progresso ao longo do tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressHistory} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(w: string) => { const parts = w.split('-W'); return `S${parts[1] || ''}` }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} width={35} />
                  <Tooltip content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-lg">
                        <p className="text-xs font-medium text-[var(--text)]">{label}</p>
                        <p className="text-xs font-mono text-[var(--accent)]">{payload[0].value}%</p>
                      </div>
                    )
                  }} />
                  <Area type="monotone" dataKey="avgProgress" stroke="var(--accent)" strokeWidth={2} fill="url(#progressGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {!onboardingHidden && onboardingProgress < 100 && (
        <Card className="animate-card-pop border-[var(--accent)]/20 bg-[var(--accent)]/[0.03]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[12px] font-[500] text-[var(--text)]">Primeiros passos</p>
                <p className="text-[11px] text-[var(--text-3)] mt-0.5">Complete as etapas para desbloquear todo o potencial</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="info" className="text-2xs">
                  {onboardingDone} de {onboardingTotal} concluídos
                </Badge>
                <button onClick={hideOnboarding} className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <Progress value={onboardingProgress} className="h-1 mb-3" />
            <div className="space-y-1">
              {onboardingResults.map((step) => (
                <div key={step.id} className="flex items-center gap-2.5 py-1.5">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-[var(--text-3)] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-[500] ${step.done ? 'text-[var(--text-3)]' : 'text-[var(--text)]'}`}>
                      {step.label}
                    </p>
                    <p className="text-[11px] text-[var(--text-3)]">{step.description}</p>
                  </div>
                  {!step.done && (
                    <Button size="sm" variant="outline" className="h-7 text-[11px]" asChild>
                      <a href={step.href}>Ir</a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-[var(--info-subtle)] bg-[var(--info-subtle)]">
            <CardContent className="p-4">
              <p className="text-[11px] font-[500] text-[var(--text-3)] uppercase tracking-wider mb-2">Proxima acao sugerida</p>
              {projects.length === 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/10">
                    <IconArrowUpRight className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[var(--text)]">Solicite seu primeiro projeto</p>
                    <p className="text-[11px] text-[var(--text-2)] mt-0.5">Comece sua jornada conosco preenchendo um briefing detalhado.</p>
                  </div>
                  <Button size="sm" asChild>
                    <a href="/portal/briefing">Comecar</a>
                  </Button>
                </div>
              ) : pendingInvoices.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED').length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--warning)]/10">
                    <IconFinancial className="w-4 h-4 text-[var(--warning)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[var(--text)]">Voce tem faturas em aberto</p>
                    <p className="text-[11px] text-[var(--text-2)] mt-0.5">Regularize seus pagamentos para evitar bloqueios.</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href="/portal/financial">Ver faturas</a>
                  </Button>
                </div>
              ) : projects.some((p: any) => p.status === 'PENDING') ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--warning)]/10">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--warning)" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11v.01"/></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[var(--text)]">Aguardando analise da sua solicitacao</p>
                    <p className="text-[11px] text-[var(--text-2)] mt-0.5">Sua solicitacao esta em analise. Aguarde ate 24 horas.</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href="/portal/projects">Ver projetos</a>
                  </Button>
                </div>
              ) : projects.some((p: any) => p.status === 'IN_PROGRESS') ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--info)]/10">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--info)" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-[500] text-[var(--text)]">Acompanhe o progresso</p>
                    <p className="text-[11px] text-[var(--text-2)] mt-0.5">Seus projetos estao em andamento. Confira as atualizacoes.</p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href="/portal/projects">Acompanhar</a>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
          {projects.length === 0 && (
            <Card className="bg-[var(--accent-subtle)] border-[var(--accent)]/20 animate-card-pop">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10">
                  <IconArrowUpRight className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-[500]">Solicite seu primeiro projeto</p>
                  <p className="text-[11px] text-[var(--text-2)] mt-0.5">Comece sua jornada conosco preenchendo um briefing detalhado.</p>
                </div>
                <Button size="sm" asChild>
                  <a href="/portal/briefing">Comecar</a>
                </Button>
              </CardContent>
            </Card>
          )}
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
                <div key={p.id} className="flex items-center gap-4 p-2.5 rounded-lg hover:bg-[var(--surface-hover)] transition-all cursor-pointer hover:scale-[1.01]" onClick={() => router.push(`/projects/${p.id}`)}>
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

      <Dialog open={!!newAchievement} onOpenChange={() => setNewAchievement(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-center">Nova Conquista!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-subtle)] border-2 border-[var(--accent)]/30">
              <span className="text-2xl">
                {newAchievement?.type === 'first_project' && '🚀'}
                {newAchievement?.type === 'briefing_sent' && '📋'}
                {newAchievement?.type === 'contract_signed' && '✍️'}
                {newAchievement?.type === 'project_halfway' && '⚡'}
                {newAchievement?.type === 'project_complete' && '🏆'}
              </span>
            </div>
            <p className="text-[14px] font-[500] text-[var(--text)] text-center">
              {newAchievement && achievementConfig[newAchievement.type]?.label}
            </p>
            <p className="text-[11px] text-[var(--text-3)] text-center">
              Continue evoluindo! Mais conquistas te aguardam.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewAchievement(null)} className="w-full">Incrivel!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProjectCompleteModal
        open={!!celebratingProject}
        projectName={celebratingProject?.name}
        projectId={celebratingProject?.id}
        onClose={() => setCelebratingProject(null)}
      />
    </div>
  )
}
