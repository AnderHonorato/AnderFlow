'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  ArrowLeft, CheckCircle2, Circle, Play, Pause,
  Clock, Send, Loader2, Plus, Image, Paperclip,
  ChevronDown, ChevronRight, ThumbsUp, ThumbsDown
} from 'lucide-react'

// Etapas padrão de qualquer projeto
const DEFAULT_STEPS = [
  { id: 1, label: 'Briefing', description: 'Coleta de requisitos e entendimento do projeto', icon: '📋' },
  { id: 2, label: 'Planejamento', description: 'Definição de escopo, cronograma e recursos', icon: '📐' },
  { id: 3, label: 'Design', description: 'Criação de wireframes, UI/UX e protótipos', icon: '🎨' },
  { id: 4, label: 'Desenvolvimento', description: 'Codificação e implementação das funcionalidades', icon: '💻' },
  { id: 5, label: 'Testes', description: 'Testes de qualidade, correções e ajustes finos', icon: '🧪' },
  { id: 6, label: 'Deploy', description: 'Publicação e configuração do ambiente de produção', icon: '🚀' },
  { id: 7, label: 'Entrega', description: 'Apresentação final e documentação para o cliente', icon: '✅' },
]

type StepStatus = 'waiting' | 'in_progress' | 'paused' | 'completed'

