'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ProjectTimeline, type NodeStatus } from '@/components/projects/project-timeline'
import { IconArrowLeft, IconCheck, IconClock } from '@/components/icons'

const DEFAULT_STEPS = [
  { id: 1, label: 'Briefing', description: 'Coleta de requisitos e entendimento do projeto' },
  { id: 2, label: 'Proposta / Orcamento', description: 'Gerar valor, prazo e escopo formal para o cliente' },
  { id: 3, label: 'Contrato', description: 'Cliente assina o contrato de prestacao de servicos' },
  { id: 4, label: 'Planejamento', description: 'Definicao de escopo, cronograma e recursos' },
  { id: 5, label: 'Design', description: 'Criacao de wireframes, UI/UX e prototipos' },
  { id: 6, label: 'Aprovacao do Design', description: 'Cliente aprova o layout antes do desenvolvimento' },
  { id: 7, label: 'Desenvolvimento', description: 'Codificacao e implementacao das funcionalidades' },
  { id: 8, label: 'Testes', description: 'Testes internos de qualidade, correcoes e ajustes' },
  { id: 9, label: 'Homologacao', description: 'Cliente testa no ambiente de staging antes do deploy' },
  { id: 10, label: 'Deploy', description: 'Publicacao e configuracao do ambiente de producao' },
  { id: 11, label: 'Entrega', description: 'Apresentacao final, documentacao e homologacao do cliente' },
  { id: 12, label: 'Garantia', description: 'Periodo de suporte pos-entrega (30 dias)' },
]

interface StepState {
  id: number
  status: NodeStatus
  timeEstimate: string
  comments: { text: string; author: string; time: string; type: 'text' | 'image' | 'video'; files?: { name: string; size: number; type: string; url: string }[] }[]
}

