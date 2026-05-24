'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, Trash2, MessageSquare } from 'lucide-react'

export default function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [variables, setVariables] = useState('')
  const [saving, setSaving] = useState(false)

  const loadTemplates = async () => {
    const res = await fetch('/api/message-templates')
    const json = await res.json()
    setTemplates(json.data || [])
    setLoading(false)
  }

  useEffect(() => { loadTemplates() }, [])

  const handleCreate = async () => {
    if (!title || !content) { toast.error('Preencha título e conteúdo'); return }
    setSaving(true)
    const res = await fetch('/api/message-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        variables: variables.split(',').map(v => v.trim()).filter(Boolean),
      }),
    })
    if (res.ok) {
      toast.success('Template criado!')
      loadTemplates()
      setDialogOpen(false)
      setTitle('')
      setContent('')
      setVariables('')
    } else {
      toast.error('Erro ao criar')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/message-templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    toast.success('Removido')
    loadTemplates()
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500]">Templates de Mensagem</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">Respostas rápidas para o chat</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="h-8 text-[12px] gap-1">
          <Plus className="h-3.5 w-3.5" /> Novo template
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 text-[var(--text-3)]" />
            <p className="text-sm text-[var(--text-3)]">Nenhum template criado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map(t => {
            let vars: string[] = []
            try { vars = JSON.parse(t.variables || '[]') } catch {}
            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-[500] text-[var(--text)]">{t.title}</p>
                      <p className="text-[12px] text-[var(--text-2)] mt-1 line-clamp-2 whitespace-pre-wrap">{t.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-2xs text-[var(--text-3)]">{t.uses} usos</span>
                        {vars.length > 0 && vars.map((v: string) => (
                          <span key={v} className="text-2xs px-1.5 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent)]">{`{${v}}`}</span>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-[var(--destructive)]" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Template</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[12px] font-[500] text-[var(--text-2)]">Título</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Boas vindas" />
            </div>
            <div>
              <label className="text-[12px] font-[500] text-[var(--text-2)]">Conteúdo</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Use {variavel} para placeholders"
                className="w-full h-[120px] text-[13px] p-3 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)] resize-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-[500] text-[var(--text-2)]">Variáveis (separadas por vírgula)</label>
              <Input value={variables} onChange={e => setVariables(e.target.value)} placeholder="clientName, projectName" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Criando...' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
