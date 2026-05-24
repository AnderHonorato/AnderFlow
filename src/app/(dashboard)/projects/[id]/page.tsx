'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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
import { TimeTracker } from '@/components/ui/time-tracker'
import { IconArrowLeft, IconThumbsUp, IconThumbsDown, IconCheck, IconClose, IconLoader, IconFile, IconClock, IconSparkles } from '@/components/icons'

const DEFAULT_STEPS = [
  { id: 1, label: 'Briefing', description: 'Coleta de requisitos e entendimento do projeto' },
  { id: 2, label: 'Proposta / Orçamento', description: 'Gerar valor, prazo e escopo formal para o cliente' },
  { id: 3, label: 'Contrato', description: 'Cliente assina o contrato de prestação de serviços' },
  { id: 4, label: 'Planejamento', description: 'Definição de escopo, cronograma e recursos' },
  { id: 5, label: 'Design', description: 'Criação de wireframes, UI/UX e protótipos' },
  { id: 6, label: 'Aprovação do Design', description: 'Cliente aprova o layout antes do desenvolvimento' },
  { id: 7, label: 'Desenvolvimento', description: 'Codificação e implementação das funcionalidades' },
  { id: 8, label: 'Testes', description: 'Testes internos de qualidade, correções e ajustes' },
  { id: 9, label: 'Homologação', description: 'Cliente testa no ambiente de staging antes do deploy' },
  { id: 10, label: 'Deploy', description: 'Publicação e configuração do ambiente de produção' },
  { id: 11, label: 'Entrega', description: 'Apresentação final, documentação e homologação do cliente' },
  { id: 12, label: 'Garantia', description: 'Período de suporte pós-entrega (30 dias)' },
]

interface StepState {
  id: number
  status: NodeStatus
  timeEstimate: string
  comments: { text: string; author: string; time: string; type: 'text' | 'image' | 'video'; files?: { name: string; size: number; type: string; url: string }[] }[]
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
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
  const [proposalViewOpen, setProposalViewOpen] = useState(false)
  const [proposalHistory, setProposalHistory] = useState<{ value: string; date: string; author: string }[]>([])
  const [aiLoading, setAiLoading] = useState(false)

