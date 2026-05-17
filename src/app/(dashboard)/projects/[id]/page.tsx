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
  const [history, setHistory] = useState<{ time: string; action: string; author?: string }[]>([])
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
  const [briefingOpen, setBriefingOpen] = useState(false)
  const [infoRequestOpen, setInfoRequestOpen] = useState(false)
  const [infoRequestMsg, setInfoRequestMsg] = useState('')
  const [infoRequestLoading, setInfoRequestLoading] = useState(false)
  const [clientReplyMsg, setClientReplyMsg] = useState('')
  const [clientReplyLoading, setClientReplyLoading] = useState(false)

  const setDefaultSteps = (projectData: any) => {
    const hasBriefing = !!projectData.briefing
    const init = DEFAULT_STEPS.map(s => ({
      id: s.id,
      status: (hasBriefing && s.id === 1 ? 'completed' : 'waiting') as NodeStatus,
      timeEstimate: '',
      comments: hasBriefing && s.id === 1
        ? [{ text: 'Briefing preenchido pelo cliente', author: projectData.client?.name || 'Cliente', time: new Date(projectData.createdAt).toLocaleString('pt-BR'), type: 'text' as const }]
        : [],
    }))
    setSteps(init)
    if (hasBriefing) {
      const initHistory = [{
        time: new Date(projectData.createdAt).toLocaleString('pt-BR'),
        action: '"Briefing" → Concluido (preenchido pelo cliente)',
        author: projectData.client?.name || 'Cliente',
      }]
      setHistory(initHistory)
      try { localStorage.setItem(`project_history_${id}`, JSON.stringify(initHistory)) } catch {}
    }
  }

  const totalDays = Object.values(stepTimes).reduce((sum, d) => sum + d, 0)
  const totalWithMargin = Math.ceil(totalDays * (1 + delayMargin / 100))

  const isAdmin = session?.user?.role === 'ADMIN'
  const isClient = session?.user?.id === project?.clientId
  const isDraft = project?.status === 'DRAFT'
  const isPending = project?.status === 'PENDING'
  const isReview = project?.status === 'REVIEW'
  const isCancelled = project?.status === 'CANCELLED'

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          const projectData = json.data
          setProject(projectData)
          const savedSteps = localStorage.getItem(`anderflow_project_steps_${id}`)
          // Prioridade: DB > localStorage > default
          if (projectData.stepsData) {
            try { setSteps(JSON.parse(projectData.stepsData)) } catch { setDefaultSteps(projectData) }
          } else if (savedSteps) {
            setSteps(JSON.parse(savedSteps))
          } else {
            setDefaultSteps(projectData)
          }
          try {
            const savedHistory = localStorage.getItem(`project_history_${id}`)
            if (savedHistory) setHistory(JSON.parse(savedHistory))
          } catch {}
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const saveSteps = (newSteps: StepState[]) => {
    setSteps(newSteps)
    localStorage.setItem(`anderflow_project_steps_${id}`, JSON.stringify(newSteps))
    // Salvar no banco para compartilhar entre admin e cliente
    fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepsData: JSON.stringify(newSteps) }),
    }).catch(() => {})
  }

  const updateStepStatus = (stepId: number, status: NodeStatus) => {
    const currentStep = steps.find(s => s.id === stepId)
    if (!currentStep) return

    if (currentStep.status === 'completed') {
      toast.error('Etapas concluidas nao podem ser alteradas')
      return
    }

    if (status === 'in_progress') {
      const hasActive = steps.some(s => s.id !== stepId && s.status === 'in_progress')
      if (hasActive) {
        toast.error('Apenas uma etapa pode estar em andamento por vez')
        return
      }
    }

    const newSteps = steps.map(s => s.id === stepId ? { ...s, status } : s)
    const step = DEFAULT_STEPS.find(s => s.id === stepId)
    const labels: Record<NodeStatus, string> = { waiting: 'Aguardando', in_progress: 'Em andamento', paused: 'Pausado', completed: 'Concluido' }
    const newEntry = { time: new Date().toLocaleString('pt-BR'), action: `"${step?.label}" → ${labels[status]}`, author: session?.user?.name || 'Admin' }
    const newHistory = [newEntry, ...history]
    setHistory(newHistory)
    try { localStorage.setItem(`project_history_${id}`, JSON.stringify(newHistory)) } catch {}
    saveSteps(newSteps)
    toast.success(`Etapa "${step?.label}" atualizada`)
  }

  const addComment = (stepId: number, text: string) => {
    const newSteps = steps.map(s => {
      if (s.id !== stepId) return s
      return { ...s, comments: [...s.comments, { text, author: 'Voce', time: new Date().toLocaleTimeString('pt-BR'), type: 'text' as const }] }
    })
    const newEntry = { time: new Date().toLocaleString('pt-BR'), action: `Comentario em "${DEFAULT_STEPS.find(s => s.id === stepId)?.label}"`, author: session?.user?.name || 'Admin' }
    const newHistory = [newEntry, ...history]
    setHistory(newHistory)
    try { localStorage.setItem(`project_history_${id}`, JSON.stringify(newHistory)) } catch {}
    saveSteps(newSteps)
    setNewComment('')
  }

  const updateTimeEstimate = (stepId: number, time: string) => {
    const step = DEFAULT_STEPS.find(s => s.id === stepId)
    const oldValue = steps.find(s => s.id === stepId)?.timeEstimate || 'nao definido'
    saveSteps(steps.map(s => s.id === stepId ? { ...s, timeEstimate: time } : s))
    const entry = {
      time: new Date().toLocaleString('pt-BR'),
      action: `Prazo de "${step?.label}" estendido: ${oldValue} → ${new Date(time + 'T00:00:00').toLocaleDateString('pt-BR')}`,
      author: session?.user?.name || 'Admin',
    }
    const newHistory = [entry, ...history]
    setHistory(newHistory)
    try { localStorage.setItem(`project_history_${id}`, JSON.stringify(newHistory)) } catch {}
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

  const handleInfoRequest = async () => {
    if (!infoRequestMsg.trim()) return
    setInfoRequestLoading(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: project.clientId,
          type: 'INFO_REQUEST',
          title: 'Solicitacao de dados extras',
          message: infoRequestMsg,
          metadata: JSON.stringify({ projectId: id }),
        }),
      })
      if (res.ok) {
        toast.success('Solicitacao enviada ao cliente')

        // Travar fluxo: voltar etapa Briefing para aguardando resposta
        const newSteps = steps.map(s => {
          if (s.id === 1) {
            return {
              ...s,
              status: 'paused' as NodeStatus,
              comments: [...s.comments, {
                text: `[SOL. DADOS] ${infoRequestMsg}`,
                author: session?.user?.name || 'Admin',
                time: new Date().toLocaleString('pt-BR'),
                type: 'text' as const,
              }],
            }
          }
          return s
        })
        saveSteps(newSteps)

        // Historico
        const entry = {
          time: new Date().toLocaleString('pt-BR'),
          action: 'Solicitacao de dados extras enviada ao cliente',
          author: session?.user?.name || 'Admin',
        }
        const newHistory = [entry, ...history]
        setHistory(newHistory)
        try { localStorage.setItem(`project_history_${id}`, JSON.stringify(newHistory)) } catch {}

        setInfoRequestOpen(false)
        setInfoRequestMsg('')
      } else {
        toast.error('Erro ao enviar solicitacao')
      }
    } catch {
      toast.error('Erro ao enviar solicitacao')
    }
    setInfoRequestLoading(false)
  }

  const handleClientReply = async () => {
    if (!clientReplyMsg.trim()) return
    setClientReplyLoading(true)
    try {
      // Salvar resposta na etapa Briefing
      const newSteps = steps.map(s => {
        if (s.id === 1) {
          return {
            ...s,
            status: 'completed' as NodeStatus,
            comments: [...s.comments, {
              text: `[RESPOSTA] ${clientReplyMsg}`,
              author: session?.user?.name || 'Cliente',
              time: new Date().toLocaleString('pt-BR'),
              type: 'text' as const,
            }],
          }
        }
        return s
      })
      saveSteps(newSteps)

      // Historico
      const entry = {
        time: new Date().toLocaleString('pt-BR'),
        action: 'Cliente respondeu a solicitacao de dados',
        author: session?.user?.name || 'Cliente',
      }
      const newHistory = [entry, ...history]
      setHistory(newHistory)
      try { localStorage.setItem(`project_history_${id}`, JSON.stringify(newHistory)) } catch {}

      // Notificar admins
      const adminsRes = await fetch('/api/admins')
      const adminsJson = await adminsRes.json()
      const admins = adminsJson.data || []
      for (const admin of admins) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: admin.id,
            type: 'INFO_REQUEST',
            title: 'Cliente respondeu dados extras',
            message: `${project.client?.name || 'Cliente'} enviou resposta: ${clientReplyMsg.slice(0, 100)}`,
            metadata: JSON.stringify({ projectId: id }),
          }),
        })
      }

      toast.success('Resposta enviada ao desenvolvedor')
      setClientReplyMsg('')
    } catch {
      toast.error('Erro ao enviar resposta')
    }
    setClientReplyLoading(false)
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

  const briefingStep = steps.find(s => s.id === 1)
  const infoRequestComments = briefingStep?.comments?.filter(c => c.text.startsWith('[SOL. DADOS]')) || []
  const hasClientReplied = briefingStep?.comments?.some(c => c.text.startsWith('[RESPOSTA]'))
  const lastInfoRequest = infoRequestComments[infoRequestComments.length - 1]

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
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-[500] tracking-[-0.015em]">{project.name}</h1>
                {project.number && (
                  <span className="text-[11px] font-[500] text-[var(--text-3)] bg-[var(--surface-2)] px-2 py-0.5 rounded">
                    {project.number}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[var(--text-3)] mt-1">{project.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <Badge status={isCancelled ? 'CANCELLED' : (isPending ? 'PENDING' : (isDraft ? 'DRAFT' : (isReview ? 'REVIEW' : (project.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'))))}>
                  {isCancelled ? 'Cancelado' : (isPending ? 'Solicitacao' : (isDraft ? 'Rascunho' : (isReview ? 'Aguardando cliente' : (project.status === 'COMPLETED' ? 'Concluido' : 'Em andamento'))))}
                </Badge>
                {isPending && (() => {
                  const createdDate = project.createdAt ? new Date(project.createdAt) : null
                  const isNew = createdDate && (Date.now() - createdDate.getTime()) < 48 * 60 * 60 * 1000
                  return isNew ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-[500] bg-[var(--warning-subtle)] text-[var(--warning)] badge-new">NOVO</span> : null
                })()}
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

              {isClient && isPending && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--warning-subtle)] border border-[var(--warning)]/20">
                  <p className="text-[13px] text-[var(--warning)]">Sua solicitacao esta em analise pelo desenvolvedor.</p>
                  <p className="text-[11px] text-[var(--text-3)] mt-1">Aguarde ate 24 horas que retornamos com uma resposta.</p>
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

              {project.briefing && (() => {
                try {
                  JSON.parse(project.briefing)
                  return (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setBriefingOpen(true)} className="h-7 text-[11px]">Ver Briefing</Button>
                      {isAdmin && isPending && (
                        <Button variant="outline" size="sm" onClick={() => { setInfoRequestMsg(''); setInfoRequestOpen(true) }} className="h-7 text-[11px] text-[var(--info)] border-[var(--info)]/30">
                          Sol. mais dados
                        </Button>
                      )}
                    </div>
                  )
                } catch { return null }
              })()}

              {isAdmin && (isDraft || isPending) && (
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

              {isClient && isPending && lastInfoRequest && !hasClientReplied && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--info-subtle)] border border-[var(--info)]/20">
                  <p className="text-[13px] font-[500] text-[var(--info)] mb-1">Desenvolvedor solicita dados extras:</p>
                  <p className="text-[12px] text-[var(--text)] whitespace-pre-wrap">{lastInfoRequest.text.replace('[SOL. DADOS] ', '')}</p>
                  <div className="mt-3 flex items-start gap-2">
                    <textarea
                      className="flex-1 min-h-[60px] rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[12px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
                      placeholder="Digite sua resposta com as informacoes solicitadas..."
                      value={clientReplyMsg}
                      onChange={e => setClientReplyMsg(e.target.value)}
                    />
                    <Button size="sm" onClick={handleClientReply} disabled={clientReplyLoading || !clientReplyMsg.trim()} className="h-8 text-[11px]">
                      {clientReplyLoading && <IconLoader className="w-[12px] h-[12px] animate-spin" />}
                      Responder
                    </Button>
                  </div>
                </div>
              )}

              {isClient && isPending && hasClientReplied && (
                <div className="mt-3 p-3 rounded-lg bg-[var(--success-subtle)] border border-[var(--success)]/20">
                  <p className="text-[12px] text-[var(--success)]">Voce ja respondeu a solicitacao de dados. Aguarde a analise do desenvolvedor.</p>
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
              onToggle={(nid) => {
                const next = expandedStep === nid ? null : nid
                setExpandedStep(next)
                if (next !== null) {
                  setTimeout(() => {
                    document.getElementById(`step-${nid}`)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                    })
                  }, 50)
                }
              }}
              onStatusChange={isAdmin ? updateStepStatus : undefined}
              onTimeChange={isAdmin ? updateTimeEstimate : undefined}
              onAddComment={addComment}
              newComment={newComment}
              onNewCommentChange={setNewComment}
              session={session}
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
                    {history.map((h: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] border-b border-[var(--border)] pb-2 last:border-0">
                        <span className="text-[var(--text-3)] shrink-0">{h.time}</span>
                        <div className="min-w-0">
                          <span className="text-[var(--text)]">{h.action}</span>
                          {h.author && <span className="text-[var(--text-3)] ml-1">— {h.author}</span>}
                        </div>
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

      <Dialog open={briefingOpen} onOpenChange={setBriefingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Briefing do Projeto</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4">
            {(() => {
              try {
                const briefingData = typeof project.briefing === 'string' ? JSON.parse(project.briefing) : project.briefing
                const answers = briefingData.answers || briefingData
                const template = briefingData.template
                if (template?.stages) {
                  return template.stages.map((stage: any, si: number) => (
                    <div key={si} className="border border-[var(--border)] rounded-lg p-3">
                      <h4 className="text-[13px] font-[500] text-[var(--text)] mb-2">{stage.title || stage.label}</h4>
                      <div className="space-y-2">
                        {stage.questions?.map((q: any, qi: number) => {
                          const value = answers[q.id]
                          const display = Array.isArray(value)
                            ? value.map((v: string) => (typeof v === 'string' && v.length > 30 ? v : (q.options?.[v] || v))).join(', ')
                            : (typeof value === 'string' && value.length > 40 ? value : (q.options?.[value] || value || '-'))
                          return (
                            <div key={qi} className="flex items-start gap-2">
                              <span className="text-[12px] text-[var(--text-2)] shrink-0 min-w-[110px]">{q.label}:</span>
                              <span className="text-[12px] text-[var(--text)] break-words">{display}</span>
                            </div>
                          )
                        })}
                        {(!stage.questions || stage.questions.length === 0) && (
                          <p className="text-[12px] text-[var(--text-3)]">Nenhuma pergunta nesta etapa</p>
                        )}
                      </div>
                    </div>
                  ))
                }
                return <div className="space-y-2">
                  {Object.entries(answers).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className="text-[12px] text-[var(--text-3)] shrink-0 min-w-[140px]">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-[12px] text-[var(--text)] break-words">{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                    </div>
                  ))}
                </div>
              } catch {
                return <p className="text-[12px] text-[var(--text-3)]">Nao foi possivel carregar o briefing</p>
              }
            })()}
            {project.briefing && (() => {
              try {
                const data = JSON.parse(project.briefing)
                if (data.summary) {
                  return <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] mt-4">
                    <p className="text-[11px] font-[500] text-[var(--text-3)] uppercase mb-1">Resumo</p>
                    <p className="text-[12px] text-[var(--text)]">{data.summary}</p>
                  </div>
                }
              } catch { return null }
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBriefingOpen(false)}>Fechar</Button>
            <Button onClick={() => window.print()} size="sm">Baixar PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={infoRequestOpen} onOpenChange={setInfoRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Dados Extras ao Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-[12px] text-[var(--text-2)]">
              O cliente recebera uma notificacao com sua mensagem e podera responder com as informacoes solicitadas.
            </p>
            <div className="space-y-2">
              <label>O que voce precisa saber?</label>
              <textarea
                className="w-full min-h-[120px] rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
                placeholder="Descreva as informacoes ou documentos que o cliente precisa enviar..."
                value={infoRequestMsg}
                onChange={e => setInfoRequestMsg(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoRequestOpen(false)}>Cancelar</Button>
            <Button onClick={handleInfoRequest} disabled={infoRequestLoading || !infoRequestMsg.trim()}>
              {infoRequestLoading && <IconLoader className="w-[14px] h-[14px] animate-spin" />}
              Enviar solicitacao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
