'use client'

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

const kpis = [
  { title: 'Receita Total', value: 'R$ 248.500', change: '+18%', trend: 'up', period: 'vs. mês anterior' },
  { title: 'MRR', value: 'R$ 48.500', change: '+12%', trend: 'up', period: 'receita recorrente' },
  { title: 'Churn Rate', value: '2.3%', change: '-0.5%', trend: 'down', period: 'vs. mês anterior' },
  { title: 'LTV Médio', value: 'R$ 32.400', change: '+8%', trend: 'up', period: 'lifetime value' },
]

const performanceMetrics = [
  { label: 'SLA Cumprido', value: 94, target: 95, color: 'bg-success' },
  { label: 'Satisfação Cliente', value: 4.8, target: 5, color: 'bg-primary', isRating: true },
  { label: 'Taxa de Retenção', value: 97, target: 95, color: 'bg-success' },
  { label: 'Tempo Médio Entrega', value: 85, target: 90, color: 'bg-warning' },
]

const revenueByMonth = [
  { month: 'Jan', value: 38000 },
  { month: 'Fev', value: 42000 },
  { month: 'Mar', value: 48500 },
  { month: 'Abr', value: 45000 },
  { month: 'Mai', value: 52000 },
  { month: 'Jun', value: 58000 },
]

export default function AnalyticsPage() {
  const maxRevenue = Math.max(...revenueByMonth.map(r => r.value))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
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
              <p className="text-2xl font-semibold">{kpi.value}</p>
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
                      {metric.isRating ? `${metric.value}/5` : `${metric.value}%`}
                    </span>
                  </div>
                  <Progress
                    value={metric.isRating ? (metric.value / 5) * 100 : metric.value}
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
          <CardTitle className="text-base font-medium">Sua Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border space-y-3">
              <div>
                <p className="text-sm font-medium">Anderson</p>
                <p className="text-xs text-muted-foreground">Full Stack</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-lg font-semibold">4</p>
                  <p className="text-2xs text-muted-foreground">Projetos</p>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <p className="text-lg font-semibold">168h</p>
                  <p className="text-2xs text-muted-foreground">Horas</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tarefas</span>
                  <span className="font-medium">8/12</span>
                </div>
                <Progress value={67} className="h-1.5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