  const handlePrintModal = (modalSelector: string) => {
    const modal = document.querySelector(modalSelector)
    if (!modal) { window.print(); return }
    const scrollables = modal.querySelectorAll('[class*="overflow"]')
    const originals: { el: Element; overflow: string; maxHeight: string }[] = []
    scrollables.forEach(el => {
      const htmlEl = el as HTMLElement
      originals.push({ el, overflow: htmlEl.style.overflow || '', maxHeight: htmlEl.style.maxHeight || '' })
      htmlEl.style.overflow = 'visible'
      htmlEl.style.maxHeight = 'none'
    })
    window.print()
    originals.forEach(({ el, overflow, maxHeight }) => {
      const htmlEl = el as HTMLElement
      htmlEl.style.overflow = overflow
      htmlEl.style.maxHeight = maxHeight
    })
  }

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
        action: '"Briefing" → Concluído (preenchido pelo cliente)',
        author: projectData.client?.name || 'Cliente',
      }]
      setHistory(initHistory)
      try { localStorage.setItem(`project_history_${id}`, JSON.stringify(initHistory)) } catch {}
    }
  }

  const totalDays = Object.values(stepTimes).reduce((sum, d) => sum + d, 0)
  const totalWithMargin = Math.ceil(totalDays * (1 + delayMargin / 100))

  const isAdmin = ((session?.user as any)?.roleLevel || 0) >= 80
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
          if (projectData.stepsData) {
            try {
              const parsed = JSON.parse(projectData.stepsData)
              if (Array.isArray(parsed)) { setSteps(parsed) }
              else { setSteps(parsed.steps || []); if (parsed.history) setHistory(parsed.history) }
            } catch { setDefaultSteps(projectData) }
          } else if (savedSteps) {
            try {
              const parsed = JSON.parse(savedSteps)
              if (Array.isArray(parsed)) { setSteps(parsed) }
              else { setSteps(parsed.steps || []); if (parsed.history) setHistory(parsed.history) }
            } catch { setDefaultSteps(projectData) }
          } else {
            setDefaultSteps(projectData)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  // Polling para atualizacao em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/projects/${id}`).then(r => r.json()).then(json => {
        if (json.data) {
          setProject(json.data)
          if (json.data.stepsData) {
            try {
              const parsed = JSON.parse(json.data.stepsData)
              if (!Array.isArray(parsed)) {
                if (parsed.steps) setSteps(parsed.steps)
                if (parsed.history) setHistory(parsed.history)
              }
            } catch {}
          }
        }
      }).catch(() => {})
    }, 7000)
    return () => clearInterval(interval)
  }, [id])

  const persistProject = (newSteps: StepState[], newHistory?: any[]) => {
    setSteps(newSteps)
    const effectiveHistory = newHistory ?? history
    if (newHistory) setHistory(newHistory)
    const payload = JSON.stringify({ steps: newSteps, history: effectiveHistory })
    localStorage.setItem(`anderflow_project_steps_${id}`, payload)
    fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stepsData: payload }) }).catch(() => {})
  }

  const saveSteps = (newSteps: StepState[]) => { persistProject(newSteps) }

  const formatSmartTime = (dateTimeStr: string) => {
    const parts = dateTimeStr.split(', ')
    if (parts.length < 2) return dateTimeStr
    const [datePart, timePart] = parts
    const [day, month, year] = datePart.split('/').map(Number)
    if (!day || !month || !year) return dateTimeStr
    const entryDate = new Date(year, month - 1, day)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    entryDate.setHours(0, 0, 0, 0)
    const timeShort = timePart.split(':').slice(0, 2).join(':')
    if (entryDate.getTime() === today.getTime()) return `Hoje ${timeShort}`
    if (entryDate.getTime() === yesterday.getTime()) return `Ontem ${timeShort}`
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')} ${timeShort}`
  }

  const updateStepStatus = (stepId: number, status: NodeStatus) => {
    const currentStep = steps.find(s => s.id === stepId)
    if (!currentStep) return

    if (currentStep.status === 'completed') {
      toast.error('Etapas concluídas não podem ser alteradas')
      return
    }

    if (status === 'in_progress') {
      if (stepId > 3 && project?.status !== 'IN_PROGRESS') {
        toast.error('Envie a proposta e aguarde o cliente assinar o contrato para liberar esta etapa')
        return
      }
      const hasActive = steps.some(s => s.id !== stepId && s.status === 'in_progress')
      if (hasActive) { toast.error('Apenas uma etapa pode estar em andamento por vez'); return }
    }

    const newSteps = steps.map(s => s.id === stepId ? { ...s, status } : s)
    const step = DEFAULT_STEPS.find(s => s.id === stepId)
    const labels: Record<NodeStatus, string> = { waiting: 'Aguardando', in_progress: 'Em andamento', paused: 'Pausado', completed: 'Concluído' }
    const newEntry = { time: new Date().toLocaleString('pt-BR'), action: `"${step?.label}" → ${labels[status]}`, author: session?.user?.name || 'Admin' }
    persistProject(newSteps, [newEntry, ...history])
    toast.success(`Etapa "${step?.label}" atualizada`)
  }

  const addComment = (stepId: number, text: string, files?: { name: string; size: number; type: string; url: string }[]) => {
    const newSteps = steps.map(s => {
      if (s.id !== stepId) return s
      const comment: any = { text, author: session?.user?.name || 'Admin', time: new Date().toLocaleString('pt-BR'), type: 'text' as const }
      if (files && files.length > 0) comment.files = files
      return { ...s, comments: [...s.comments, comment] }
    })
    const roleLabel = isAdmin ? 'Admin' : 'Cliente'
    const preview = text.length > 60 ? text.slice(0, 60) + '...' : text
    const fileInfo = files && files.length > 0 ? ` [${files.length} arquivo(s)]` : ''
    const newEntry = { time: new Date().toLocaleString('pt-BR'), action: `Mensagem em "${DEFAULT_STEPS.find(s => s.id === stepId)?.label}": "${preview}"${fileInfo}`, author: session?.user?.name || roleLabel }
    persistProject(newSteps, [newEntry, ...history])
    setNewComment('')
  }

  const updateTimeEstimate = (stepId: number, time: string) => {
    const step = DEFAULT_STEPS.find(s => s.id === stepId)
    const oldValue = steps.find(s => s.id === stepId)?.timeEstimate || 'não definido'
    const newSteps = steps.map(s => s.id === stepId ? { ...s, timeEstimate: time } : s)
    const entry = {
      time: new Date().toLocaleString('pt-BR'),
      action: `Prazo de "${step?.label}" estendido: ${oldValue} → ${new Date(time + 'T00:00:00').toLocaleDateString('pt-BR')}`,
      author: session?.user?.name || 'Admin',
    }
    persistProject(newSteps, [entry, ...history])
  }

  const handleApprove = async () => {
    if (!isAdmin) { toast.error('Acesso negado'); return }
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
      const isUpdate = !!project.proposalMessage
      const actionText = isUpdate
        ? `Proposta alterada: R$ ${proposalValue}. "${proposalMsg.slice(0, 80)}${proposalMsg.length > 80 ? '...' : ''}"`
        : '"Proposta / Orçamento" → Concluído (enviada ao cliente)'
      const newSteps = steps.map(s => s.id === 2 ? { ...s, status: 'completed' as NodeStatus } : s)
      const entry = { time: new Date().toLocaleString('pt-BR'), action: actionText, author: session?.user?.name || 'Admin' }
      if (isUpdate) {
        setProposalHistory((prev: any) => [{ value: project.proposalValue, date: new Date().toLocaleString('pt-BR'), author: session?.user?.name || 'Admin' }, ...prev])
      }
      persistProject(newSteps, [entry, ...history])
      toast.success(isUpdate ? 'Proposta atualizada!' : 'Proposta enviada ao cliente!')
      setApproveOpen(false)
      setProposalMsg('')
      setProposalValue('')
    } else {
      toast.error('Erro ao enviar proposta')
    }
    setApproveLoading(false)
  }

  const handleReject = async () => {
    if (!isAdmin) { toast.error('Acesso negado'); return }
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED', cancelledReason: 'Recusado pelo administrador', cancelledAt: new Date().toISOString() }),
    })
    if (res.ok) {
      setProject((prev: any) => ({ ...prev, status: 'CANCELLED' }))
      toast.success('Projeto recusado. O projeto permanece no historico.')
    } else {
      toast.error('Erro ao recusar projeto')
    }
  }

  const handleAiGenerate = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id }),
      })
      const json = await res.json()
      if (res.ok) {
        if (json.proposal) setProposalMsg(json.proposal)
        if (json.suggestedValue) setProposalValue(json.suggestedValue)
        toast.success('Proposta gerada com IA! Revise antes de enviar.')
      } else {
        toast.error(json.error || 'Erro ao gerar proposta')
      }
    } catch {
      toast.error('Erro ao gerar proposta com IA')
    }
    setAiLoading(false)
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
        const preview = infoRequestMsg.length > 60 ? infoRequestMsg.slice(0, 60) + '...' : infoRequestMsg
        const entry = { time: new Date().toLocaleString('pt-BR'), action: `Solicitacao de dados: "${preview}"`, author: session?.user?.name || 'Admin' }
        persistProject(newSteps, [entry, ...history])

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

      const preview = clientReplyMsg.length > 60 ? clientReplyMsg.slice(0, 60) + '...' : clientReplyMsg
      const entry = { time: new Date().toLocaleString('pt-BR'), action: `Resposta do cliente: "${preview}"`, author: session?.user?.name || 'Cliente' }
      persistProject(newSteps, [entry, ...history])

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
      if (action === 'accept') {
        const newSteps = steps.map(s => s.id === 3 ? { ...s, status: 'completed' as NodeStatus } : s)
        const entry = { time: new Date().toLocaleString('pt-BR'), action: 'Cliente aceitou a proposta — contrato pendente de assinatura', author: session?.user?.name || 'Cliente' }
        persistProject(newSteps, [entry, ...history])
        toast.success(json.message)
        setContract(json)
        setContractOpen(true)
      } else {
        const entry = { time: new Date().toLocaleString('pt-BR'), action: 'Proposta recusada pelo cliente', author: session?.user?.name || 'Cliente' }
        persistProject(steps, [entry, ...history])
        setProject((prev: any) => ({ ...prev, status: 'CANCELLED' }))
        toast.success('Proposta recusada')
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
      const newSteps = steps.map(s => s.id === 3 ? { ...s, status: 'completed' as NodeStatus } : s)
      const entry = { time: new Date().toLocaleString('pt-BR'), action: 'Contrato assinado — projeto iniciado', author: session?.user?.name || 'Cliente' }
      persistProject(newSteps, [entry, ...history])
      setProject((prev: any) => ({ ...prev, contractSignedAt: new Date().toISOString(), status: 'IN_PROGRESS' }))
      toast.success('Contrato assinado! Projeto iniciado.')
      setContractOpen(false)
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
  const replyComments = briefingStep?.comments?.filter(c => c.text.startsWith('[RESPOSTA]')) || []
  const lastInfoRequest = infoRequestComments[infoRequestComments.length - 1]
  const lastReply = replyComments[replyComments.length - 1]
  const hasClientRepliedAfterLastRequest = lastInfoRequest && lastReply
    ? replyComments.some(c => c.time >= lastInfoRequest.time)
    : false

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>
  if (!project) return <div className="p-6"><p className="text-[var(--text-3)]">Projeto nao encontrado</p></div>

  const renderStepActions = (nodeId: number) => {
    const trackerEl = (
      <div className="flex items-center gap-2 pt-1.5 mt-1.5 border-t border-[var(--border)]">
        <TimeTracker taskId={`step-${nodeId}-${id}`} projectId={id} />
        <span className="text-[10px] text-[var(--text-3)]">Tempo na etapa</span>
      </div>
    )

    if (nodeId === 1) {
      const hasBriefing = (() => { try { JSON.parse(project.briefing || ''); return true } catch { return false } })()
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {hasBriefing && <Button variant="outline" size="sm" onClick={() => setBriefingOpen(true)} className="h-7 text-[11px]"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-1"><path d="M3 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M9 2v4h4"/></svg>Ver Briefing</Button>}
            {isAdmin && isPending && briefingStep?.status !== 'in_progress' && (
              <Button variant="outline" size="sm" onClick={() => { setInfoRequestMsg(''); setInfoRequestOpen(true) }} className="h-7 text-[11px] text-[var(--info)] border-[var(--info)]/30">Sol. mais dados</Button>
            )}
          </div>
          {trackerEl}
        </div>
      )
    }
    if (nodeId === 2) {
      if (isAdmin && (isDraft || isPending)) return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setApproveOpen(true)} className="h-7 text-[11px]"><IconThumbsUp className="w-3 h-3" /> Enviar proposta</Button>
            <Button size="sm" variant="outline" onClick={handleReject} className="h-7 text-[11px]"><IconThumbsDown className="w-3 h-3" /> Recusar</Button>
          </div>
          {trackerEl}
        </div>
      )
      if (isClient && isReview) return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => handleClientResponse('accept')} disabled={responseLoading} className="h-7 text-[11px]">{responseLoading && <IconLoader className="w-3 h-3 animate-spin" />}<IconCheck className="w-3 h-3" /> Aceitar</Button>
            <Button size="sm" variant="outline" onClick={() => handleClientResponse('reject')} disabled={responseLoading} className="h-7 text-[11px]"><IconClose className="w-3 h-3" /> Recusar</Button>
          </div>
          {trackerEl}
        </div>
      )
      if (project.proposalMessage) return (
        <div className="space-y-2">
          <div className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
            <p className="text-[11px] text-[var(--text-2)] mb-1">Proposta enviada</p>
            {project.proposalValue && <p className="text-[12px] font-[500] text-[var(--accent)]">R$ {project.proposalValue?.toLocaleString?.('pt-BR') || project.proposalValue}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setProposalViewOpen(true)} className="h-7 text-[11px]">Ver Detalhes</Button>
            {isAdmin && isReview && (
              <Button variant="outline" size="sm" onClick={() => setApproveOpen(true)} className="h-7 text-[11px] text-[var(--warning)]">Alterar Proposta</Button>
            )}
          </div>
          {trackerEl}
        </div>
      )
      return trackerEl
    }
    if (nodeId === 3 && isReview) {
      if (isClient && !project.contractSignedAt) return (
        <div className="space-y-2">
          <Button size="sm" onClick={() => setContractOpen(true)} className="h-7 text-[11px]"><IconFile className="w-[12px] h-[12px]" /> Ver Contrato & Assinar</Button>
          {trackerEl}
        </div>
      )
      if (project.contractSignedAt) return (
        <div className="space-y-2">
          <div className="p-2 rounded-lg bg-[var(--success-subtle)] border border-[var(--success)]/20">
            <p className="text-[11px] text-[var(--success)]">Contrato assinado em {new Date(project.contractSignedAt).toLocaleDateString('pt-BR')}</p>
          </div>
          {trackerEl}
        </div>
      )
    }
    return trackerEl
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto animate-page-enter">
      <Link href="/projects" className="inline-flex items-center gap-2 text-[13px] text-[var(--text-3)] hover:text-[var(--text)]">
        <IconArrowLeft className="w-4 h-4" /> Voltar para projetos
      </Link>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-[500] tracking-[-0.015em]">{project.name}</h1>
                {project.number && (
                  <span className="text-[11px] font-[500] text-[var(--text-3)] bg-[var(--surface-2)] px-2 py-0.5 rounded shrink-0">
                    {project.number}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[var(--text-3)] mt-0.5">{project.description}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1.5 justify-end">
                <Badge status={isCancelled ? 'CANCELLED' : (isPending ? 'PENDING' : (isDraft ? 'DRAFT' : (isReview ? 'REVIEW' : (project.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'))))}>
                  {isCancelled ? 'Cancelado' : (isPending ? 'Solicitação' : (isDraft ? 'Rascunho' : (isReview ? 'Aguardando cliente' : (project.status === 'COMPLETED' ? 'Concluído' : 'Em andamento'))))}
                </Badge>
                {isPending && (() => {
                  const createdDate = project.createdAt ? new Date(project.createdAt) : null
                  const isNew = createdDate && (Date.now() - createdDate.getTime()) < 48 * 60 * 60 * 1000
                  return isNew ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-[500] bg-[var(--warning-subtle)] text-[var(--warning)]">NOVO</span> : null
                })()}
              </div>
              <p className="text-[11px] text-[var(--text-3)] mt-1">
                {project.client?.name} {project.client?.company ? `· ${project.client.company}` : ''}
              </p>
            </div>
          </div>

          {isCancelled && (
            <div className="rounded-lg bg-[var(--destructive-subtle)] border border-[var(--destructive)]/20 p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--destructive)]"><path d="M3 3l10 10M13 3L3 13"/></svg>
                <span className="text-[11px] font-[600] text-[var(--destructive)]">Projeto Cancelado</span>
              </div>
              <p className="text-[12px] text-[var(--text-2)]">{project.cancelledReason || 'Sem motivo informado'}</p>
              {project.cancelledAt && <p className="text-[10px] text-[var(--text-3)] mt-0.5">{new Date(project.cancelledAt).toLocaleDateString('pt-BR')}</p>}
            </div>
          )}

          {!isCancelled && (isPending || isReview || project.proposalMessage) && (
            <div className={`rounded-lg border p-3 mb-3 ${
              isReview ? 'bg-[var(--warning-subtle)] border-[var(--warning)]/20' :
              'bg-[var(--surface-2)] border-[var(--accent)]/15'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                {isReview ? (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--warning)]"><circle cx="8" cy="8" r="6"/><path d="M8 5v3"/><circle cx="8" cy="11" r="0.5" fill="currentColor"/></svg>
                ) : isPending && !project.proposalMessage ? (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--warning)]"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11h0"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent)]"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M6 8l2 2 4-4"/></svg>
                )}
                <span className={`text-[11px] font-[600] ${isReview ? 'text-[var(--warning)]' : 'text-[var(--accent)]'}`}>
                  {isReview ? 'Aguardando resposta do cliente' : project.proposalMessage ? 'Proposta enviada — aguardando cliente' : 'Em análise pelo desenvolvedor'}
                </span>
              </div>
              {project.proposalMessage ? (
                <div>
                  {(() => {
                    const parts = project.proposalMessage.split('---')
                    const msg = parts[0]?.trim()
                    const rest = parts.slice(1).join('---').trim()
                    return (
                      <>
                        {msg && <p className="text-[12px] text-[var(--text)] leading-relaxed whitespace-pre-wrap line-clamp-3">{msg}</p>}
                        {project.proposalValue && (
                          <p className="text-[14px] font-[600] text-[var(--accent)] mt-1">R$ {project.proposalValue?.toLocaleString?.('pt-BR') || project.proposalValue}</p>
                        )}
                        {rest && <p className="text-[10px] text-[var(--text-3)] mt-1 whitespace-pre-wrap line-clamp-2">{rest}</p>}
                      </>
                    )
                  })()}
                  {isReview && isAdmin && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border)]">
                      <Button size="sm" variant="outline" onClick={() => setProposalViewOpen(true)} className="h-7 text-[11px]">Ver proposta</Button>
                      <Button size="sm" variant="outline" onClick={() => setApproveOpen(true)} className="h-7 text-[11px] text-[var(--warning)]">Alterar</Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[12px] text-[var(--text)]">
                  {isClient ? 'Sua solicitacao esta em analise. Aguarde o retorno em ate 24h.' : 'Envie a proposta para o cliente revisar e aceitar.'}
                </p>
              )}
            </div>
          )}

          <div className="flex items-stretch justify-between gap-6 pt-2 border-t border-[var(--border)]">
            <div className="flex-1 min-w-0">
              {isClient && project.contractSignedAt && (
                <div className="flex items-center gap-2 text-[11px] text-[var(--success)] mb-2">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8l4 4 8-8"/></svg>
                  Contrato assinado em {new Date(project.contractSignedAt).toLocaleDateString('pt-BR')}
                </div>
              )}

              {isClient && isPending && lastInfoRequest && !hasClientRepliedAfterLastRequest && (
                <div className="rounded-lg bg-[var(--info-subtle)] border border-[var(--info)]/20 p-3 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--info)]"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11h0"/></svg>
                    <span className="text-[10px] font-[600] text-[var(--info)] uppercase">Dados Solicitados</span>
                  </div>
                  <p className="text-[12px] text-[var(--text)] whitespace-pre-wrap mb-2">{lastInfoRequest.text.replace('[SOL. DADOS] ', '')}</p>
                  <div className="flex items-start gap-2">
                    <textarea
                      className="flex-1 min-h-[50px] rounded-md bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1.5 text-[12px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
                      placeholder="Digite sua resposta..."
                      value={clientReplyMsg}
                      onChange={e => setClientReplyMsg(e.target.value)}
                    />
                    <Button size="sm" onClick={handleClientReply} disabled={clientReplyLoading || !clientReplyMsg.trim()} className="h-8 text-[11px]">
                      {clientReplyLoading && <IconLoader className="w-[12px] h-[12px] animate-spin" />}Responder
                    </Button>
                  </div>
                </div>
              )}

              {isClient && isPending && hasClientRepliedAfterLastRequest && (
                <div className="flex items-center gap-2 text-[11px] text-[var(--success)] mb-2">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8l4 4 8-8"/></svg>
                  Voce ja respondeu. Aguarde a analise do desenvolvedor.
                </div>
              )}
            </div>

            <div className="flex flex-col items-end justify-between text-right shrink-0">
              <div>
                {totalDays > 0 && (
                  <p className="text-[10px] text-[var(--text-3)] mb-0.5">
                    ~{Math.max(0, totalWithMargin - (project.createdAt ? Math.floor((Date.now() - new Date(project.createdAt).getTime()) / 86400000) : 0))}d restantes
                  </p>
                )}
                <p className="text-[24px] font-[500] text-[var(--accent)]">{progress}%</p>
                <p className="text-[11px] text-[var(--text-3)]">{completedCount}/{totalSteps} etapas</p>
                <Progress value={progress} className="h-[2px] w-28 mt-1.5" />
              </div>
              <div className="flex items-center gap-1 justify-end pt-1.5 mt-2 border-t border-[var(--border)]">
                {project.briefing && (() => { try { JSON.parse(project.briefing); return (
                  <Button variant="ghost" size="sm" onClick={() => setBriefingOpen(true)} className="h-6 text-[10px] gap-1 px-1.5" title="Briefing">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </Button>
                ) } catch { return null } })()}
                {project.proposalMessage && (
                  <Button variant="ghost" size="sm" onClick={() => setProposalViewOpen(true)} className="h-6 text-[10px] gap-1 px-1.5" title="Proposta">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild className="h-6 text-[10px] gap-1 px-1.5" title="Relatorio de horas">
                  <Link href={`/projects/${id}/time-report`}>
                    <IconClock className="w-[12px] h-[12px]" />
                  </Link>
                </Button>
              </div>
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
              projectStatus={project?.status}
              stepActions={renderStepActions}
            />
          </div>
          <div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Historico</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {history.length === 0 && (
                    <p className="text-[12px] text-[var(--text-3)] text-center py-4">Nenhuma alteracao registrada</p>
                  )}
                  <div className="relative pl-5">
                    {history.map((h: any, i: number) => {
                      const isLast = i === history.length - 1
                      const isBriefing = h.action.includes('Briefing')
                      const isRequest = h.action.includes('Solicitacao')
                      const isComment = h.action.includes('Mensagem')
                      const isReply = h.action.includes('Resposta')
                      const isStatus = h.action.includes('→')
                      const isContract = h.action.includes('Contrato') || h.action.includes('contrato')
                      const isProposal = h.action.includes('Proposta') || h.action.includes('proposta')

                      const badge = isBriefing ? { label: 'Briefing', color: 'var(--success)', bg: 'var(--success-subtle)' } :
                                    isRequest ? { label: 'Solicitacao', color: 'var(--info)', bg: 'var(--info-subtle)' } :
                                    isReply ? { label: 'Resposta', color: 'var(--accent)', bg: 'var(--accent-subtle)' } :
                                    isStatus ? { label: 'Status', color: 'var(--warning)', bg: 'var(--warning-subtle)' } :
                                    isProposal ? { label: 'Proposta', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' } :
                                    isContract ? { label: 'Contrato', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' } :
                                    isComment ? { label: 'Mensagem', color: 'var(--text-3)', bg: 'var(--surface-2)' } :
                                    { label: 'Info', color: 'var(--text-3)', bg: 'var(--surface-2)' }

                      return (
                        <div key={i} className="relative pb-4 last:pb-0">
                          {!isLast && <div className="absolute left-[9px] top-5 bottom-0 w-px bg-[var(--border)]" />}
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0 mt-0.5">
                              <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full border" style={{ borderColor: badge.color, background: badge.bg }}>
                                {isBriefing ? <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke={badge.color} strokeWidth="2"><path d="M2 4h4l3-3 3 3h4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4z"/></svg> :
                                 isRequest ? <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke={badge.color} strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11h0"/></svg> :
                                 isReply ? <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke={badge.color} strokeWidth="2"><path d="M14 10l-4 4-4-4M10 14V4a2 2 0 00-2-2H4"/></svg> :
                                 isStatus ? <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke={badge.color} strokeWidth="2"><path d="M2 8l4 4 8-8"/></svg> :
                                 isProposal ? <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke={badge.color} strokeWidth="2"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M6 8l2 2 4-4"/></svg> :
                                 isContract ? <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke={badge.color} strokeWidth="2"><path d="M3 2h6l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M9 2v4h4"/></svg> :
                                 <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke={badge.color} strokeWidth="2"><path d="M2 3h12M2 8h12M2 13h8"/></svg>}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-[600] tracking-wide" style={{ color: badge.color, background: badge.bg }}>{badge.label}</span>
                                <span className="text-[10px] text-[var(--text-3)]">{formatSmartTime(h.time)}</span>
                              </div>
                              <p className="text-[12px] text-[var(--text)] leading-relaxed">{h.action.replace(/"/g, '')}</p>
                              {h.author && (
                                <p className="text-[10px] font-[500] text-[var(--text-2)] mt-0.5">{h.author}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

      <Dialog open={approveOpen} onOpenChange={(v) => { if (!v) setApproveOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar Projeto com Proposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label>Mensagem para o cliente</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAiGenerate}
                  disabled={aiLoading}
                  className="h-7 text-[11px] gap-1"
                >
                  {aiLoading ? (
                    <IconLoader className="w-[12px] h-[12px] animate-spin" />
                  ) : (
                    <IconSparkles className="w-[12px] h-[12px]" />
                  )}
                  Gerar com IA
                </Button>
              </div>
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
            <DialogTitle>Contrato de Prestacao de Servicos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--accent)]/15 max-h-[350px] overflow-y-auto text-[12px] leading-relaxed">
              <p className="text-[14px] font-[600] text-[var(--accent)] mb-3">CONTRATO DE PRESTACAO DE SERVICOS DE DESENVOLVIMENTO</p>

              <p className="text-[11px] font-[600] text-[var(--text)] uppercase tracking-wider mb-1">1. Partes</p>
              <p className="text-[var(--text-2)] mb-2"><strong>Contratado:</strong> ANDERFLOW Sistemas — CNPJ: 00.000.000/0001-00</p>
              <p className="text-[var(--text-2)] mb-3"><strong>Contratante:</strong> {project.client?.name} {project.client?.company ? `(${project.client.company})` : ''} — CPF/CNPJ: 000.000.000-00</p>

              <p className="text-[11px] font-[600] text-[var(--text)] uppercase tracking-wider mb-1">2. Objeto</p>
              <p className="text-[var(--text-2)] mb-3">Prestacao de servicos de desenvolvimento para o projeto <strong>{project.name}</strong>: {project.description || 'Conforme briefing aprovado'}</p>

              <p className="text-[11px] font-[600] text-[var(--text)] uppercase tracking-wider mb-1">3. Valor</p>
              <p className="text-[var(--text-2)] mb-3">Valor total: <strong className="text-[var(--accent)] text-[14px]">R$ {project.proposalValue?.toLocaleString?.('pt-BR') || project.proposalValue}</strong></p>

              <p className="text-[11px] font-[600] text-[var(--text)] uppercase tracking-wider mb-1">4. Vigencia</p>
              <p className="text-[var(--text-2)] mb-3">Inicio: {new Date().toLocaleDateString('pt-BR')} — Conforme cronograma do projeto</p>

              <p className="text-[11px] font-[600] text-[var(--text)] uppercase tracking-wider mb-1">5. Condicoes Gerais</p>
              <p className="text-[var(--text-2)] mb-2">O contratante declara ter lido e aceito integralmente os <a href="/termos" target="_blank" className="text-[var(--accent)] underline">Termos e Condicoes</a> da plataforma, incluindo disposicoes sobre pagamento, propriedade intelectual, confidencialidade, garantia, e LGPD.</p>
              <p className="text-[var(--text-2)] mb-2">Apos assinatura digital ou upload do contrato assinado, o projeto avanca para a etapa de Planejamento.</p>

              <div className="mt-3 p-2 rounded bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--text-3)]">
                <strong className="text-[var(--text-2)]">Instrucoes:</strong> Baixe o PDF, leia com atencao, assine digitalmente ou imprima e assine a mao. Depois faca upload do arquivo assinado no campo abaixo.
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handlePrintModal('[role="dialog"]')} size="sm" className="flex-1 h-8 text-[11px]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-1"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Baixar PDF
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px]" asChild>
                  <a href="/termos" target="_blank">Ler Termos Completos</a>
                </Button>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                <label className="text-[11px] font-[500] text-[var(--text-2)] block mb-2">Upload do Contrato Assinado</label>
                <Input type="file" accept=".pdf,.jpg,.png,.doc,.docx" className="h-8 text-[11px]" />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-[var(--text-2)] cursor-pointer">
                <input type="checkbox" className="rounded" />
                Li e aceito os <a href="/termos" target="_blank" className="text-[var(--accent)] underline">Termos e Condicoes</a>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractOpen(false)}>Fechar</Button>
            <Button onClick={handleSignContract} disabled={signLoading}>
              {signLoading && <IconLoader className="w-[14px] h-[14px] animate-spin" />}
              <IconCheck className="w-[14px] h-[14px]" /> Confirmar Assinatura
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
            <Button onClick={() => handlePrintModal('[role="dialog"]')} size="sm"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-1"><path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3M4 6l4 4 4-4M8 10V2"/></svg>Baixar PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={proposalViewOpen} onOpenChange={setProposalViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Proposta do Projeto</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4">
            <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-[500] text-[var(--text)]">{project.name}</h3>
                {project.proposalValue && (
                  <span className="text-[18px] font-[600] text-[var(--accent)]">R$ {project.proposalValue?.toLocaleString?.('pt-BR') || project.proposalValue}</span>
                )}
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] mb-3">
                <p className="text-[12px] text-[var(--text)] whitespace-pre-wrap leading-relaxed">{project.proposalMessage}</p>
              </div>
              <div className="space-y-1 text-[11px] text-[var(--text-3)]">
                <p><strong className="text-[var(--text-2)]">Cliente:</strong> {project.client?.name}</p>
                <p><strong className="text-[var(--text-2)]">Empresa:</strong> {project.client?.company || '-'}</p>
                <p><strong className="text-[var(--text-2)]">Data da proposta:</strong> {new Date(project.updatedAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProposalViewOpen(false)}>Fechar</Button>
            <Button onClick={() => handlePrintModal('[role="dialog"]')} size="sm"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-1"><path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3M4 6l4 4 4-4M8 10V2"/></svg>Baixar PDF</Button>
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
