'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import {
  ChevronLeft, ChevronRight, X, Play, Pause, Timer, StickyNote,
  Camera, Monitor, Settings,
} from 'lucide-react'

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
}

const AUTO_OPTIONS = [5, 10, 15, 30]

export default function ProjectPresentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState(0)

  const [autoAdvance, setAutoAdvance] = useState<number | null>(null)
  const [autoSeconds, setAutoSeconds] = useState<number>(10)
  const [timeLeft, setTimeLeft] = useState(10)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [showNotes, setShowNotes] = useState(false)
  const [slideNotes, setSlideNotes] = useState<Record<number, string>>({})
  const [mirrorOpen, setMirrorOpen] = useState(false)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(json => { setProject(json.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const stored = localStorage.getItem(`present_notes_${id}`)
    if (stored) {
      try { setSlideNotes(JSON.parse(stored)) } catch {}
    }
  }, [id])

  useEffect(() => {
    document.documentElement.requestFullscreen().catch(() => {})
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}) }
  }, [])

  const goToSlide = useCallback((target: number, max: number) => {
    setDirection(target > slide ? 1 : -1)
    setSlide(Math.max(0, Math.min(target, max)))
  }, [slide])

  const nextSlide = useCallback(() => goToSlide(slide + 1, 4), [slide, goToSlide])
  const prevSlide = useCallback(() => goToSlide(slide - 1, 4), [slide, goToSlide])

  useEffect(() => {
    if (autoAdvance && !isPaused) {
      setTimeLeft(autoSeconds)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            nextSlide()
            return autoSeconds
          }
          return prev - 1
        })
      }, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [autoAdvance, isPaused, autoSeconds, slide])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { nextSlide(); return }
      if (e.key === 'ArrowLeft') { prevSlide(); return }
      if (e.key === ' ') { e.preventDefault(); setIsPaused(p => !p); return }
      if (e.key === 'n' || e.key === 'N') { setShowNotes(p => !p); return }
      if (e.key === 'Escape') { router.push(`/projects/${id}`); return }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [nextSlide, prevSlide, id, router])

  const handleScreenshot = async () => {
    setCapturing(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const el = document.getElementById('slide-content')
      if (!el) return
      const canvas = await html2canvas(el, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0a0a0a' })
      const link = document.createElement('a')
      link.download = `slide-${slide + 1}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Screenshot salvo!')
    } catch (err) {
      toast.error('Erro ao capturar')
    }
    setCapturing(false)
  }

  const openMirror = () => {
    const url = `${window.location.origin}/projects/${id}/present?mirror=1`
    window.open(url, 'present_mirror', 'width=1280,height=720')
    setMirrorOpen(true)
  }

  const updateNote = (slideIdx: number, text: string) => {
    const next = { ...slideNotes, [slideIdx]: text }
    if (!text) delete next[slideIdx]
    setSlideNotes(next)
    localStorage.setItem(`present_notes_${id}`, JSON.stringify(next))
  }

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

  const SLIDES = [
    <div key="0" className="flex flex-col items-center justify-center h-full text-center space-y-4">
      <div className="text-[var(--accent)] text-2xl font-bold tracking-tight">ANDERFLOW</div>
      <h1 className="text-[48px] font-bold text-[var(--text)] leading-tight max-w-3xl">{project.name}</h1>
      <p className="text-[24px] text-[var(--text-2)]">{project.client?.name || 'Cliente'}</p>
      {project.number && <p className="text-[14px] text-[var(--text-3)] mt-2">{project.number}</p>}
    </div>,
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
    <div key="3" className="flex flex-col items-center justify-center h-full space-y-8">
      <h2 className="text-[32px] font-bold text-[var(--text)]">Métricas</h2>
      <div className="grid grid-cols-2 gap-6 max-w-md">
        {[
          { label: 'Tarefas', value: tasksDone, suffix: `/${tasksTotal}` },
          { label: 'Dias de projeto', value: Math.ceil((Date.now() - new Date(project.createdAt).getTime()) / 86400000) },
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
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden" id="slide-content">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full h-full flex items-center justify-center"
          >
            {SLIDES[slide]}
          </motion.div>
        </AnimatePresence>
      </div>

      {autoAdvance && (
        <div
          className="h-1.5 bg-[var(--surface-2)] cursor-pointer relative"
          onClick={() => setIsPaused(p => !p)}
        >
          <motion.div
            className="h-full bg-[var(--accent)]"
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / autoSeconds) * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
      )}

      {autoAdvance && (
        <div className="px-8 py-1 flex items-center justify-center">
          <span className="text-[11px] text-[var(--text-3)] font-mono">
            {timeLeft}s {isPaused && '(pausado)'}
          </span>
        </div>
      )}

      {showNotes && (
        <div className="px-8 py-3 border-t border-[var(--border)] bg-[var(--surface)] animate-fade-in">
          <p className="text-[11px] text-[var(--text-3)] mb-1">Notas do apresentador (slide {slide + 1}):</p>
          <textarea
            value={slideNotes[slide] || ''}
            onChange={e => updateNote(slide, e.target.value)}
            placeholder="Escreva notas para este slide..."
            className="w-full h-[60px] text-[12px] p-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] resize-none"
          />
        </div>
      )}

      <div className="flex items-center justify-between px-8 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
        <button onClick={prevSlide} disabled={slide === 0} className="text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-30">
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4">
          {[0, 1, 2, 3, 4].map(i => (
            <button
              key={i}
              onClick={() => { setDirection(i > slide ? 1 : -1); setSlide(i) }}
              className={`h-2.5 w-2.5 rounded-full transition-all ${i === slide ? 'bg-[var(--accent)] scale-125' : 'bg-[var(--border)]'}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {AUTO_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => {
                  if (autoAdvance === s) { setAutoAdvance(null); return }
                  setAutoAdvance(s)
                  setAutoSeconds(s)
                  setTimeLeft(s)
                  setIsPaused(false)
                }}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  autoAdvance === s ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-3)] hover:text-[var(--text)]'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>

          {autoAdvance && (
            <button onClick={() => setIsPaused(p => !p)} className="text-[var(--text-3)] hover:text-[var(--text)]">
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          )}

          <button onClick={() => setShowNotes(p => !p)} className={`${showNotes ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'} hover:text-[var(--text)]`} title="Notas (N)">
            <StickyNote className="h-4 w-4" />
          </button>

          <button onClick={handleScreenshot} disabled={capturing} className="text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-50" title="Screenshot">
            <Camera className="h-4 w-4" />
          </button>

          <button onClick={openMirror} className="text-[var(--text-3)] hover:text-[var(--text)]" title="Modo espelho">
            <Monitor className="h-4 w-4" />
          </button>

          <span className="text-[11px] text-[var(--text-3)] ml-1">
            {project.name?.slice(0, 15)} · {slide + 1}/5
          </span>

          <button onClick={() => router.push(`/projects/${id}`)} className="text-[var(--text-3)] hover:text-[var(--destructive)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <button onClick={nextSlide} disabled={slide === 4} className="text-[var(--text-3)] hover:text-[var(--text)] disabled:opacity-30">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