export default function PortalProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState<StepState[]>([])
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [updates, setUpdates] = useState<any[]>([])
  const [dummyComment, setDummyComment] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`, { credentials: 'include' })
        const json = await res.json()
        if (!json.data) { setLoading(false); return }
        const proj = json.data
        setProject(proj)

        let stepStates: StepState[] = []
        if (proj.stepsData) {
          try { stepStates = JSON.parse(proj.stepsData) } catch {}
        }
        if (!stepStates.length) {
          const hasBriefing = !!proj.briefing
          stepStates = DEFAULT_STEPS.map(s => ({
            id: s.id,
            status: (hasBriefing && s.id === 1 ? 'completed' : 'waiting') as NodeStatus,
            timeEstimate: '',
            comments: hasBriefing && s.id === 1
              ? [{ text: 'Briefing preenchido', author: proj.client?.name || 'Cliente', time: new Date(proj.createdAt).toLocaleString('pt-BR'), type: 'text' as const }]
              : [],
          }))
        }
        setSteps(stepStates)

        try {
          const updRes = await fetch(`/api/project-updates?projectId=${id}`, { credentials: 'include' })
          const updJson = await updRes.json()
          setUpdates(updJson.data || [])
        } catch {}
      } catch {}
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-80" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-[14px] text-[var(--text-3)]">Projeto nao encontrado</p>
        <Link href="/portal/projects" className="text-[12px] text-[var(--accent)] mt-2 inline-block hover:underline">
          Voltar para Meus Projetos
        </Link>
      </div>
    )
  }

  const timelineNodes = steps.map(s => ({
    id: s.id,
    label: DEFAULT_STEPS.find(d => d.id === s.id)?.label || `Etapa ${s.id}`,
    description: DEFAULT_STEPS.find(d => d.id === s.id)?.description || '',
    status: s.status,
    timeEstimate: s.timeEstimate || undefined,
    comments: s.comments || [],
  }))

  const getUpdateIcon = (type: string) => {
    if (type === 'FEATURE') return <IconCheck className="w-[12px] h-[12px] text-[var(--success)]" />
    if (type === 'BUGFIX') return <IconCheck className="w-[12px] h-[12px] text-[var(--warning)]" />
    return <IconClock className="w-[12px] h-[12px] text-[var(--info)]" />
  }

  return (
    <div className="p-6 space-y-5 animate-page-enter">
      <Link href="/portal/projects" className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
        <IconArrowLeft className="w-[12px] h-[12px]" />
        Meus Projetos
      </Link>

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          {project.number && <span className="text-[11px] font-[500] text-[var(--text-3)]">{project.number}</span>}
          <h2 className="text-[17px] font-[500] tracking-[-0.015em]">{project.name}</h2>
          <Badge status={project.status === 'COMPLETED' ? 'COMPLETED' : project.status === 'REVIEW' ? 'REVIEW' : project.status === 'PENDING' ? 'PENDING' : project.status === 'DRAFT' ? 'DRAFT' : project.status === 'TODO' ? 'TODO' : project.status === 'CANCELLED' ? 'CANCELLED' : 'IN_PROGRESS'}>
            {project.status === 'COMPLETED' ? 'Concluido' : project.status === 'REVIEW' ? 'Revisao' : project.status === 'PENDING' ? 'Solicitacao' : project.status === 'DRAFT' ? 'Rascunho' : project.status === 'TODO' ? 'A fazer' : project.status === 'CANCELLED' ? 'Cancelado' : 'Em andamento'}
          </Badge>
        </div>
        {project.description && <p className="text-[12px] text-[var(--text-3)] mt-1">{project.description}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Progress value={project.progress || 0} className="w-64 h-[4px]" />
        <span className="text-[13px] font-[500]">{project.progress || 0}% concluido</span>
        {project.deadline && (
          <span className="text-[11px] text-[var(--text-3)]">
            Prazo: {new Date(project.deadline).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {project.status === 'PENDING' && (
        <Card className="bg-[var(--warning-subtle)] border-[var(--warning)]/20">
          <CardContent className="p-4 text-[12px] text-[var(--warning)]">
            Sua solicitacao esta em analise. Aguarde ate 24 horas que retornamos com uma resposta.
          </CardContent>
        </Card>
      )}

      {project.status === 'CANCELLED' && (
        <Card className="bg-[var(--destructive-subtle)] border-[var(--destructive)]/20">
          <CardContent className="p-4">
            <p className="text-[12px] font-[500] text-[var(--destructive)]">Projeto cancelado</p>
            {project.cancelledReason && <p className="text-[11px] text-[var(--text-2)] mt-0.5">{project.cancelledReason}</p>}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2">
          <ProjectTimeline
            nodes={timelineNodes}
            expandedNode={expandedStep}
            onToggle={setExpandedStep}
            newComment={dummyComment}
            onNewCommentChange={setDummyComment}
            session={session}
            projectStatus={project.status}
          />
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Atualizacoes</CardTitle>
            </CardHeader>
            <CardContent>
              {updates.length === 0 ? (
                <p className="text-[12px] text-[var(--text-3)] text-center py-4">Nenhuma atualizacao registrada</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {updates.map((u: any) => (
                      <div key={u.id} className="p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          {getUpdateIcon(u.type)}
                          <span className="text-[12px] font-[500] text-[var(--text)]">{u.title}</span>
                          {u.requiresApproval && !u.approvedAt && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--warning-subtle)] text-[var(--warning)]">Aguardando aprovacao</span>
                          )}
                          {u.approvedAt && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--success-subtle)] text-[var(--success)]">Aprovado</span>
                          )}
                        </div>
                        {u.description && <p className="text-[11px] text-[var(--text-3)] line-clamp-2">{u.description}</p>}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-[var(--text-3)]">{u.author?.name}</span>
                          <span className="text-[10px] text-[var(--text-3)]">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[12px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-3)]">Tipo</span>
                <span className="text-[var(--text)]">{project.type || 'CUSTOM'}</span>
              </div>
              {project.budget && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-3)]">Orcamento</span>
                  <span className="text-[var(--text)]">R$ {project.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {project.startDate && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-3)]">Inicio</span>
                  <span className="text-[var(--text)]">{new Date(project.startDate).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              {project.deadline && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-3)]">Entrega</span>
                  <span className="text-[var(--text)]">{new Date(project.deadline).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              {project._count && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-3)]">Tarefas</span>
                    <span className="text-[var(--text)]">{project._count.tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-3)]">Arquivos</span>
                    <span className="text-[var(--text)]">{project._count.files}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
