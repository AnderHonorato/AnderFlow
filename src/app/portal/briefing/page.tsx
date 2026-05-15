'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  ArrowLeft, ArrowRight, Check, Loader2, ChevronDown,
  Paperclip, X, FileText, Image, File,
} from 'lucide-react'
import { SERVICE_CATEGORIES, getTemplateForCategory, generateSummary } from '@/lib/briefing-engine'
import type { BriefingTemplate, BriefingStage, QuestionType, ServiceCategory } from '@/lib/briefing-engine'

const DRAFT_KEY = 'briefing_draft_id'

export default function BriefingWizardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const categoryParam = searchParams.get('category') as ServiceCategory | null

  const [step, setStep] = useState<'category' | 'briefing' | 'summary'>('category')
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(categoryParam)
  const [template, setTemplate] = useState<BriefingTemplate | null>(null)
  const [stageIndex, setStageIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [draftId, setDraftId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [autoMessage, setAutoMessage] = useState<string | null>(null)

  const userId = session?.user?.id

  useEffect(() => {
    if (!categoryParam) return
    setSelectedCategory(categoryParam)
    const tpl = getTemplateForCategory(categoryParam)
    setTemplate(tpl)
    setStep('briefing')

    const savedDraft = localStorage.getItem(DRAFT_KEY)
    if (savedDraft) {
      fetch(`/api/briefing?draftId=${savedDraft}`)
        .then(r => r.json())
        .then(json => {
          if (json.data?.answers) {
            try {
              setAnswers(typeof json.data.answers === 'string' ? JSON.parse(json.data.answers) : json.data.answers)
            } catch {}
          }
          setStageIndex(json.data?.currentStage || 0)
          setStep('briefing')
          setDraftId(savedDraft)
        })
        .catch(() => {})
    }
  }, [categoryParam])

  const handleSelectCategory = (catId: ServiceCategory) => {
    setSelectedCategory(catId)
    const tpl = getTemplateForCategory(catId)
    setTemplate(tpl)
    setStep('briefing')
    setStageIndex(0)
    setAutoMessage(tpl.stages[0]?.autoMessage || null)

    const existing = localStorage.getItem(DRAFT_KEY)
    if (existing) localStorage.removeItem(DRAFT_KEY)
  }

  const currentStage: BriefingStage | null = template?.stages[stageIndex] || null
  const totalStages = template?.stages.length || 0
  const progress = totalStages > 0 ? Math.round(((stageIndex + 1) / totalStages) * 100) : 0

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleMultiSelect = (questionId: string, option: string) => {
    setAnswers(prev => {
      const current = prev[questionId] || []
      const exists = current.includes(option)
      return { ...prev, [questionId]: exists ? current.filter((o: string) => o !== option) : [...current, option] }
    })
  }

  const saveDraft = async () => {
    if (!userId) return
    const res = await fetch('/api/briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', userId, categoryId: selectedCategory, draftId, currentStage: stageIndex, currentStep: 0, answers }),
    })
    const json = await res.json()
    if (json.data?.id) {
      setDraftId(json.data.id)
      localStorage.setItem(DRAFT_KEY, json.data.id)
    }
  }

  const handleNextStage = async () => {
    if (stageIndex < totalStages - 1) {
      setStageIndex(prev => prev + 1)
      setAutoMessage(template?.stages[stageIndex + 1]?.autoMessage || null)
      await saveDraft()
    } else {
      setSubmitting(true)
      await saveDraft()
      const sum = generateSummary(selectedCategory || 'OTHER', answers)
      setSummary(sum)

      try {
        const res = await fetch('/api/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit', userId, categoryId: selectedCategory, draftId, answers }),
        })
        const json = await res.json()
        if (json.data?.project) {
          setProjectId(json.data.project.id)
          localStorage.removeItem(DRAFT_KEY)
        }
        setSummary(sum)
      } catch {}

      setSubmitting(false)
      setStep('summary')
    }
  }

  const handleBack = () => {
    if (stageIndex > 0) {
      setStageIndex(prev => prev - 1)
    } else {
      setStep('category')
    }
  }

  const renderQuestion = (q: BriefingStage['questions'][0]) => {
    switch (q.type) {
      case 'text':
      case 'url':
        return (
          <Input
            placeholder={q.placeholder}
            value={answers[q.id] || ''}
            onChange={e => handleAnswer(q.id, e.target.value)}
            required={q.required}
          />
        )
      case 'textarea':
        return (
          <textarea
            className="w-full min-h-[80px] rounded-md bg-[var(--input-bg)] px-2.5 py-2 text-sm text-[var(--text)] placeholder:text-[var(--placeholder)] focus:outline-none focus:ring-1.5 focus:ring-[var(--primary)] resize-vertical"
            placeholder={q.placeholder}
            value={answers[q.id] || ''}
            onChange={e => handleAnswer(q.id, e.target.value)}
            required={q.required}
          />
        )
      case 'select':
        return (
          <select
            className="w-full h-8 rounded-md bg-[var(--input-bg)] px-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1.5 focus:ring-[var(--primary)]"
            value={answers[q.id] || ''}
            onChange={e => handleAnswer(q.id, e.target.value)}
            required={q.required}
          >
            <option value="">Selecionar...</option>
            {q.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-1.5">
            {q.options?.map(opt => {
              const selected = (answers[q.id] || []).includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleMultiSelect(q.id, opt)}
                  className={`px-2 py-1 rounded text-2xs transition-colors ${
                    selected
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]/70'
                  }`}
                >
                  {selected && <Check className="h-2.5 w-2.5 inline mr-0.5" />}
                  {opt}
                </button>
              )
            })}
          </div>
        )
      case 'number':
        return (
          <Input
            type="number"
            placeholder={q.placeholder}
            value={answers[q.id] || ''}
            onChange={e => handleAnswer(q.id, e.target.value)}
            required={q.required}
          />
        )
      case 'file':
        return (
          <div className="flex items-center gap-2 p-3 border border-dashed border-[var(--border)] rounded-md text-xs text-[var(--text-muted)]">
            <Paperclip className="h-3.5 w-3.5" />
            <span>Arraste arquivos aqui ou clique para selecionar</span>
          </div>
        )
      default:
        return <Input value={answers[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value)} />
    }
  }

  if (!userId) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          {step !== 'category' && (
            <button onClick={handleBack} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-medium text-[var(--text)]">Solicitar Novo Projeto</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {step === 'category' && 'Escolha o tipo de serviço'}
              {step === 'briefing' && `${stageIndex + 1} de ${totalStages} etapas`}
              {step === 'summary' && 'Projeto enviado com sucesso!'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {step === 'briefing' && (
          <div className="mb-6 space-y-1.5">
            <div className="flex items-center justify-between text-2xs text-[var(--text-muted)]">
              <span>{template?.stages[stageIndex]?.title}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}

        {/* Category selection */}
        {step === 'category' && (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {SERVICE_CATEGORIES.map(cat => (
              <Card
                key={cat.id}
                className="cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                onClick={() => handleSelectCategory(cat.id as ServiceCategory)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <p className="text-sm font-medium text-[var(--text)]">{cat.name}</p>
                  <p className="text-2xs text-[var(--text-muted)] mt-0.5">{cat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Auto message */}
        {step === 'briefing' && autoMessage && (
          <div className="mb-4 p-3 rounded-md bg-[var(--primary-subtle)] border-l-[3px] border-[var(--primary)]">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{autoMessage}</p>
          </div>
        )}

        {/* Briefing questions */}
        {step === 'briefing' && currentStage && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <h2 className="text-sm font-medium text-[var(--text)]">{currentStage.title}</h2>
                {currentStage.description && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{currentStage.description}</p>
                )}
              </div>

              {currentStage.questions.map(q => (
                <div key={q.id} className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text)]">
                    {q.label}
                    {q.required && <span className="text-[var(--destructive)] ml-0.5">*</span>}
                  </label>
                  {q.helpText && (
                    <p className="text-2xs text-[var(--text-muted)] -mt-0.5 mb-0.5">{q.helpText}</p>
                  )}
                  {renderQuestion(q)}
                </div>
              ))}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={handleBack} disabled={stageIndex === 0}>
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Voltar
                </Button>
                <Button onClick={handleNextStage} disabled={submitting}>
                  {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  {stageIndex < totalStages - 1 ? (
                    <>Próxima etapa <ArrowRight className="ml-1 h-3.5 w-3.5" /></>
                  ) : (
                    <>Enviar projeto <Check className="ml-1 h-3.5 w-3.5" /></>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {step === 'summary' && (
          <Card>
            <CardContent className="p-6 space-y-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-subtle)] mx-auto">
                <Check className="h-6 w-6 text-[var(--success)]" />
              </div>

              <div>
                <h2 className="text-base font-medium text-[var(--text)]">Projeto enviado com sucesso!</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">A equipe irá analisar e entrar em contato em breve.</p>
              </div>

              <div className="bg-[var(--surface-hover)] rounded-md p-4 text-left">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2">Resumo do projeto</p>
                <p className="text-sm text-[var(--text)] leading-relaxed">{summary}</p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={() => router.push('/portal')}>
                  Ir para o portal
                </Button>
                {projectId && (
                  <Button size="sm" onClick={() => router.push(`/projects/${projectId}`)}>
                    Ver projeto
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
