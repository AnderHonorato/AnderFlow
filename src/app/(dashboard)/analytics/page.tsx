import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  BarChart3,
  Activity,
} from 'lucide-react'

export default async function AnalyticsPage() {
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
    prisma.task.count({ where: { status: 'DONE' } }),
  ])

  const totalInvoices = invoiceResult._sum.total ?? 0
  const paidRevenue = totalRevenue._sum.total ?? 0
  const taskCompletionRate = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0

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

  const revenueByMonth = [
    { month: 'Jan', value: 38000 },
    { month: 'Fev', value: 42000 },
    { month: 'Mar', value: 48500 },
    { month: 'Abr', value: 45000 },
    { month: 'Mai', value: 52000 },
    { month: 'Jun', value: 58000 },
  ]

  const maxRevenue = Math.max(...revenueByMonth.map(r => r.value))

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
            Últimos 6 meses
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
                <div className={`flex items-center gap-0.5 text-xs font-medium ${kpi.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                  {kpi.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {kpi.change}
                </div>
              </div>
              <p className="text-lg font-medium">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.period}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48">
              {revenueByMonth.map((item) => (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-2xs font-medium">
                    R$ {(item.value / 1000).toFixed(0)}k
                  </span>
                  <div className="w-full bg-muted rounded-t-md overflow-hidden" style={{ height: '140px' }}>
                    <div
                      className="w-full bg-primary/80 rounded-t-md transition-all duration-500 mt-auto"
                      style={{ height: `${(item.value / maxRevenue) * 100}%`, marginTop: `${100 - (item.value / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-2xs text-muted-foreground">{item.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
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
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Resumo do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border space-y-3">
              <div>
                <p className="text-sm font-medium">Projetos</p>
                <p className="text-xs text-muted-foreground">Total e ativos</p>
              </div>
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
            <div className="p-4 rounded-lg border space-y-3">
              <div>
                <p className="text-sm font-medium">Faturas</p>
                <p className="text-xs text-muted-foreground">Financeiro</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-lg font-semibold">{invoiceResult._count}</p>
                  <p className="text-2xs text-muted-foreground">Emitidas</p>
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
  )
}
