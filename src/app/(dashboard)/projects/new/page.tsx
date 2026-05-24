'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft, Layers, ChevronRight } from 'lucide-react'

interface Template {
  id: string
  name: string
  description?: string
  tasks: { title: string; description?: string; order: number }[]
}

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/project-templates').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([tJson, cJson]) => {
      setTemplates(tJson.data || [])
      setClients(cJson.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Nome do projeto é obrigatório'); return }

    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          clientId: selectedClientId || undefined,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        const projectId = json.data.id

        if (selectedTemplate && selectedTemplate.tasks.length > 0) {
          await fetch('/api/tasks/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              tasks: selectedTemplate.tasks.map(t => ({
                title: t.title,
                description: t.description || '',
              })),
            }),
          })
        }

        toast.success('Projeto criado!')
        router.push(`/projects/${projectId}`)
      } else {
        toast.error(json.error || 'Erro ao criar projeto')
      }
    } catch {
      toast.error('Erro ao criar projeto')
    }
    setCreating(false)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto animate-page-enter">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[17px] font-[500]">Novo Projeto</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">Preencha os dados para criar um novo projeto</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--text-2)]">Nome do projeto</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Site Institucional" className="h-9 text-xs" autoFocus />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--text-2)]">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Breve descrição do projeto"
              className="w-full min-h-[80px] rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
            />
          </div>

          {clients.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Cliente</label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="">Sem cliente (rascunho)</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} {c.company ? `· ${c.company}` : ''}</option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {templates.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-[500] flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[var(--accent)]" />
              Usar template (opcional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <button
                onClick={() => setSelectedTemplate(null)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  !selectedTemplate
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                    : 'border-[var(--border)] hover:border-[var(--text-3)]'
                }`}
              >
                <p className="text-[13px] font-[500] text-[var(--text)]">Sem template</p>
                <p className="text-[11px] text-[var(--text-3)]">Começar projeto vazio</p>
              </button>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    selectedTemplate?.id === t.id
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                      : 'border-[var(--border)] hover:border-[var(--text-3)]'
                  }`}
                >
                  <div>
                    <p className="text-[13px] font-[500] text-[var(--text)]">{t.name}</p>
                    <p className="text-[11px] text-[var(--text-3)]">
                      {t.tasks.length} tarefas pré-definidas
                      {t.description && ` · ${t.description}`}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-3)]" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleCreate} disabled={creating || !name.trim()} size="sm">
          {creating ? 'Criando...' : 'Criar Projeto'}
        </Button>
      </div>
    </div>
  )
}
