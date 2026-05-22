'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  ArrowLeft, ArrowRight, Check, Loader2,
  Paperclip, X, Image, File, Save, Upload,
} from 'lucide-react'
import { SERVICE_CATEGORIES, getTemplateForCategory, generateSummary } from '@/lib/briefing-engine'
import type { BriefingTemplate, BriefingStage, ServiceCategory } from '@/lib/briefing-engine'

const DRAFT_KEY = 'briefing_draft_id'

interface UploadedFile {
  name: string
  size: number
  type: string
  preview?: string
}

export default function BriefingWizardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><svg className="animate-spin h-6 w-6 text-[var(--text-3)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2a6 6 0 016 6"/></svg></div>}>
      <BriefingWizardContent />
    </Suspense>
  )
}

function BriefingWizardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const categoryParam = searchParams.get('category') as ServiceCategory | null

  const [step, setStep] = useState<'category' | 'briefing' | 'summary'>('category')
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(categoryParam)
  const [template, setTemplate] = useState<BriefingTemplate | null>(null)
  const [stageIndex, setStageIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [files, setFiles] = useState<Record<string, UploadedFile[]>>({})
  const [draftId, setDraftId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [summary, setSummary] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [autoMessage, setAutoMessage] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [dragOver, setDragOver] = useState<string | null>(null)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  const userId = session?.user?.id
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      Object.values(files).flat().forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
    }
  }, [files])

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

  // ── Autosave with debounce + visual feedback ──
  const saveDraft = useCallback(async () => {
    if (!userId || !selectedCategory || !mountedRef.current) return
    setSaving(true)
    const res = await fetch('/api/briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', userId, categoryId: selectedCategory, draftId, currentStage: stageIndex, currentStep: 0, answers }),
    })
    if (!mountedRef.current) return
    const json = await res.json()
    if (json.data?.id) {
      setDraftId(json.data.id)
      localStorage.setItem(DRAFT_KEY, json.data.id)
      setLastSaved(new Date())
    }
    setSaving(false)
  }, [userId, selectedCategory, draftId, stageIndex, answers])

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(saveDraft, 2000)
  }, [saveDraft])

  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [])

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    setValidationErrors([])
    triggerAutoSave()
  }

  const handleMultiSelect = (questionId: string, option: string) => {
    setAnswers(prev => {
      const current = prev[questionId] || []
      const exists = current.includes(option)
      return { ...prev, [questionId]: exists ? current.filter((o: string) => o !== option) : [...current, option] }
    })
    setValidationErrors([])
    triggerAutoSave()
  }

  // ── File upload with drag & drop + preview ──
  const handleFileDrop = (questionId: string, fileList: FileList | null) => {
    if (!fileList) return
    const newFiles: UploadedFile[] = []
    Array.from(fileList).forEach(file => {
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      newFiles.push({ name: file.name, size: file.size, type: file.type, preview })
    })
    setFiles(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), ...newFiles],
    }))
    setDragOver(null)
    triggerAutoSave()
  }

  const removeFile = (questionId: string, index: number) => {
    setFiles(prev => {
      const updated = [...(prev[questionId] || [])]
      const removed = updated.splice(index, 1)[0]
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return { ...prev, [questionId]: updated }
    })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  // ── Required field validation ──
  const validateRequired = (): boolean => {
    if (!currentStage) return true
    const errors: string[] = []
    currentStage.questions.forEach(q => {
      if (!q.required) return
      const val = answers[q.id]
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        errors.push(q.label)
      }
    })
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleNextStage = async () => {
    if (!validateRequired()) {
      toast.error(`Preencha os campos obrigatórios: ${validationErrors.join(', ')}`)
      return
    }

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

  const handleSaveAndExit = async () => {
    await saveDraft()
    toast.success('Progresso salvo! Você pode continuar depois.')
    router.push('/portal')
  }

  const handleBack = () => {
    if (stageIndex > 0) {
      setStageIndex(prev => prev - 1)
      setValidationErrors([])
    } else {
      setStep('category')
    }
  }

  const renderQuestion = (q: BriefingStage['questions'][0]) => {
    const isError = validationErrors.includes(q.label)

    switch (q.type) {
      case 'text':
      case 'url':
        return (
          <Input
            placeholder={q.placeholder}
            value={answers[q.id] || ''}
            onChange={e => handleAnswer(q.id, e.target.value)}
            className={isError ? 'ring-1.5 !ring-[var(--destructive)]' : ''}
          />
        )
      case 'textarea':
        return (
          <textarea
            className={`w-full min-h-[80px] rounded-md bg-[var(--input-bg)] px-2.5 py-2 text-sm text-[var(--text)] placeholder:text-[var(--placeholder)] focus:outline-none focus:ring-1.5 focus:ring-[var(--primary)] resize-vertical ${isError ? 'ring-1.5 !ring-[var(--destructive)]' : ''}`}
            placeholder={q.placeholder}
            value={answers[q.id] || ''}
            onChange={e => handleAnswer(q.id, e.target.value)}
          />
        )
      case 'select':
        return (
          <select
            className={`w-full h-8 rounded-md bg-[var(--input-bg)] px-2.5 text-sm text-[var(--text)] focus:outline-none focus:ring-1.5 focus:ring-[var(--primary)] ${isError ? 'ring-1.5 !ring-[var(--destructive)]' : ''}`}
            value={answers[q.id] || ''}
            onChange={e => handleAnswer(q.id, e.target.value)}
          >
            <option value="">Selecionar...</option>
            {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )
      case 'multiselect':
        return (
          <div className={`flex flex-wrap gap-1.5 ${isError ? 'p-1 rounded ring-1.5 ring-[var(--destructive)]' : ''}`}>
            {q.options?.map(opt => {
              const selected = (answers[q.id] || []).includes(opt)
              return (
                <button key={opt} type="button" onClick={() => handleMultiSelect(q.id, opt)}
                  className={`px-2 py-1 rounded text-2xs transition-colors ${selected ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]/70'}`}>
                  {selected && <Check className="h-2.5 w-2.5 inline mr-0.5" />}{opt}
                </button>
              )
            })}
          </div>
        )
      case 'number':
        return (
          <Input type="number" placeholder={q.placeholder} value={answers[q.id] || ''}
            onChange={e => handleAnswer(q.id, e.target.value)}
            className={isError ? 'ring-1.5 !ring-[var(--destructive)]' : ''}
          />
        )
      case 'file':
        const attachedFiles = files[q.id] || []
        return (
          <div className="space-y-2">
            <div
              className={`relative flex items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                dragOver === q.id ? 'border-[var(--primary)] bg-[var(--primary-subtle)]' : 'border-[var(--border)] hover:border-[var(--text-muted)]'
              } ${isError ? '!border-[var(--destructive)]' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(q.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => { e.preventDefault(); handleFileDrop(q.id, e.dataTransfer.files) }}
              onClick={() => document.getElementById(`file-input-${q.id}`)?.click()}
            >
              <div className="text-center">
                <Upload className="h-5 w-5 mx-auto text-[var(--text-muted)] mb-1" />
                <p className="text-xs text-[var(--text-muted)]">Arraste arquivos ou clique para selecionar</p>
                <p className="text-2xs text-[var(--text-muted)] mt-0.5">Imagens, PDFs, vídeos (máx 10MB)</p>
              </div>
              <input
                id={`file-input-${q.id}`}
                type="file"
                multiple
                className="hidden"
                onChange={e => handleFileDrop(q.id, e.target.files)}
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
            </div>
            {attachedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded bg-[var(--surface-hover)]">
                {file.preview ? (
                  <img src={file.preview} alt={file.name} className="h-8 w-8 rounded object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-[var(--surface)]">
                    {file.type.startsWith('video/') ? <File className="h-4 w-4 text-[var(--text-muted)]" /> :
                     file.type.includes('pdf') ? <FileTextIcon className="h-4 w-4 text-[var(--text-muted)]" /> :
                     <Image className="h-4 w-4 text-[var(--text-muted)]" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text)] truncate">{file.name}</p>
                  <p className="text-2xs text-[var(--text-muted)]">{formatSize(file.size)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFile(q.id, i) }}
                  className="text-[var(--text-muted)] hover:text-[var(--destructive)] transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
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
        <div className="flex items-center gap-3 mb-8">
          {step !== 'category' && (
            <button onClick={handleBack} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-medium text-[var(--text)]">Solicitar Novo Projeto</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {step === 'category' && 'Escolha o tipo de serviço'}
              {step === 'briefing' && `${stageIndex + 1} de ${totalStages} etapas`}
              {step === 'summary' && 'Projeto enviado com sucesso!'}
            </p>
          </div>
          {step === 'briefing' && (
            <Button variant="ghost" size="sm" onClick={handleSaveAndExit} disabled={saving} className="text-xs">
              <Save className="mr-1 h-3 w-3" /> Continuar depois
            </Button>
          )}
        </div>

        {step === 'briefing' && (
          <div className="mb-6 space-y-1.5">
            <div className="flex items-center justify-between text-2xs text-[var(--text-muted)]">
              <span>{template?.stages[stageIndex]?.title}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1" />
            {lastSaved && (
              <p className="text-2xs text-[var(--success)] text-right">
                {saving ? 'Salvando...' : `Salvo ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            )}
          </div>
        )}

        {step === 'category' && (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {SERVICE_CATEGORIES.map(cat => (
              <Card key={cat.id} className="cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                onClick={() => handleSelectCategory(cat.id as ServiceCategory)}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <p className="text-sm font-medium text-[var(--text)]">{cat.name}</p>
                  <p className="text-2xs text-[var(--text-muted)] mt-0.5">{cat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 'briefing' && autoMessage && (
          <div className="mb-4 p-3 rounded-md bg-[var(--primary-subtle)] border-l-[3px] border-[var(--primary)]">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{autoMessage}</p>
          </div>
        )}

        {step === 'briefing' && currentStage && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <h2 className="text-sm font-medium text-[var(--text)]">{currentStage.title}</h2>
                {currentStage.description && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{currentStage.description}</p>
                )}
              </div>

              {validationErrors.length > 0 && (
                <div className="p-2.5 rounded bg-[var(--destructive-subtle)] border-l-[3px] border-[var(--destructive)]">
                  <p className="text-xs font-medium text-[var(--destructive)]">Campos obrigatórios não preenchidos:</p>
                  <p className="text-2xs text-[var(--destructive)] mt-0.5">{validationErrors.join(', ')}</p>
                </div>
              )}

              {currentStage.questions.map(q => (
                <div key={q.id} className="space-y-1.5">
                  <label className={`block text-xs font-medium ${validationErrors.includes(q.label) ? 'text-[var(--destructive)]' : 'text-[var(--text)]'}`}>
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

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