interface StepState {
  id: number
  status: StepStatus
  timeEstimate: string
  comments: { text: string; author: string; time: string; type: 'text' | 'image' | 'video' }[]
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState<StepState[]>([])
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [history, setHistory] = useState<{ time: string; action: string }[]>([])

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          setProject(json.data)
          const savedSteps = localStorage.getItem(`project_steps_${params.id}`)
          if (savedSteps) {
            setSteps(JSON.parse(savedSteps))
          } else {
            const initial = DEFAULT_STEPS.map(s => ({
              id: s.id,
              status: 'waiting' as StepStatus,
              timeEstimate: '',
              comments: [],
            }))
            setSteps(initial)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  const saveSteps = (newSteps: StepState[]) => {
    setSteps(newSteps)
    localStorage.setItem(`project_steps_${params.id}`, JSON.stringify(newSteps))
  }

  const updateStepStatus = (stepId: number, status: StepStatus) => {
    const newSteps = steps.map(s => s.id === stepId ? { ...s, status } : s)
    const step = DEFAULT_STEPS.find(s => s.id === stepId)
    const labels = { waiting: 'Aguardando', in_progress: 'Em andamento', paused: 'Pausado', completed: 'Concluído' }
    setHistory(prev => [{ time: new Date().toLocaleTimeString('pt-BR'), action: `"${step?.label}" → ${labels[status]}` }, ...prev])
    saveSteps(newSteps)
    toast.success(`Etapa "${step?.label}" atualizada para ${labels[status]}`)
  }

  const addComment = (stepId: number) => {
    if (!newComment.trim()) return
    setAddingComment(true)
    const newSteps = steps.map(s => {
      if (s.id !== stepId) return s
      return { ...s, comments: [...s.comments, { text: newComment, author: 'Você', time: new Date().toLocaleTimeString('pt-BR'), type: 'text' as const }] }
    })
    setHistory(prev => [{
      time: new Date().toLocaleTimeString('pt-BR'),
      action: `Comentário adicionado na etapa "${DEFAULT_STEPS.find(s => s.id === stepId)?.label}"`
    }, ...prev])
    saveSteps(newSteps)
    setNewComment('')
    setAddingComment(false)
  }

  const updateTimeEstimate = (stepId: number, time: string) => {
    const newSteps = steps.map(s => s.id === stepId ? { ...s, timeEstimate: time } : s)
    saveSteps(newSteps)
  }

  const handleApprove = async () => {
    const res = await fetch(`/api/projects/${params.id}/approve`, { method: 'POST' })
    if (res.ok) {
      toast.success('Projeto aprovado! Briefing enviado ao cliente.')
      setProject((prev: any) => ({ ...prev, status: 'TODO' }))
    } else {
      toast.error('Erro ao aprovar projeto')
    }
  }

  const handleReject = async () => {
    const res = await fetch(`/api/projects/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
    if (res.ok) {
      toast.success('Projeto recusado.')
      window.location.href = '/projects'
    } else {
      toast.error('Erro ao recusar projeto')
    }
  }

  const completedCount = steps.filter(s => s.status === 'completed').length
  const totalSteps = steps.length
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-success" />
      case 'in_progress': return <div className="h-5 w-5 rounded-full border-2 border-primary bg-primary/20 animate-pulse" />
      case 'paused': return <Pause className="h-5 w-5 text-warning" />
      default: return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>
  if (!project) return <div className="p-6"><p className="text-muted-foreground">Projeto não encontrado</p></div>

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para projetos
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-medium">{project.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant={project.status === 'COMPLETED' ? 'success' : project.status === 'DRAFT' ? 'warning' : 'info'}>
                  {project.status === 'COMPLETED' ? 'Concluído' : project.status === 'DRAFT' ? 'Rascunho (aguardando aprovação)' : 'Em andamento'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Cliente: {project.client?.name} ({project.client?.company})
                </span>
              </div>
              {project.status === 'DRAFT' && (
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" onClick={handleApprove} className="h-7 text-xs">
                    <ThumbsUp className="mr-1 h-3 w-3" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReject} className="h-7 text-xs">
                    <ThumbsDown className="mr-1 h-3 w-3" /> Recusar
                  </Button>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{progress}%</p>
              <p className="text-xs text-muted-foreground">{completedCount}/{totalSteps} etapas concluídas</p>
              <Progress value={progress} className="h-2 w-32 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Fluxo do Projeto</h3>
          <div className="relative pl-1">
            {steps.map((step, i) => {
              const stepDef = DEFAULT_STEPS[step.id - 1]
              const isExpanded = expandedStep === step.id
              const isLast = i === steps.length - 1

              return (
                <div key={step.id} className="relative">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0 w-6">
                      <div className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-2xs font-bold transition-colors ${
                        step.status === 'completed' ? 'bg-[var(--success)] text-white' :
                        step.status === 'in_progress' ? 'bg-[var(--primary)] text-white' :
                        step.status === 'paused' ? 'bg-[var(--warning)] text-white' :
                        'bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : step.status === 'in_progress' ? (
                          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        ) : (
                          stepDef.id
                        )}
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 min-h-[20px] my-0.5" style={{ backgroundColor: step.status === 'completed' ? 'var(--success)' : step.status === 'in_progress' ? 'var(--primary)' : step.status === 'paused' ? 'var(--warning)' : 'var(--border)' }} />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                        className="w-full flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2 text-left min-w-0">
                          <span className="text-sm font-medium text-[var(--text)]">{stepDef.label}</span>
                          {step.timeEstimate && (
                            <span className="text-2xs text-[var(--text-muted)] flex items-center gap-0.5 shrink-0">
                              <Clock className="h-2.5 w-2.5" /> {step.timeEstimate}
                            </span>
                          )}
                        </div>
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" /> : <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-2.5 pl-1 animate-fade-in">
                          <p className="text-xs text-[var(--text-muted)]">{stepDef.description}</p>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Button size="sm" variant={step.status === 'in_progress' ? 'default' : 'outline'}
                              onClick={() => updateStepStatus(step.id, 'in_progress')} className="h-7 text-2xs px-2">
                              <Play className="mr-1 h-2.5 w-2.5" /> Iniciar
                            </Button>
                            <Button size="sm" variant={step.status === 'paused' ? 'secondary' : 'ghost'}
                              onClick={() => updateStepStatus(step.id, 'paused')} className="h-7 text-2xs px-2">
                              <Pause className="mr-1 h-2.5 w-2.5" /> Pausar
                            </Button>
                            <Button size="sm" variant={step.status === 'completed' ? 'success' : 'outline'}
                              onClick={() => updateStepStatus(step.id, 'completed')} className="h-7 text-2xs px-2">
                              <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> Concluir
                            </Button>
                            <div className="flex items-center gap-1 ml-1">
                              <Clock className="h-3 w-3 text-[var(--text-muted)]" />
                              <Input placeholder="Tempo" value={step.timeEstimate}
                                onChange={e => updateTimeEstimate(step.id, e.target.value)}
                                className="h-7 text-2xs w-28" />
                            </div>
                          </div>

                          {step.comments.length > 0 && (
                            <div className="space-y-1.5 bg-[var(--surface-hover)] rounded p-2.5">
                              {step.comments.map((c, ci) => (
                                <div key={ci} className="text-xs">
                                  <span className="font-medium text-[var(--text)]">{c.author}</span>
                                  <span className="text-[var(--text-muted)] ml-1">• {c.time}</span>
                                  <p className="mt-0.5 text-[var(--text-secondary)]">{c.text}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <Input placeholder="Comentário..." value={expandedStep === step.id ? newComment : ''}
                              onChange={e => setNewComment(e.target.value)}
                              className="h-7 text-2xs flex-1"
                              onKeyDown={e => { if (e.key === 'Enter') addComment(step.id) }} />
                            <Button size="icon-sm" onClick={() => addComment(step.id)} disabled={addingComment || !newComment.trim()}>
                              <Send className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" title="Anexar imagem">
                              <Image className="h-3 w-3 text-[var(--text-muted)]" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" title="Anexar arquivo">
                              <Paperclip className="h-3 w-3 text-[var(--text-muted)]" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Histórico de alterações */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {history.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma alteração registrada</p>
                  )}
                  {history.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground shrink-0 w-12">{h.time}</span>
                      <span className="text-foreground">{h.action}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
