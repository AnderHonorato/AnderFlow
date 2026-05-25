'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Plus, Sparkles, Bug, Zap,
} from 'lucide-react'

const TYPE_ICONS: Record<string, any> = { feature: Sparkles, fix: Bug, improvement: Zap }
const TYPE_OPTIONS = [
  { value: 'feature', label: 'Feature', icon: Sparkles },
  { value: 'fix', label: 'Correcao', icon: Bug },
  { value: 'improvement', label: 'Melhoria', icon: Zap },
]

export default function ChangelogAdminPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ version: '', title: '', description: '', type: 'feature', isPublic: false })

  const loadEntries = () => {
    setLoading(true)
    fetch('/api/changelog?admin=true')
      .then(r => r.json())
      .then(json => setEntries(json.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadEntries() }, [])

  const createEntry = async () => {
    const res = await fetch('/api/changelog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { toast.success('Entrada criada'); setShowNew(false); loadEntries(); setForm({ version: '', title: '', description: '', type: 'feature', isPublic: false }) }
    else toast.error('Erro ao criar')
  }

  const togglePublic = async (id: string, current: boolean) => {
    const res = await fetch('/api/changelog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isPublic: !current }),
    })
    if (res.ok) { toast.success('Atualizado'); loadEntries() }
    else toast.error('Erro ao atualizar')
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Changelog</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie as entradas do changelog publico</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" /> Criar entrada
        </Button>
      </div>

      <div className="space-y-3">
        {entries.length === 0 && <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhuma entrada ainda.</CardContent></Card>}
        {entries.map(entry => {
          const IconComp = TYPE_ICONS[entry.type] || Sparkles
          return (
            <Card key={entry.id} className="card-hover">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <IconComp className="h-4 w-4 shrink-0" style={{ color: entry.type === 'feature' ? 'var(--accent)' : entry.type === 'fix' ? 'var(--destructive)' : 'var(--info)' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">v{entry.version} - {new Date(entry.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <Badge variant={entry.isPublic ? 'success' : 'secondary'} className="text-2xs shrink-0">
                  {entry.isPublic ? 'Publico' : 'Privado'}
                </Badge>
                <div className="flex items-center gap-1.5">
                  <Switch checked={entry.isPublic} onCheckedChange={() => togglePublic(entry.id, entry.isPublic)} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova entrada</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Versao</Label>
              <Input placeholder="1.0.0" value={form.version} onChange={e => setForm({...form, version: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Titulo</Label>
              <Input placeholder="Titulo da entrada" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <Button key={opt.value} variant={form.type === opt.value ? 'default' : 'outline'} size="sm" onClick={() => setForm({...form, type: opt.value})}>
                    <opt.icon className="mr-1.5 h-3.5 w-3.5" /> {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descricao</Label>
              <textarea
                className="w-full h-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm p-3 resize-y"
                placeholder="Descricao da mudanca..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Tornar publico</Label>
              <Switch checked={form.isPublic} onCheckedChange={v => setForm({...form, isPublic: v})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={createEntry} disabled={!form.version || !form.title || !form.description}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
