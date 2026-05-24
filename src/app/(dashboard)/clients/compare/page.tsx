'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, ArrowUpRight, Star, Download, Users } from 'lucide-react'

interface ClientMetrics {
  revenue: number
  projectCount: number
  completedProjects: number
  ticketCount: number
  resolvedTickets: number
  avgNps: number
  lastActivity: string | null
  avgResponseTime: number
}

export default function ClientsComparePage() {
  const [clients, setClients] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [metrics, setMetrics] = useState<Record<string, ClientMetrics>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/users?role=CLIENT')
      .then(r => r.json())
      .then(json => { setClients(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selected.length === 0) return
    selected.forEach(async id => {
      if (metrics[id]) return
      const res = await fetch(`/api/clients/${id}/metrics`)
      const json = await res.json()
      if (json.data) {
        setMetrics(prev => ({ ...prev, [id]: json.data }))
      }
    })
  }, [selected])

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20)

  const toggleClient = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) :
      prev.length < 4 ? [...prev, id] : prev
    )
  }

  const getMaxKey = (key: keyof ClientMetrics) => {
    const vals = selected.map(id => metrics[id]?.[key] ?? 0)
    const max = Math.max(0, ...vals)
    return max
  }

  const exportCSV = () => {
    const rows = [['Cliente', 'Receita', 'Projetos', 'Concluidos', 'Tickets', 'Resolvidos', 'NPS', 'Tempo Medio Resposta']]
    selected.forEach(id => {
      const m = metrics[id]
      if (!m) return
      const name = clients.find(c => c.id === id)?.name || id
      rows.push([name, String(m.revenue), String(m.projectCount), String(m.completedProjects), String(m.ticketCount), String(m.resolvedTickets), String(m.avgNps), String(m.avgResponseTime)])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'comparativo-clientes.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Comparar Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare metricas entre ate 4 clientes</p>
        </div>
        {selected.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {filtered.map(client => (
              <Badge
                key={client.id}
                variant={selected.includes(client.id) ? 'default' : 'secondary'}
                className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-1.5"
                onClick={() => toggleClient(client.id)}
              >
                {client.company || client.name}
              </Badge>
            ))}
          </div>
          {selected.length > 0 && <p className="text-xs text-muted-foreground">{selected.length}/4 clientes selecionados</p>}
        </CardContent>
      </Card>

      {selected.length > 0 && (
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
          {selected.map(id => {
            const m = metrics[id]
            const client = clients.find(c => c.id === id)
            if (!m) return <Card key={id}><CardContent className="p-4"><Skeleton className="h-48" /></CardContent></Card>

            const rows: { label: string; value: string | number; key: keyof ClientMetrics; format?: string }[] = [
              { label: 'Receita Total', value: m.revenue, key: 'revenue', format: 'currency' },
              { label: 'Projetos', value: `${m.completedProjects}/${m.projectCount}`, key: 'projectCount' },
              { label: 'Tickets', value: `${m.resolvedTickets}/${m.ticketCount}`, key: 'ticketCount' },
              { label: 'NPS', value: m.avgNps, key: 'avgNps' },
              { label: 'Tempo Medio Resposta', value: m.avgResponseTime, key: 'avgResponseTime', format: 'hours' },
            ]

            return (
              <Card key={id} className="card-hover">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--accent)]" />
                    <h3 className="text-sm font-semibold">{client?.company || client?.name}</h3>
                  </div>
                  {rows.map(row => {
                    const max = getMaxKey(row.key)
                    const val = typeof row.value === 'number' ? row.value : 0
                    const isMax = val === max && max > 0
                    return (
                      <div key={row.label} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">{row.label}</span>
                          <span className={`text-sm font-semibold ${isMax ? 'text-success' : 'text-[var(--text-2)]'}`}>
                            {row.format === 'currency' ? `R$ ${Number(row.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` :
                             row.format === 'hours' ? `${row.value}h` :
                             row.value}
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-[var(--surface-2)]">
                          <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${max > 0 ? (val / max) * 100 : 0}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
