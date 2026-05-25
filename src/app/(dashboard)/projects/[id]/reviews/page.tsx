'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, Bot, MessageSquare, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = { pending: 'Pendente', approved: 'Aprovado', changes_requested: 'Requer mudancas' }
const STATUS_COLORS: Record<string, string> = { pending: 'var(--warning)', approved: 'var(--success)', changes_requested: 'var(--destructive)' }

export default function CodeReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [aiReviewOpen, setAiReviewOpen] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)
  const [form, setForm] = useState({
    projectId: '', title: '', description: '', codeSnippet: '', language: 'javascript',
  })
  const [projects, setProjects] = useState<any[]>([])

  const loadReviews = () => {
    setLoading(true)
    fetch('/api/code-reviews')
      .then(r => r.json())
      .then(json => setReviews(json.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReviews()
    fetch('/api/projects').then(r => r.json()).then(j => setProjects(j.data || []))
  }, [])

  const createReview = async () => {
    if (!form.projectId || !form.title) { toast.error('Preencha os campos obrigatorios'); return }
    const res = await fetch('/api/code-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { toast.success('Review criada'); setShowNew(false); loadReviews() }
    else toast.error('Erro ao criar')
  }

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/code-reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) { toast.success('Status atualizado'); loadReviews() }
  }

  const runAiReview = async (code: string, language: string) => {
    setAiReviewOpen(true)
    const res = await fetch('/api/ai/review-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, context: 'Code review' }),
    })
    const json = await res.json()
    setAiResult(json)
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Code Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">Revise e analise codigo com IA</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova review
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map(review => (
          <Card key={review.id} className="card-hover cursor-pointer" onClick={() => setSelectedReview(review)}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-2xs">{review.language || 'js'}</Badge>
                <Badge style={{ background: STATUS_COLORS[review.status] || 'var(--surface-3)' }} className="text-2xs text-white">
                  {STATUS_LABELS[review.status] || review.status}
                </Badge>
              </div>
              <p className="text-sm font-medium">{review.title}</p>
              {review.description && <p className="text-xs text-muted-foreground line-clamp-2">{review.description}</p>}
              {review.codeSnippet && (
                <pre className="text-2xs bg-[var(--surface-2)] rounded-md p-2 max-h-20 overflow-hidden text-muted-foreground">
                  {review.codeSnippet.slice(0, 200)}
                </pre>
              )}
              <div className="flex items-center justify-between">
                <span className="text-2xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</span>
                <span className="text-2xs text-muted-foreground">{review.comments?.length || 0} comentarios</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Review Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Code Review</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Projeto</Label>
              <select value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})}
                className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm px-3">
                <option value="">Selecionar projeto...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <Input placeholder="Titulo *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            <Input placeholder="Descricao" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <select value={form.language} onChange={e => setForm({...form, language: e.target.value})}
              className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm px-3">
              <option value="javascript">JavaScript</option><option value="typescript">TypeScript</option>
              <option value="python">Python</option><option value="css">CSS</option><option value="html">HTML</option>
              <option value="sql">SQL</option><option value="other">Outro</option>
            </select>
            <textarea
              className="w-full h-48 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm p-3 font-mono resize-y"
              placeholder="Cole o codigo aqui..."
              value={form.codeSnippet}
              onChange={e => setForm({...form, codeSnippet: e.target.value})}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={createReview} disabled={!form.projectId || !form.title}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedReview?.title}</DialogTitle></DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedReview.language}</Badge>
                <Badge style={{ background: STATUS_COLORS[selectedReview.status] || 'var(--surface-3)' }} className="text-white">
                  {STATUS_LABELS[selectedReview.status]}
                </Badge>
              </div>

              {selectedReview.codeSnippet && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Codigo</Label>
                    <Button variant="outline" size="sm" onClick={() => runAiReview(selectedReview.codeSnippet, selectedReview.language)}>
                      <Bot className="mr-1.5 h-3.5 w-3.5" /> Review com IA
                    </Button>
                  </div>
                  <pre className="bg-[var(--surface-2)] rounded-lg p-3 text-xs overflow-x-auto max-h-60">{selectedReview.codeSnippet}</pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => updateStatus(selectedReview.id, 'approved')}>
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-success" /> Aprovar
                </Button>
                <Button variant="outline" size="sm" onClick={() => updateStatus(selectedReview.id, 'changes_requested')}>
                  <AlertTriangle className="mr-1.5 h-3.5 w-3.5 text-warning" /> Requer mudancas
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Review Result Dialog */}
      <Dialog open={aiReviewOpen} onOpenChange={setAiReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Review da IA</DialogTitle></DialogHeader>
          {aiResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{aiResult.score}/10</span>
                <Badge variant={aiResult.score >= 7 ? 'success' : aiResult.score >= 4 ? 'warning' : 'destructive'}>
                  {aiResult.score >= 7 ? 'Bom' : aiResult.score >= 4 ? 'Medio' : 'Ruim'}
                </Badge>
              </div>
              <p className="text-sm">{aiResult.summary}</p>
              {aiResult.issues?.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Problemas encontrados</Label>
                  {aiResult.issues.map((issue: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--surface-2)]">
                      {issue.severity === 'critical' ? <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> :
                       issue.severity === 'warning' ? <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" /> :
                       <MessageSquare className="h-4 w-4 text-info shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-xs font-medium">{issue.description}</p>
                        {issue.line && <p className="text-2xs text-muted-foreground">Linha {issue.line}</p>}
                        {issue.suggestion && <p className="text-2xs text-success mt-0.5">Sugestao: {issue.suggestion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setAiReviewOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
