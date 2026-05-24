'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2, Layers } from 'lucide-react'

interface Template {
  id: string
  name: string
  description?: string
  tasks: { title: string; description?: string; order: number }[]
  createdAt: string
}

export default function TemplatesSettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newTasks, setNewTasks] = useState<{ title: string; description: string }[]>([{ title: '', description: '' }])
  const [saving, setSaving] = useState(false)

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/project-templates')
      const json = await res.json()
      setTemplates(json.data || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadTemplates() }, [])

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Nome é obrigatório'); return }
    const validTasks = newTasks.filter(t => t.title.trim())
    if (validTasks.length === 0) { toast.error('Adicione pelo menos uma task'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/project-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || null,
          tasks: validTasks.map((t, i) => ({ title: t.title.trim(), description: t.description.trim(), order: i + 1 })),
        }),
      })
      if (res.ok) {
        toast.success('Template criado!')
        loadTemplates()
        handleClose()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao criar template')
      }
    } catch {
      toast.error('Erro ao criar template')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/project-templates?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id))
        toast.success('Template removido')
      }
    } catch {
      toast.error('Erro ao remover template')
    }
  }

  const handleClose = () => {
    setDialogOpen(false)
    setNewName('')
    setNewDesc('')
    setNewTasks([{ title: '', description: '' }])
  }

  const addTaskField = () => setNewTasks(prev => [...prev, { title: '', description: '' }])
  const removeTaskField = (i: number) => setNewTasks(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500]">Templates de Projeto</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">Modelos reutilizáveis com tarefas pré-definidas</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo Template
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-[var(--surface-2)] rounded-xl animate-pulse" />)}</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Layers className="h-8 w-8 mx-auto mb-3 text-[var(--text-3)]" />
            <p className="text-sm text-[var(--text-3)]">Nenhum template cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[var(--accent)] shrink-0" />
                    <p className="text-[14px] font-[500] text-[var(--text)]">{t.name}</p>
                    <span className="text-[11px] text-[var(--text-3)]">{t.tasks.length} tarefas</span>
                  </div>
                  {t.description && (
                    <p className="text-[12px] text-[var(--text-3)] mt-1">{t.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.tasks.slice(0, 5).map((task, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-3)]">
                        {task.title}
                      </span>
                    ))}
                    {t.tasks.length > 5 && (
                      <span className="text-[10px] text-[var(--text-3)]">+{t.tasks.length - 5}</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-[var(--text-3)]" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-[500]">Novo Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Nome</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Landing Page" className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Descrição</label>
              <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Opcional" className="h-9 text-xs" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-[var(--text-2)]">Tarefas</label>
                <Button variant="ghost" size="sm" onClick={addTaskField} className="h-6 text-[10px]">
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {newTasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-3)] mt-2 shrink-0 w-4">{i + 1}.</span>
                    <div className="flex-1 space-y-1.5">
                      <Input
                        value={task.title}
                        onChange={e => {
                          const updated = [...newTasks]
                          updated[i].title = e.target.value
                          setNewTasks(updated)
                        }}
                        placeholder="Título da tarefa"
                        className="h-8 text-xs"
                      />
                      <Input
                        value={task.description}
                        onChange={e => {
                          const updated = [...newTasks]
                          updated[i].description = e.target.value
                          setNewTasks(updated)
                        }}
                        placeholder="Descrição (opcional)"
                        className="h-8 text-xs"
                      />
                    </div>
                    {newTasks.length > 1 && (
                      <Button variant="ghost" size="icon-sm" onClick={() => removeTaskField(i)} className="mt-1">
                        <Trash2 className="h-3 w-3 text-[var(--text-3)]" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? 'Criando...' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
