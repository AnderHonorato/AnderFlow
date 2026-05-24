import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cargoEhAdmin } from '@/lib/hierarquia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ArrowUpRight, Calendar, Download,
} from 'lucide-react'
import { AnalyticsCharts } from './analytics-charts'
import { ActivityHeatmapWrapper } from './heatmap-wrapper'

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (!cargoEhAdmin(user.role)) redirect('/dashboard')
  const [
    projectCount,
    activeProjects,
    completedProjects,
    userCount,
    invoiceResult,
    totalRevenue,
    taskCount,
    completedTaskCount,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.invoice.aggregate({ _sum: { total: true }, _count: true }),
    prisma.invoice.aggregate({ _sum: { total: true }, where: { status: 'PAID' } }),
    prisma.task.count(),
    prisma.task.count({ where: { completedAt: { not: null } } }),
  ])

  const totalInvoices = invoiceResult._sum.total ?? 0
  const paidRevenue = totalRevenue._sum.total ?? 0
  const taskCompletionRate = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0

  // ── Revenue data for charts ──
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
  twelveMonthsAgo.setDate(1)
  twelveMonthsAgo.setHours(0, 0, 0, 0)

  const paidInvoices = await prisma.invoice.findMany({
    where: {
      status: 'PAID',
      paidAt: { not: null, gte: twelveMonthsAgo },
    },
    select: {
      total: true,
      paidAt: true,
      clientId: true,
      client: { select: { name: true } },
    },
    orderBy: { paidAt: 'asc' },
  })

  // Monthly revenue map
  const monthlyMap = new Map<string, number>()
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = getMonthLabel(d)
    monthlyMap.set(key, 0)
  }

  for (const inv of paidInvoices) {
    if (!inv.paidAt) continue
    const key = getMonthLabel(new Date(inv.paidAt))
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + inv.total)
  }

  const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, receita]) => ({
    month,
    receita: Math.round(receita * 100) / 100,
  }))

  // Trend: average of last 3 actual months, projected for next 3
  const actualMonths = monthlyRevenue.filter(m => !m.month.startsWith('prev'))
  const last3 = actualMonths.slice(-3)
  const avgLast3 = last3.length > 0 ? last3.reduce((s, m) => s + m.receita, 0) / last3.length : 0
  const lastMonth = actualMonths.length > 0 ? actualMonths[actualMonths.length - 1].month : ''
  const nextLabels = (() => {
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    const idx = months.indexOf(lastMonth.toLowerCase())
    const result: string[] = []
    for (let i = 1; i <= 3; i++) {
      result.push(months[(idx + i) % 12])
    }
    return result
  })()

  const trendData = [
    ...monthlyRevenue,
    ...nextLabels.map(m => ({ month: m, receita: Math.round(avgLast3 * 100) / 100, previsao: true })),
  ]

  // Client revenue
  const clientRevenueMap = new Map<string, number>()
  for (const inv of paidInvoices) {
    const name = inv.client?.name || 'Cliente'
    clientRevenueMap.set(name, (clientRevenueMap.get(name) || 0) + inv.total)
  }
  const clientRevenue = Array.from(clientRevenueMap.entries())
    .map(([name, receita]) => ({ name, receita: Math.round(receita * 100) / 100 }))
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 8)

  const kpis = [
    { title: 'Receita Total', value: `R$ ${totalInvoices.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: `${invoiceResult._count} faturas`, trend: 'up' as const, period: 'valor total emitido' },
    { title: 'Receita Recebida', value: `R$ ${paidRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 'Pago', trend: 'up' as const, period: 'receita realizada' },
    { title: 'Taxa de Conclusão', value: `${taskCompletionRate}%`, change: `${completedTaskCount}/${taskCount}`, trend: 'up' as const, period: 'tarefas concluídas' },
    { title: 'Projetos', value: String(projectCount), change: `${activeProjects} ativos`, trend: 'up' as const, period: `${completedProjects} concluídos` },
  ]

  const performanceMetrics = [
    { label: 'Tarefas Concluídas', value: taskCompletionRate, target: 100, color: 'bg-success' },
    { label: 'Projetos Ativos', value: projectCount > 0 ? Math.round((activeProjects / projectCount) * 100) : 0, target: 100, color: 'bg-primary' },
    { label: 'Taxa de Cobrança', value: totalInvoices > 0 ? Math.round((paidRevenue / totalInvoices) * 100) : 0, target: 100, color: 'bg-success' },
    { label: 'Usuários Ativos', value: userCount, target: 10, color: 'bg-warning' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas de performance e crescimento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Últimos 12 meses
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.title}</span>
                <div className="flex items-center gap-0.5 text-xs font-medium text-success">
                  <ArrowUpRight className="h-3 w-3" />
                  {kpi.change}
                </div>
              </div>
              <p className="text-lg font-medium">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.period}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnalyticsCharts monthlyRevenue={trendData} clientRevenue={clientRevenue} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {performanceMetrics.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{metric.label}</span>
                    <span className="text-sm font-semibold">
                      {metric.value}{metric.label === 'Usuários Ativos' ? '' : '%'}
                    </span>
                  </div>
                  <Progress
                    value={metric.label === 'Usuários Ativos' ? Math.min(metric.value * 10, 100) : metric.value}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Resumo do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-lg border space-y-3">
                <p className="text-sm font-medium">Projetos</p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-lg font-semibold">{projectCount}</p>
                    <p className="text-2xs text-muted-foreground">Total</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-lg font-semibold">{activeProjects}</p>
                    <p className="text-2xs text-muted-foreground">Ativos</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Concluídos</span>
                    <span className="font-medium">{completedProjects}/{projectCount}</span>
                  </div>
                  <Progress value={projectCount > 0 ? Math.round((completedProjects / projectCount) * 100) : 0} className="h-1.5" />
                </div>
              </div>
              <div className="p-3 rounded-lg border space-y-3">
                <p className="text-sm font-medium">Financeiro</p>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-lg font-semibold">{invoiceResult._count}</p>
                    <p className="text-2xs text-muted-foreground">Faturas</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <p className="text-lg font-semibold">R$ {((paidRevenue / 1000) || 0).toFixed(0)}k</p>
                    <p className="text-2xs text-muted-foreground">Recebido</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Usuários</span>
                    <span className="font-medium">{userCount} ativos</span>
                  </div>
                  <Progress value={Math.min(userCount * 10, 100)} className="h-1.5" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Atividade nos ultimos 12 meses</CardTitle></CardHeader>
        <CardContent><ActivityHeatmapWrapper /></CardContent>
      </Card>
    </div>
  )
}
