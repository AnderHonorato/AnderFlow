'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft, Target, CheckCircle2, XCircle } from 'lucide-react'

export default function PortalProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [okrs, setOkrs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackStepId, setFeedbackStepId] = useState<number | null>(null)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch(`/api/okrs?projectId=${id}`).then(r => r.json()),
    ]).then(([pJson, oJson]) => {
      setProject(pJson.data)
      setOkrs(oJson.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleFeedback = async (stepId: number, approved: boolean, comment?: string) => {
    if (!approved && !comment?.trim()) {
      toast.error('Descreva o motivo do ajuste')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/project-updates/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, approved, comment: comment || undefined }),
      })
      if (res.ok) {
        toast.success(approved ? 'Entrega aprovada!' : 'Ajuste solicitado!')
        setFeedbackOpen(false)
        setFeedbackComment('')
      } else {
        toast.error('Erro ao enviar feedback')
      }
    } catch { toast.error('Erro') }
    setSubmitting(false)
  }

  const openFeedback = (stepId: number) => {
    setFeedbackStepId(stepId)
    setFeedbackComment('')
    setFeedbackOpen(true)
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>
  if (!project) return <div className="p-6"><p>Projeto não encontrado</p></div>

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-page-enter">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/portal/projects')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[17px] font-[500]">{project.name}</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">{project.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge status={project.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'}>
          {project.status === 'COMPLETED' ? 'Concluído' : 'Em andamento'}
        </Badge>
        <Progress value={project.progress || 0} className="w-32 h-1.5" />
        <span className="text-[12px] text-[var(--text-3)]">{project.progress || 0}%</span>
      </div>

      {okrs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-[500] flex items-center gap-2">
              <Target className="h-4 w-4 text-[var(--accent)]" /> Metas do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {okrs.map(okr => (
              <div key={okr.id} className="space-y-2">
                <p className="text-[13px] font-[500] text-[var(--text)]">{okr.objective}</p>
                {okr.keyResults.map((kr: any) => {
                  const pct = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0
                  const color = pct < 40 ? 'var(--destructive)' : pct < 70 ? 'var(--warning)' : 'var(--success)'
                  return (
                    <div key={kr.id} className="flex items-center gap-3">
                      <span className="text-[11px] text-[var(--text-2)] w-40 truncate">{kr.title}</span>
                      <Progress value={pct} className="flex-1 h-1.5" />
                      <span className="text-[11px] font-[500] w-16 text-right" style={{ color }}>
                        {kr.currentValue}{kr.unit} / {kr.targetValue}{kr.unit}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {project.stepsData && (() => {
        try {
          const steps = JSON.parse(project.stepsData)
          const stepsArr = Array.isArray(steps) ? steps : (steps.steps || [])
          if (stepsArr.length === 0) return null
          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-[500]">Etapas do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stepsArr.map((step: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                      step.status === 'completed' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                      step.status === 'in_progress' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' :
                      'bg-[var(--surface-2)] text-[var(--text-3)]'
                    }`}>
                      {step.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <p className={`text-[13px] flex-1 ${step.status === 'completed' ? 'text-[var(--text-3)]' : 'text-[var(--text)]'}`}>
                      {step.label || `Etapa ${i + 1}`}
                    </p>
                    {(step.status === 'review' || step.status === 'pending_approval') && (
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] text-[var(--success)]" onClick={() => handleFeedback(step.id, true)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] text-[var(--warning)]" onClick={() => openFeedback(step.id)}>
                          <XCircle className="h-3 w-3 mr-1" /> Ajuste
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        } catch { return null }
      })()}

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Ajuste</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-[11px] text-[var(--text-2)]">Descreva o que precisa ser ajustado:</label>
            <textarea
              value={feedbackComment}
              onChange={e => setFeedbackComment(e.target.value)}
              className="w-full min-h-[100px] rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
              placeholder="Ex: A cor do botão precisa ser alterada..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setFeedbackOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => feedbackStepId && handleFeedback(feedbackStepId, false, feedbackComment)} disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
