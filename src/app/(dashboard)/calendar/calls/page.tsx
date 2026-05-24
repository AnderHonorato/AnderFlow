'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, CalendarDays, Video, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'future' | 'past'>('future')
  const [showNew, setShowNew] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [form, setForm] = useState({
    clientId: '', projectId: '', title: '', description: '',
    scheduledAt: '', duration: '60', meetLink: '',
  })

  const loadCalls = () => {
    setLoading(true)
    fetch(`/api/calls?filter=${filter}`)
      .then(r => r.json())
      .then(json => setCalls(json.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCalls() }, [filter])

  useEffect(() => {
    fetch('/api/users?role=CLIENT').then(r => r.json()).then(j => setClients(j.data || []))
    fetch('/api/projects').then(r => r.json()).then(j => setProjects(j.data || []))
  }, [])

  const createCall = async () => {
    if (!form.clientId || !form.title || !form.scheduledAt) { toast.error('Preencha os campos obrigatorios'); return }
    const res = await fetch('/api/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, duration: parseInt(form.duration) }),
    })
    if (res.ok) {
      toast.success('Call agendada')
      setShowNew(false)
      loadCalls()
      setForm({ clientId: '', projectId: '', title: '', description: '', scheduledAt: '', duration: '60', meetLink: '' })
    } else toast.error('Erro ao agendar')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Mentorias e Calls</h1>
          <p className="text-sm text-muted-foreground mt-1">Agende reunioes com seus clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--border)]">
            {(['all', 'future', 'past'] as const).map(f => (
              <Button key={f} variant={filter === f ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todas' : f === 'future' ? 'Futuras' : 'Passadas'}
              </Button>
            ))}
          </div>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="mr-2 h-4 w-4" /> Agendar call
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : calls.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma call agendada.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {calls.map(call => {
            const isToday = new Date(call.scheduledAt).toDateString() === new Date().toDateString()
            const isPast = new Date(call.scheduledAt) < new Date()
            const client = clients.find(c => c.id === call.clientId)
            return (
              <Card key={call.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
                    <Video className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{call.title}</p>
                      {isToday && <Badge variant="success" className="text-2xs">Hoje</Badge>}
                      {isPast && call.status === 'scheduled' && <Badge variant="warning" className="text-2xs">Pendente</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {client?.name || client?.company || 'Cliente'}
                      {call.description && ` · ${call.description}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <CalendarDays className="inline h-3 w-3 mr-1" />
                      {new Date(call.scheduledAt).toLocaleDateString('pt-BR')} as {new Date(call.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {call.duration}min
                    </p>
                  </div>
                  <Badge variant={call.status === 'completed' ? 'success' : call.status === 'cancelled' ? 'destructive' : 'secondary'}>
                    {call.status === 'scheduled' ? 'Agendada' : call.status === 'completed' ? 'Realizada' : 'Cancelada'}
                  </Badge>
                  {call.meetLink && (
                    <Button variant="outline" size="sm" onClick={() => window.open(call.meetLink, '_blank')}>
                      <Video className="mr-2 h-3.5 w-3.5" /> Entrar
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Agendar Call</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Cliente *</Label>
              <select
                value={form.clientId}
                onChange={e => setForm({...form, clientId: e.target.value})}
                className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm px-3"
              >
                <option value="">Selecionar cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Projeto (opcional)</Label>
              <select
                value={form.projectId}
                onChange={e => setForm({...form, projectId: e.target.value})}
                className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm px-3"
              >
                <option value="">Nenhum</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Titulo *</Label>
              <Input placeholder="Ex: Reuniao de alinhamento" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descricao</Label>
              <Input placeholder="Pauta da reuniao..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data/Hora *</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duracao (min)</Label>
                <Input type="number" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Link Meet/Zoom</Label>
              <Input placeholder="https://meet.google.com/..." value={form.meetLink} onChange={e => setForm({...form, meetLink: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={createCall}>Agendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
