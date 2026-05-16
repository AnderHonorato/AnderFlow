'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ProjectTimeline, type NodeStatus } from '@/components/projects/project-timeline'
import { IconArrowLeft, IconThumbsUp, IconThumbsDown, IconCheck, IconClose, IconLoader, IconFile } from '@/components/icons'

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
  const { data: session } = useSession()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState<StepState[]>([])
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [history, setHistory] = useState<{ time: string; action: string }[]>([])
  const [approveOpen, setApproveOpen] = useState(false)
  const [proposalMsg, setProposalMsg] = useState('')
  const [proposalValue, setProposalValue] = useState('')
  const [approveLoading, setApproveLoading] = useState(false)
  const [contractOpen, setContractOpen] = useState(false)
  const [contract, setContract] = useState<any>(null)
  const [responseLoading, setResponseLoading] = useState(false)
  const [signLoading, setSignLoading] = useState(false)
  const [stepTimes, setStepTimes] = useState<Record<number, number>>({})
  const [delayMargin, setDelayMargin] = useState(20)

  const totalDays = Object.values(stepTimes).reduce((sum, d) => sum + d, 0)
  const totalWithMargin = Math.ceil(totalDays * (1 + delayMargin / 100))

  const isAdmin = session?.user?.role === 'ADMIN'
  const isClient = session?.user?.id === project?.clientId
  const isDraft = project?.status === 'DRAFT'
  const isReview = project?.status === 'REVIEW'
  const isCancelled = project?.status === 'CANCELLED'

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          setProject(json.data)
          const savedSteps = localStorage.getItem(`anderflow_project_steps_${id}`)
          if (savedSteps) {
            setSteps(JSON.parse(savedSteps))
          } else {
            setSteps(DEFAULT_STEPS.map(s => ({
              id: s.id, status: 'waiting' as NodeStatus, timeEstimate: '', comments: [],
            })))
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const saveSteps = (newSteps: StepState[]) => {
    setSteps(newSteps)
    localStorage.setItem(`anderflow_project_steps_${id}`, JSON.stringify(newSteps))
  }

  const updateStepStatus = (stepId: number, status: NodeStatus) => {
    const newSteps = steps.map(s => s.id === stepId ? { ...s, status } : s)
    const step = DEFAULT_STEPS.find(s => s.id === stepId)
    const labels: Record<NodeStatus, string> = { waiting: 'Aguardando', in_progress: 'Em andamento', paused: 'Pausado', completed: 'Concluido' }
    setHistory(prev => [{ time: new Date().toLocaleTimeString('pt-BR'), action: `"${step?.label}" → ${labels[status]}` }, ...prev])
    saveSteps(newSteps)
    toast.success(`Etapa "${step?.label}" atualizada`)
  }

  const addComment = (stepId: number, text: string) => {
    const newSteps = steps.map(s => {
      if (s.id !== stepId) return s
      return { ...s, comments: [...s.comments, { text, author: 'Voce', time: new Date().toLocaleTimeString('pt-BR'), type: 'text' as const }] }
    })
    setHistory(prev => [{ time: new Date().toLocaleTimeString('pt-BR'), action: `Comentario adicionado em "${DEFAULT_STEPS.find(s => s.id === stepId)?.label}"` }, ...prev])
    saveSteps(newSteps)
    setNewComment('')
  }

  const updateTimeEstimate = (stepId: number, time: string) => {
    saveSteps(steps.map(s => s.id === stepId ? { ...s, timeEstimate: time } : s))
  }

  const handleApprove = async () => {
    if (!proposalMsg.trim() || !proposalValue.trim()) return
    setApproveLoading(true)

    const timeBreakdown = DEFAULT_STEPS
      .filter(s => stepTimes[s.id])
      .map(s => `${s.label}: ${stepTimes[s.id]} dias`)
      .join(', ')
    const fullMessage = `${proposalMsg}\n\n---\nCronograma: ${timeBreakdown || 'A definir'}\nTotal: ${totalDays} dias (+${delayMargin}% margem = ${totalWithMargin} dias)\nPrevisao de entrega: ${totalDays > 0 ? new Date(Date.now() + totalWithMargin * 86400000).toLocaleDateString('pt-BR') : 'A definir'}`

    const res = await fetch(`/api/projects/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalMessage: fullMessage, proposalValue }),
    })
    if (res.ok) {
      toast.success('Proposta enviada ao cliente!')
      setApproveOpen(false)
      location.reload()
    } else {
      toast.error('Erro ao enviar proposta')
    }
    setApproveLoading(false)
  }

  const handleReject = async () => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED', cancelledReason: 'Recusado pelo administrador', cancelledAt: new Date().toISOString() }),
    })
    if (res.ok) {
      toast.success('Projeto recusado.')
      window.location.href = '/projects'
    } else {
      toast.error('Erro ao recusar projeto')
    }
  }

  const handleClientResponse = async (action: 'accept' | 'reject') => {
    setResponseLoading(true)
    const res = await fetch(`/api/projects/${id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const json = await res.json()
    if (res.ok) {
      toast.success(json.message)
      if (action === 'accept') {
        setContract(json)
        setContractOpen(true)
      } else {
        location.reload()
      }
    } else {
      toast.error(json.error || 'Erro ao processar resposta')
    }
    setResponseLoading(false)
  }

  const handleSignContract = async () => {
    setSignLoading(true)
    const res = await fetch(`/api/contracts/${contract?.contractId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureUrl: '' }),
    })
    if (res.ok) {
      toast.success('Contrato assinado! Projeto iniciado.')
      setContractOpen(false)
      location.reload()
    } else {
      toast.error('Erro ao assinar contrato')
    }
    setSignLoading(false)
  }

  const completedCount = steps.filter(s => s.status === 'completed').length
  const totalSteps = steps.length
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0
  const timelineNodes = steps.map((s, i) => ({
    id: s.id, label: DEFAULT_STEPS[i]?.label || '', description: DEFAULT_STEPS[i]?.description || '',
    status: s.status, timeEstimate: s.timeEstimate, comments: s.comments,
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
                <Badge status={isCancelled ? 'DRAFT' : isDraft ? 'DRAFT' : isReview ? 'REVIEW' : project.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'}>
                  {isCancelled ? 'Cancelado' : isDraft ? 'Rascunho' : isReview ? 'Aguardando cliente' : project.status === 'COMPLETED' ? 'Concluido' : 'Em andamento'}
                </Badge>
                <span className="text-[12px] text-[var(--text-3)]">
                  Cliente: {project.client?.name} ({project.client?.company})
                </span>
              </div>

              {isCancelled && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                  <p className="text-[13px] text-[var(--text-2)]">{project.cancelledReason || 'Projeto cancelado'}</p>
                  {project.cancelledAt && <p className="text-[11px] text-[var(--text-3)] mt-1">{new Date(project.cancelledAt).toLocaleDateString('pt-BR')}</p>}
                </div>
              )}

              {project.proposalMessage && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                  <p className="text-[13px] text-[var(--text)]">{project.proposalMessage}</p>
                  {project.proposalValue && (
                    <p className="text-[14px] font-[500] text-[var(--accent)] mt-1">R$ {project.proposalValue?.toLocaleString?.('pt-BR') || project.proposalValue}</p>
                  )}
                </div>
              )}

              {isAdmin && isDraft && (
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" onClick={() => setApproveOpen(true)} className="h-7 text-[11px]">
                    <IconThumbsUp className="w-3 h-3" /> Aprovar com proposta
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReject} className="h-7 text-[11px]">
                    <IconThumbsDown className="w-3 h-3" /> Recusar
                  </Button>
                </div>
              )}

              {isClient && isReview && (
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" onClick={() => handleClientResponse('accept')} disabled={responseLoading} className="h-7 text-[11px]">
                    {responseLoading && <IconLoader className="w-3 h-3 animate-spin" />}
                    <IconCheck className="w-3 h-3" /> Aceitar proposta
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleClientResponse('reject')} disabled={responseLoading} className="h-7 text-[11px]">
                    <IconClose className="w-3 h-3" /> Recusar
                  </Button>
                </div>
              )}

              {isClient && project.contractSignedAt && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--success-subtle)] border border-[var(--success)]/20">
                  <p className="text-[13px] text-[var(--success)]">Contrato assinado em {new Date(project.contractSignedAt).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[24px] font-[500] text-[var(--accent)]">{progress}%</p>
              <p className="text-[11px] text-[var(--text-3)]">{completedCount}/{totalSteps} etapas</p>
              <Progress value={progress} className="h-[2px] w-32 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {!isCancelled && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
          <div>
            <h3 className="text-[11px] font-[500] text-[var(--text-3)] uppercase tracking-wider mb-4">Fluxo do Projeto</h3>
            <ProjectTimeline
              nodes={timelineNodes}
              expandedNode={expandedStep}
              onToggle={(nid) => setExpandedStep(expandedStep === nid ? null : nid)}
              onStatusChange={isAdmin ? updateStepStatus : undefined}
              onTimeChange={isAdmin ? updateTimeEstimate : undefined}
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
      )}

      <Dialog open={approveOpen} onOpenChange={(v) => { if (!v) setApproveOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar Projeto com Proposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <label>Mensagem para o cliente</label>
              <textarea
                className="w-full min-h-[80px] rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
                placeholder="Descreva o escopo, prazo e expectativas..."
                value={proposalMsg}
                onChange={e => setProposalMsg(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label>Valor da proposta (R$)</label>
              <Input
                type="number"
                placeholder="Ex: 5000"
                value={proposalValue}
                onChange={e => setProposalValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-[500] text-[var(--text-3)] uppercase">Tempo por etapa (dias)</label>
              <div className="space-y-1.5">
                {DEFAULT_STEPS.map(step => (
                  <div key={step.id} className="flex items-center gap-2">
                    <span className="text-[12px] text-[var(--text-2)] w-[120px] shrink-0 truncate">{step.label}</span>
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      placeholder="0"
                      value={stepTimes[step.id] || ''}
                      onChange={e => setStepTimes(prev => ({ ...prev, [step.id]: parseInt(e.target.value) || 0 }))}
                      className="w-[70px] h-7 text-[12px] shrink-0"
                    />
                    <span className="text-[11px] text-[var(--text-3)]">dias</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-3)]">Margem de atraso</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={delayMargin}
                    onChange={e => setDelayMargin(parseInt(e.target.value) || 0)}
                    className="w-[50px] h-7 text-[12px]"
                  />
                  <span className="text-[11px] text-[var(--text-3)]">%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-3)]">Total sem margem</span>
                  <span className="font-[500] text-[var(--text)]">{totalDays} dias</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-3)]">Com margem ({delayMargin}%)</span>
                  <span className="font-[500] text-[var(--accent)]">{totalWithMargin} dias</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--text-3)]">Previsao de entrega</span>
                  <span className="font-[500] text-[var(--text)]">
                    {totalDays > 0
                      ? new Date(Date.now() + totalWithMargin * 86400000).toLocaleDateString('pt-BR')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancelar</Button>
            <Button onClick={handleApprove} disabled={approveLoading || !proposalMsg.trim() || !proposalValue.trim()}>
              {approveLoading && <IconLoader className="w-[14px] h-[14px] animate-spin" />}
              Enviar proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contractOpen} onOpenChange={setContractOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assinar Contrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] max-h-[300px] overflow-y-auto">
              <h3 className="text-[14px] font-[500] mb-2">Termos de Uso e Contrato de Prestacao de Servicos</h3>
              <p className="text-[12px] text-[var(--text-2)] leading-relaxed">
                Este contrato estabelece os termos e condicoes para a prestacao de servicos entre ANDERFLOW Sistemas e o cliente.
              </p>
              <div className="mt-3 space-y-2 text-[12px] text-[var(--text-2)]">
                <p><strong>1. Escopo:</strong> {project.name} — {project.description || 'Conforme briefing aprovado'}</p>
                <p><strong>2. Valor:</strong> R$ {project.proposalValue?.toLocaleString?.('pt-BR') || project.proposalValue}</p>
                <p><strong>3. Prazo:</strong> A ser definido conforme cronograma do projeto</p>
                <p><strong>4. Pagamento:</strong> Conforme acordado entre as partes</p>
                <p><strong>5. Confidencialidade:</strong> Ambas as partes se comprometem a manter sigilo sobre informacoes trocadas</p>
                <p><strong>6. Rescisao:</strong> Qualquer parte pode rescindir mediante aviso previo de 15 dias</p>
              </div>
            </div>
            <div className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Download do PDF em breve') }}>
                  <IconFile className="w-[14px] h-[14px]" /> Baixar contrato em PDF
                </a>
              </Button>
              <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <p className="text-[12px] text-[var(--text-2)] mb-2">Assine digitalmente usando sua conta Gov.br</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => toast.info('Integracao Gov.br em breve')}>
                  Assinar com Gov.br
                </Button>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <p className="text-[12px] text-[var(--text-2)] mb-2">Ou faca upload do contrato assinado</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => toast.info('Upload em breve')}>
                  Upload do arquivo assinado
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractOpen(false)}>Fechar</Button>
            <Button onClick={handleSignContract} disabled={signLoading}>
              {signLoading && <IconLoader className="w-[14px] h-[14px] animate-spin" />}
              <IconCheck className="w-[14px] h-[14px]" /> Confirmar assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
