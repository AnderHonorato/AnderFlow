'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Activity, AlertTriangle } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'operational', label: 'Operacional', color: 'var(--success)' },
  { value: 'degraded', label: 'Degradado', color: 'var(--warning)' },
  { value: 'outage', label: 'Indisponível', color: 'var(--destructive)' },
]

export default function StatusPageSettings() {
  const [components, setComponents] = useState<any[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [, setLoading] = useState(true)
  const [incidentOpen, setIncidentOpen] = useState(false)
  const [incidentTitle, setIncidentTitle] = useState('')
  const [incidentMsg, setIncidentMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [compRes, _incRes] = await Promise.all([
        fetch('/api/status').then(r => r.json()),
        fetch('/api/status').then(r => r.json()),
      ])
      setComponents(compRes.data?.components || [])
      setIncidents(compRes.data?.incidents || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateComponentStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ componentId: id, status }),
      })
      setComponents(prev => prev.map(c => c.id === id ? { ...c, status } : c))
      toast.success('Status atualizado')
    } catch { toast.error('Erro ao atualizar') }
  }

  const createIncident = async () => {
    if (!incidentTitle.trim()) return
    setSaving(true)
    try {
      await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: incidentTitle, message: incidentMsg }),
      })
      toast.success('Incidente criado')
      load()
      handleClose()
    } catch { toast.error('Erro ao criar incidente') }
    setSaving(false)
  }

  const resolveIncident = async (id: string) => {
    try {
      await fetch('/api/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId: id, resolved: true }),
      })
      setIncidents(prev => prev.map(i => i.id === id ? { ...i, resolvedAt: new Date().toISOString() } : i))
      toast.success('Incidente resolvido')
    } catch { toast.error('Erro') }
  }

  const handleClose = () => {
    setIncidentOpen(false)
    setIncidentTitle('')
    setIncidentMsg('')
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-page-enter">
      <div>
        <h1 className="text-[17px] font-[500]">Página de Status</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-1">Gerencie o status público do sistema em <a href="/status" target="_blank" className="text-[var(--accent)]">/status</a></p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[13px] font-[500] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--accent)]" /> Componentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {components.map(c => {
            return (
              <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-b-0">
                <span className="text-[13px] text-[var(--text)]">{c.name}</span>
                <select
                  value={c.status}
                  onChange={e => updateComponentStatus(c.id, e.target.value)}
                  className="h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-[13px] font-[500] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--warning)]" /> Incidentes
          </CardTitle>
          <Button size="sm" onClick={() => setIncidentOpen(true)}>
            <Plus className="mr-1 h-3 w-3" /> Novo incidente
          </Button>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-[12px] text-[var(--text-3)] text-center py-4">Nenhum incidente ativo</p>
          ) : (
            incidents.map(inc => (
              <div key={inc.id} className="flex items-start justify-between py-3 border-b border-[var(--border)] last:border-b-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-[500] text-[var(--text)]">{inc.title}</p>
                    {!inc.resolvedAt && <Badge variant="warning" className="text-2xs">Ativo</Badge>}
                    {inc.resolvedAt && <Badge variant="success" className="text-2xs">Resolvido</Badge>}
                  </div>
                  <p className="text-[11px] text-[var(--text-3)] mt-0.5">{inc.message}</p>
                  <p className="text-[10px] text-[var(--text-3)] mt-1">
                    {new Date(inc.createdAt).toLocaleString('pt-BR')}
                    {inc.resolvedAt && ` · Resolvido ${new Date(inc.resolvedAt).toLocaleString('pt-BR')}`}
                  </p>
                </div>
                {!inc.resolvedAt && (
                  <Button variant="outline" size="sm" onClick={() => resolveIncident(inc.id)} className="h-7 text-[10px]">
                    Resolver
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={incidentOpen} onOpenChange={o => { if (!o) handleClose() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Incidente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Título</label>
              <Input value={incidentTitle} onChange={e => setIncidentTitle(e.target.value)} placeholder="Ex: Lentidão no portal" className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Mensagem</label>
              <Input value={incidentMsg} onChange={e => setIncidentMsg(e.target.value)} placeholder="Descreva o incidente" className="h-9 text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
            <Button size="sm" onClick={createIncident} disabled={saving}>{saving ? 'Criando...' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
