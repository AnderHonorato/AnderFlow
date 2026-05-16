'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { ProjectTimeline, type NodeStatus } from '@/components/projects/project-timeline'
import { IconArrowLeft, IconThumbsUp, IconThumbsDown } from '@/components/icons'

const DEFAULT_STEPS = [
  { id: 1, label: 'Briefing', description: 'Coleta de requisitos e entendimento do projeto' },
  { id: 2, label: 'Planejamento', description: 'Definicao de escopo, cronograma e recursos' },
  { id: 3, label: 'Design', description: 'Criacao de wireframes, UI/UX e prototipos' },
  { id: 4, label: 'Desenvolvimento', description: 'Codificacao e implementacao das funcionalidades' },
  { id: 5, label: 'Testes', description: 'Testes de qualidade, correcoes e ajustes finos' },
  { id: 6, label: 'Deploy', description: 'Publicacao e configuracao do ambiente de producao' },
  { id: 7, label: 'Entrega', description: 'Apresentacao final e documentacao para o cliente' },
]

interface StepState {
  id: number
  status: NodeStatus
  timeEstimate: string
  comments: { text: string; author: string; time: string; type: 'text' | 'image' | 'video' }[]
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState<StepState[]>([])
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [history, setHistory] = useState<{ time: string; action: string }[]>([])

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          setProject(json.data)
          const savedSteps = localStorage.getItem(`project_steps_${id}`)
          if (savedSteps) {
            setSteps(JSON.parse(savedSteps))
          } else {
            const initial = DEFAULT_STEPS.map(s => ({
              id: s.id,
              status: 'waiting' as NodeStatus,
              timeEstimate: '',
              comments: [],
            }))
            setSteps(initial)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const saveSteps = (newSteps: StepState[]) => {
    setSteps(newSteps)
    localStorage.setItem(`project_steps_${id}`, JSON.stringify(newSteps))
  }

  const updateStepStatus = (stepId: number, status: NodeStatus) => {
    const newSteps = steps.map(s => s.id === stepId ? { ...s, status } : s)
    const step = DEFAULT_STEPS.find(s => s.id === stepId)
    const labels: Record<NodeStatus, string> = { waiting: 'Aguardando', in_progress: 'Em andamento', paused: 'Pausado', completed: 'Concluido' }
    setHistory(prev => [{ time: new Date().toLocaleTimeString('pt-BR'), action: `"${step?.label}" → ${labels[status]}` }, ...prev])
    saveSteps(newSteps)
    toast.success(`Etapa "${step?.label}" atualizada para ${labels[status]}`)
  }

  const addComment = (stepId: number, text: string) => {
    const newSteps = steps.map(s => {
      if (s.id !== stepId) return s
      return { ...s, comments: [...s.comments, { text, author: 'Voce', time: new Date().toLocaleTimeString('pt-BR'), type: 'text' as const }] }
    })
    setHistory(prev => [{
      time: new Date().toLocaleTimeString('pt-BR'),
      action: `Comentario adicionado na etapa "${DEFAULT_STEPS.find(s => s.id === stepId)?.label}"`
    }, ...prev])
    saveSteps(newSteps)
    setNewComment('')
  }

  const updateTimeEstimate = (stepId: number, time: string) => {
    const newSteps = steps.map(s => s.id === stepId ? { ...s, timeEstimate: time } : s)
    saveSteps(newSteps)
  }

  const handleApprove = async () => {
    const res = await fetch(`/api/projects/${id}/approve`, { method: 'POST' })
    if (res.ok) {
      toast.success('Projeto aprovado! Briefing enviado ao cliente.')
      setProject((prev: any) => ({ ...prev, status: 'TODO' }))
    } else {
      toast.error('Erro ao aprovar projeto')
    }
  }

  const handleReject = async () => {
    const res = await fetch(`/api/projects/${id}`, {
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

  const timelineNodes = steps.map((s, i) => ({
    id: s.id,
    label: DEFAULT_STEPS[i]?.label || '',
    description: DEFAULT_STEPS[i]?.description || '',
    status: s.status,
    timeEstimate: s.timeEstimate,
    comments: s.comments,
  }))

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>
  if (!project) return <div className="p-6"><p className="text-[var(--text-3)]">Projeto nao encontrado</p></div>

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto animate-page-enter">
      <Link href="/projects" className="inline-flex items-center gap-2 text-[13px] text-[var(--text-3)] hover:text-[var(--text)]">
        <IconArrowLeft className="w-4 h-4" /> Voltar para projetos
      </Link>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[17px] font-[500] tracking-[-0.015em]">{project.name}</h1>
              <p className="text-[12px] text-[var(--text-3)] mt-1">{project.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <Badge status={project.status === 'COMPLETED' ? 'COMPLETED' : project.status === 'DRAFT' ? 'DRAFT' : 'IN_PROGRESS'}>
                  {project.status === 'COMPLETED' ? 'Concluido' : project.status === 'DRAFT' ? 'Rascunho (aguardando aprovacao)' : 'Em andamento'}
                </Badge>
                <span className="text-[12px] text-[var(--text-3)]">
                  Cliente: {project.client?.name} ({project.client?.company})
                </span>
              </div>
              {project.status === 'DRAFT' && (
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" onClick={handleApprove} className="h-7 text-[11px]">
                    <IconThumbsUp className="w-3 h-3" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReject} className="h-7 text-[11px]">
                    <IconThumbsDown className="w-3 h-3" /> Recusar
                  </Button>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[24px] font-[500] text-[var(--accent)]">{progress}%</p>
              <p className="text-[11px] text-[var(--text-3)]">{completedCount}/{totalSteps} etapas concluidas</p>
              <Progress value={progress} className="h-[2px] w-32 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
        <div>
          <h3 className="text-[11px] font-[500] text-[var(--text-3)] uppercase tracking-wider mb-4">Fluxo do Projeto</h3>
          <ProjectTimeline
            nodes={timelineNodes}
            expandedNode={expandedStep}
            onToggle={(id) => setExpandedStep(expandedStep === id ? null : id)}
            onStatusChange={updateStepStatus}
            onTimeChange={updateTimeEstimate}
            onAddComment={addComment}
            newComment={newComment}
            onNewCommentChange={setNewComment}
          />
        </div>

        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Historico</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {history.length === 0 && (
                    <p className="text-[12px] text-[var(--text-3)] text-center py-4">Nenhuma alteracao registrada</p>
                  )}
                  {history.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <span className="text-[var(--text-3)] shrink-0 w-12">{h.time}</span>
                      <span className="text-[var(--text)]">{h.action}</span>
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
