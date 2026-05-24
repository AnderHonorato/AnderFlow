'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectTimeline } from '@/components/projects/project-timeline'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export default function ProjectPresentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(json => { setProject(json.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    document.documentElement.requestFullscreen().catch(() => {})
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}) }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setSlide(s => Math.min(s + 1, 4))
      if (e.key === 'ArrowLeft') setSlide(s => Math.max(s - 1, 0))
      if (e.key === 'Escape') router.push(`/projects/${id}`)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [id, router])

  if (loading) return (
    <div className="h-screen bg-[var(--bg)] flex items-center justify-center">
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  )
  if (!project) return (
    <div className="h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text-3)]">
      Projeto não encontrado
    </div>
  )

  const tasksDone = project.tasks?.filter((t: any) => t.status === 'DONE').length || 0
  const tasksTotal = project.tasks?.length || 0
  const projectDays = project.createdAt ? Math.ceil((Date.now() - new Date(project.createdAt).getTime()) / 86400000) : 0

  const SLIDES = [
    // Slide 1 - Capa
    <div key="0" className="flex flex-col items-center justify-center h-full text-center space-y-4">
      <div className="text-[var(--accent)] text-2xl font-bold tracking-tight">ANDERFLOW</div>
      <h1 className="text-[48px] font-bold text-[var(--text)] leading-tight max-w-3xl">{project.name}</h1>
      <p className="text-[24px] text-[var(--text-2)]">{project.client?.name || 'Cliente'}</p>
      {project.number && <p className="text-[14px] text-[var(--text-3)] mt-2">{project.number}</p>}
    </div>,
    // Slide 2 - Visão Geral
    <div key="1" className="flex flex-col items-center justify-center h-full space-y-6 max-w-2xl mx-auto text-center">
      <h2 className="text-[32px] font-bold text-[var(--text)]">Visão Geral</h2>
      <Progress value={project.progress || 0} className="h-3 w-full max-w-md" />
      <p className="text-[48px] font-bold text-[var(--accent)]">{project.progress || 0}%</p>
      <Badge status={project.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'} className="text-sm px-4 py-1.5">{project.status}</Badge>
      <div className="grid grid-cols-2 gap-4 text-left w-full max-w-md">
        <div><p className="text-[12px] text-[var(--text-3)]">Início</p><p className="text-[16px] text-[var(--text)]">{new Date(project.createdAt).toLocaleDateString('pt-BR')}</p></div>
        <div><p className="text-[12px] text-[var(--text-3)]">Prazo</p><p className="text-[16px] text-[var(--text)]">{project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'Não definido'}</p></div>
      </div>
      <p className="text-[14px] text-[var(--text-2)] max-w-lg">{project.description}</p>
    </div>,
    // Slide 3 - Timeline
    <div key="2" className="flex flex-col items-center h-full space-y-6 pt-12">
      <h2 className="text-[32px] font-bold text-[var(--text)]">Linha do Tempo</h2>
      <div className="w-full max-w-2xl">
        {project.stepsData ? (() => {
          try {
            const data = JSON.parse(project.stepsData)
            const steps = Array.isArray(data) ? data : (data.steps || [])
            return steps.map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--border)]">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${s.status === 'completed' ? 'bg-[var(--success)]/20 text-[var(--success)]' : s.status === 'in_progress' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--surface-2)] text-[var(--text-3)]'}`}>
                  {s.status === 'completed' ? '✓' : i + 1}
                </div>
                <span className="text-[14px] text-[var(--text)]">{s.label || `Etapa ${i + 1}`}</span>
                <Badge variant="secondary" className="text-2xs ml-auto">{s.status}</Badge>
              </div>
            ))
          } catch { return <p className="text-[var(--text-3)]">Dados não disponíveis</p> }
        })() : <p className="text-[var(--text-3)]">Nenhuma etapa registrada</p>}
      </div>
    </div>,
    // Slide 4 - Métricas
    <div key="3" className="flex flex-col items-center justify-center h-full space-y-8">
      <h2 className="text-[32px] font-bold text-[var(--text)]">Métricas</h2>
      <div className="grid grid-cols-2 gap-6 max-w-md">
        {[
          { label: 'Tarefas', value: tasksDone, suffix: `/${tasksTotal}` },
          { label: 'Dias de projeto', value: projectDays },
          { label: 'Progresso', value: project.progress || 0, suffix: '%' },
          { label: 'Arquivos', value: project._count?.files || 0 },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="p-6 text-center">
              <p className="text-[40px] font-bold text-[var(--accent)]">
                <AnimatedCounter value={m.value} duration={1500} />
                {m.suffix || ''}
              </p>
              <p className="text-[13px] text-[var(--text-3)] mt-1">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>,
    // Slide 5 - Próximos Passos
    <div key="4" className="flex flex-col items-center h-full space-y-6 pt-12">
      <h2 className="text-[32px] font-bold text-[var(--text)]">Próximos Passos</h2>
      <div className="w-full max-w-2xl">
        {project.tasks?.filter((t: any) => t.status !== 'DONE').length > 0 ? (
          project.tasks.filter((t: any) => t.status !== 'DONE').slice(0, 10).map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)]">
              <div className="h-2 w-2 rounded-full bg-[var(--accent)] shrink-0" />
              <span className="text-[14px] text-[var(--text)]">{t.title}</span>
              <Badge variant="secondary" className="text-2xs ml-auto">{t.status || 'TODO'}</Badge>
            </div>
          ))
        ) : (
          <p className="text-[var(--text-3)] text-center py-8">Todas as tarefas concluídas!</p>
        )}
      </div>
    </div>
  ]

  return (
    <div className="h-screen bg-[var(--bg)] flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-8">
        {SLIDES[slide]}
      </div>
      <div className="flex items-center justify-between px-8 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
        <button onClick={() => setSlide(s => Math.max(s - 1, 0))} disabled={slide === 0} className="text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-30"><ChevronLeft className="h-5 w-5" /></button>
        <div className="flex items-center gap-4">
          {[0,1,2,3,4].map(i => (
            <button key={i} onClick={() => setSlide(i)} className={`h-2.5 w-2.5 rounded-full transition-all ${i === slide ? 'bg-[var(--accent)] scale-125' : 'bg-[var(--border)]'}`} />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-[var(--text-3)]">{project.name?.slice(0, 20)} · slide {slide + 1}/5</span>
          <span className="text-[10px] text-[var(--text-3)]">← → navegar</span>
          <button onClick={() => router.push(`/projects/${id}`)} className="text-[var(--text-3)] hover:text-[var(--destructive)]"><X className="h-5 w-5" /></button>
        </div>
        <button onClick={() => setSlide(s => Math.min(s + 1, 4))} disabled={slide === 4} className="text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button>
      </div>
    </div>
  )
}
