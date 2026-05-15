'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Check, Loader2, ArrowLeft, Send } from 'lucide-react'

interface Question {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox'
  options?: string[]
  required: boolean
}

interface Section {
  title: string
  questions: Question[]
}

export default function BriefingFillPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const [project, setProject] = useState<any>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!params?.id) return
    fetch(`/api/projects/${params.id}`)
      .then(r => r.json())
      .then(json => {
        const proj = json.data
        if (!proj) { setLoading(false); return }
        setProject(proj)
        try {
          const briefingData = typeof proj.briefing === 'string'
            ? JSON.parse(proj.briefing)
            : proj.briefing
          if (Array.isArray(briefingData)) setSections(briefingData)
        } catch {}
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params?.id])

  const handleAnswer = (questionKey: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionKey]: value }))
  }

  const handleCheckbox = (questionKey: string, option: string) => {
    setAnswers(prev => {
      const current = prev[questionKey] || []
      const exists = current.includes(option)
      return { ...prev, [questionKey]: exists ? current.filter((o: string) => o !== option) : [...current, option] }
    })
  }

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const answeredQuestions = Object.keys(answers).length
  const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

  const handleSubmit = async () => {
    setSaving(true)
    const res = await fetch(`/api/projects/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        briefingAnswers: JSON.stringify(answers),
        metadata: JSON.stringify({ briefingCompletedAt: new Date().toISOString() }),
      }),
    })
    if (res.ok) {
      setSubmitted(true)

      const admins = await fetch('/api/admins').then(r => r.json()).catch(() => ({ data: [] }))
      for (const admin of (admins.data || [])) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: admin.id,
            type: 'BRIEFING_COMPLETED',
            title: 'Briefing preenchido',
            message: `O cliente preencheu o briefing do projeto "${project?.name}".`,
          }),
        }).catch(() => {})
      }

      toast.success('Briefing enviado com sucesso!')
    } else {
      toast.error('Erro ao enviar briefing')
    }
    setSaving(false)
  }

  const renderQuestion = (q: Question) => {
    const val = answers[q.key]
    switch (q.type) {
      case 'text':
        return <Input placeholder="Digite sua resposta..." value={val || ''} onChange={e => handleAnswer(q.key, e.target.value)} />
      case 'textarea':
        return (
          <textarea
            className="w-full min-h-[70px] rounded-md bg-[var(--input-bg)] px-2.5 py-2 text-sm text-[var(--text)] placeholder:text-[var(--placeholder)] focus:outline-none focus:ring-1.5 focus:ring-[var(--primary)] resize-vertical"
            placeholder="Descreva..."
            value={val || ''}
            onChange={e => handleAnswer(q.key, e.target.value)}
          />
        )
      case 'select':
        return (
          <select className="w-full h-8 rounded-md bg-[var(--input-bg)] px-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1.5 focus:ring-[var(--primary)]"
            value={val || ''} onChange={e => handleAnswer(q.key, e.target.value)}>
            <option value="">Selecionar...</option>
            {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )
      case 'checkbox':
        return (
          <div className="flex flex-wrap gap-1.5">
            {q.options?.map(opt => {
              const selected = (val || []).includes(opt)
              return (
                <button key={opt} type="button" onClick={() => handleCheckbox(q.key, opt)}
                  className={`px-2 py-1 rounded text-2xs transition-colors ${selected ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]/70'}`}>
                  {selected && <Check className="h-2.5 w-2.5 inline mr-0.5" />}{opt}
                </button>
              )
            })}
          </div>
        )
      default:
        return <Input onChange={e => handleAnswer(q.key, e.target.value)} />
    }
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">Projeto não encontrado</p>
        <Button variant="link" size="sm" onClick={() => router.push('/portal')} className="mt-2">Voltar ao portal</Button>
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">Este projeto ainda não possui briefing configurado. Aguarde a aprovação do administrador.</p>
        <Button variant="link" size="sm" onClick={() => router.push('/portal')} className="mt-2">Voltar ao portal</Button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-subtle)] mx-auto">
              <Check className="h-6 w-6 text-[var(--success)]" />
            </div>
            <h2 className="text-base font-medium text-[var(--text)]">Briefing enviado!</h2>
            <p className="text-xs text-[var(--text-muted)]">A equipe irá analisar suas respostas.</p>
            <Button onClick={() => router.push('/portal')}>Voltar ao portal</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto">
      <button onClick={() => router.push('/portal')} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft className="h-4 w-4" /> Voltar ao portal
      </button>
      <div>
        <h1 className="text-lg font-medium text-[var(--text)]">{project.name}</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Preencha o briefing para começarmos o projeto</p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-2xs text-[var(--text-muted)]">
          <span>Progresso do briefing</span>
          <span>{answeredQuestions}/{totalQuestions} perguntas</span>
        </div>
        <Progress value={progress} className="h-1" />
      </div>
      {sections.map((section, si) => (
        <Card key={si}>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-[var(--text)] border-b border-[var(--border)] pb-2">{section.title}</h3>
            {section.questions.map(q => (
              <div key={q.key} className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--text)]">
                  {q.label}{q.required && <span className="text-[var(--destructive)] ml-0.5">*</span>}
                </label>
                {renderQuestion(q)}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          <Send className="mr-1.5 h-3.5 w-3.5" /> Enviar briefing
        </Button>
      </div>
    </div>
  )
}
