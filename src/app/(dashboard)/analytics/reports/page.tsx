'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { BarChart3, PieChartIcon, LineChartIcon, Table, Save, Trash2 } from 'lucide-react'

const METRICS = [
  { key: 'revenue', label: 'Receita', icon: '💰' },
  { key: 'projects', label: 'Projetos', icon: '📊' },
  { key: 'tickets', label: 'Tickets', icon: '🎫' },
  { key: 'hours', label: 'Horas', icon: '⏱️' },
  { key: 'clients', label: 'Clientes', icon: '👥' },
]

const CHART_TYPES = [
  { key: 'bar', label: 'Barra', icon: BarChart3 },
  { key: 'line', label: 'Linha', icon: LineChartIcon },
  { key: 'pie', label: 'Pizza', icon: PieChartIcon },
  { key: 'table', label: 'Tabela', icon: Table },
]

const PIE_COLORS = ['#E8622A', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function CustomReportsPage() {
  const [metric, setMetric] = useState('revenue')
  const [chartType, setChartType] = useState('bar')
  const [groupBy, setGroupBy] = useState('month')
  const [dateRange, setDateRange] = useState('90')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [savedReports, setSavedReports] = useState<any[]>([])
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [rowCount, setRowCount] = useState(10)

  useEffect(() => {
    fetch('/api/reports/custom?saved=1').then(r => r.json()).then(json => {
      setSavedReports(json.data || [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    loadData()
  }, [metric, groupBy, dateRange])

  const loadData = async () => {
    setLoading(true)
    const params = new URLSearchParams({ metric, groupBy, dateRange })
    const res = await fetch(`/api/reports/custom?${params}`)
    const json = await res.json()
    setData(json.data || [])
    setLoading(false)
  }

  const loadSavedReport = (report: any) => {
    const cfg = report.config
    if (cfg.metric) setMetric(cfg.metric)
    if (cfg.chartType) setChartType(cfg.chartType)
    if (cfg.groupBy) setGroupBy(cfg.groupBy)
    if (cfg.dateRange) setDateRange(String(cfg.dateRange))
    loadData()
  }

  const handleSave = async () => {
    if (!saveName.trim()) return
    const res = await fetch('/api/reports/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: saveName, config: { metric, chartType, groupBy, dateRange: parseInt(dateRange) } }),
    })
    if (res.ok) {
      const json = await res.json()
      setSavedReports(prev => [json.data, ...prev])
      setSaveOpen(false)
      setSaveName('')
      toast.success('Relatório salvo!')
    } else {
      toast.error('Erro ao salvar')
    }
  }

  const renderChart = () => {
    if (loading) return <Skeleton className="h-[300px] w-full" />
    if (data.length === 0) return <p className="text-center text-[var(--text-3)] py-12">Sem dados</p>

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100} label={({ label, value }) => `${label}: ${value}`}>
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )
      case 'table':
        const paginated = data.slice(0, rowCount)
        return (
          <>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 text-[var(--text-3)] font-[500]">{metric === 'clients' ? 'Cliente' : 'Período'}</th>
                  <th className="text-right py-2 text-[var(--text-3)] font-[500]">Valor</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((d, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/50">
                    <td className="py-2 text-[var(--text)]">{d.label}</td>
                    <td className="py-2 text-right text-[var(--text)]">{metric === 'revenue' ? `R$ ${d.value}` : d.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > rowCount && (
              <Button variant="ghost" size="sm" onClick={() => setRowCount(r => r + 10)} className="w-full mt-2 text-[11px]">
                Mostrar mais ({data.length - rowCount} restantes)
              </Button>
            )}
          </>
        )
    }
  }

  return (
    <div className="p-6 space-y-6 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Relatórios Personalizados</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">Construa e salve relatórios</p>
        </div>
        <Button size="sm" onClick={() => setSaveOpen(true)} className="h-8 text-[12px] gap-1">
          <Save className="h-3.5 w-3.5" /> Salvar relatório
        </Button>
      </div>

      <div className="grid grid-cols-[260px_1fr] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-[13px]">Métrica</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {METRICS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMetric(m.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    metric === m.key ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-[500]' : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-[13px]">Período</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {[{ v: '30', l: '30 dias' }, { v: '90', l: '90 dias' }, { v: '180', l: '6 meses' }, { v: '365', l: '1 ano' }].map(o => (
                <button
                  key={o.v}
                  onClick={() => setDateRange(o.v)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    dateRange === o.v ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-[500]' : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-[13px]">Agrupar por</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {[{ k: 'day', l: 'Dia' }, { k: 'week', l: 'Semana' }, { k: 'month', l: 'Mês' }].map(o => (
                <button
                  key={o.k}
                  onClick={() => setGroupBy(o.k)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    groupBy === o.k ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-[500]' : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-[13px]">Salvos</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {savedReports.length === 0 && (
                <p className="text-[12px] text-[var(--text-3)] py-2 text-center">Nenhum salvo</p>
              )}
              {savedReports.map(r => (
                <button
                  key={r.id}
                  onClick={() => loadSavedReport(r)}
                  className="w-full text-left px-3 py-2 rounded-lg text-[12px] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  {r.name}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[13px]">Visualização</CardTitle>
              <div className="flex items-center gap-1">
                {CHART_TYPES.map(ct => (
                  <Button
                    key={ct.key}
                    variant={chartType === ct.key ? 'default' : 'ghost'}
                    size="icon-sm"
                    onClick={() => setChartType(ct.key)}
                    title={ct.label}
                  >
                    <ct.icon className="h-3.5 w-3.5" />
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>{renderChart()}</CardContent>
        </Card>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Salvar Relatório</DialogTitle></DialogHeader>
          <div className="py-2">
            <label className="text-[12px] font-[500] text-[var(--text-2)] mb-1">Nome</label>
            <Input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Meu relatório" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
