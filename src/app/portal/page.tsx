'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { IconProject, IconCheck, IconAnalytics, IconPlus, IconLoader } from '@/components/icons'

export default function PortalDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
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
      toast.success('Projeto solicitado!')
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

  const active = projects.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length
  const completed = projects.filter((p: any) => p.status === 'COMPLETED').length
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((s: number, p: any) => s + (p.progress || 0), 0) / projects.length)
    : 0

  return (
    <div className="p-6 space-y-5 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-[500] tracking-[-0.015em]">
            Bem-vindo, {session?.user?.name || 'Cliente'}
          </h2>
          <p className="text-[12px] text-[var(--text-3)] mt-1">Acompanhe seus projetos</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <IconPlus className="w-[14px] h-[14px]" /> Solicitar Projeto
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-subtle)]"><IconProject className="w-[16px] h-[16px] text-[var(--accent)]" /></div>
          <div><p className="text-[17px] font-[500]">{active}</p><p className="text-[11px] text-[var(--text-3)]">Ativos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--success-subtle)]"><IconCheck className="w-[16px] h-[16px] text-[var(--success)]" /></div>
          <div><p className="text-[17px] font-[500]">{completed}</p><p className="text-[11px] text-[var(--text-3)]">Concluidos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--warning-subtle)]"><IconAnalytics className="w-[16px] h-[16px] text-[var(--warning)]" /></div>
          <div><p className="text-[17px] font-[500]">{projects.length}</p><p className="text-[11px] text-[var(--text-3)]">Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--info-subtle)]"><IconAnalytics className="w-[16px] h-[16px] text-[var(--info)]" /></div>
          <div><p className="text-[17px] font-[500]">{projects.length ? `${avgProgress}%` : '-'}</p><p className="text-[11px] text-[var(--text-3)]">Media progresso</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Meus Projetos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.length === 0 && (
            <p className="text-[13px] text-[var(--text-3)] text-center py-8">Nenhum projeto. Clique em Solicitar Projeto!</p>
          )}
          {projects.map((p: any) => (
            <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-[500] truncate">{p.name}</p>
                  <Badge status={p.status === 'COMPLETED' ? 'COMPLETED' : p.status === 'REVIEW' ? 'REVIEW' : p.status === 'PENDING' ? 'PENDING' : p.status === 'DRAFT' ? 'DRAFT' : p.status === 'TODO' ? 'TODO' : 'IN_PROGRESS'}>
                    {p.status === 'COMPLETED' ? 'Concluido' : p.status === 'REVIEW' ? 'Revisao' : p.status === 'PENDING' ? 'Solicitacao' : p.status === 'DRAFT' ? 'Rascunho' : p.status === 'TODO' ? 'A fazer' : 'Em andamento'}
                  </Badge>
                  {p.status === 'TODO' && (
                    <Button size="sm" className="h-6 text-[10px]" onClick={() => router.push(`/projects/${p.id}`)}>
                      Ver <IconProject className="w-[10px] h-[10px]" />
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-3)] mt-0.5">
                  Prazo: {p.deadline ? new Date(p.deadline).toLocaleDateString('pt-BR') : 'Nao definido'}
                </p>
              </div>
              <Progress value={p.progress || 0} className="w-24 h-[2px]" />
              <span className="text-[12px] font-[500] w-8">{p.progress || 0}%</span>
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
              <label>Nome do projeto</label>
              <Input placeholder="Ex: E-commerce Premium" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="space-y-2">
              <label>Descricao (opcional)</label>
              <Input placeholder="Descreva o que voce precisa..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name.trim()}>
              {saving && <IconLoader className="w-[14px] h-[14px] animate-spin" />}
              Solicitar Projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
