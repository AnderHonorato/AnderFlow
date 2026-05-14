'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { FolderKanban, Clock, CheckCircle2, Plus, ArrowUpRight, Loader2 } from 'lucide-react'

export default function PortalDashboard() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const loadProjects = () => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(json => { setProjects(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadProjects() }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, description: form.description, type: 'CUSTOM', priority: 'MEDIUM' }),
    })
    if (res.ok) {
      toast.success('Projeto solicitado com sucesso!')
      setShowNew(false)
      setForm({ name: '', description: '' })
      loadProjects()
    } else {
      toast.error('Erro ao solicitar projeto')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const active = projects.filter((p: any) => p.status !== 'COMPLETED').length
  const completed = projects.filter((p: any) => p.status === 'COMPLETED').length
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((s: number, p: any) => s + p.progress, 0) / projects.length)
    : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Bem-vindo, {session?.user?.name || 'Cliente'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe seus projetos</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Solicitar Projeto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FolderKanban className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xl font-semibold">{active}</p><p className="text-xs text-muted-foreground">Ativos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
          <div><p className="text-xl font-semibold">{completed}</p><p className="text-xs text-muted-foreground">Concluídos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
          <div><p className="text-xl font-semibold">{projects.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><ArrowUpRight className="h-5 w-5 text-info" /></div>
          <div><p className="text-xl font-semibold">{projects.length ? `${avgProgress}%` : '-'}</p><p className="text-xs text-muted-foreground">Média progresso</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-4"><CardTitle className="text-base font-medium">Meus Projetos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto. Clique em Solicitar Projeto!</p>
          )}
          {projects.map((p: any) => (
            <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <Badge variant={p.status === 'COMPLETED' ? 'success' : p.status === 'REVIEW' ? 'warning' : 'info'} className="text-2xs">
                    {p.status === 'COMPLETED' ? 'Concluído' : p.status === 'REVIEW' ? 'Revisão' : 'Em andamento'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Prazo: {p.deadline ? new Date(p.deadline).toLocaleDateString('pt-BR') : 'Não definido'}
                </p>
              </div>
              <Progress value={p.progress} className="w-24 h-1.5" />
              <span className="text-xs font-medium w-8">{p.progress}%</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Novo Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do projeto</label>
              <Input
                placeholder="Ex: E-commerce Premium"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Input
                placeholder="Descreva o que você precisa..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Solicitar Projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
