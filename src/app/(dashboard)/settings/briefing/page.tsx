'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, Save, GripVertical, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { SERVICE_CATEGORIES } from '@/lib/briefing-engine'

interface EditableQuestion {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'file'
  required: boolean
  options?: string[]
  placeholder?: string
}

interface EditableStage {
  id: string
  title: string
  autoMessage: string
  questions: EditableQuestion[]
}

const STORAGE_KEY = 'anderflow_briefing_templates'

function loadTemplates(): Record<string, EditableStage[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

function saveTemplates(data: Record<string, EditableStage[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default function BriefingAdminPage() {
  const [templates, setTemplates] = useState<Record<string, EditableStage[]>>(loadTemplates)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const stages = selectedCategory ? templates[selectedCategory] || [] : []

  const addStage = () => {
    if (!selectedCategory) return
    const newStage: EditableStage = {
      id: `stage_${Date.now()}`,
      title: 'Nova etapa',
      autoMessage: '',
      questions: [],
    }
    const updated = { ...templates, [selectedCategory]: [...stages, newStage] }
    setTemplates(updated)
    saveTemplates(updated)
    toast.success('Etapa adicionada')
  }

  const updateStage = (stageId: string, field: keyof EditableStage, value: any) => {
    const updated = {
      ...templates,
      [selectedCategory!]: stages.map(s => s.id === stageId ? { ...s, [field]: value } : s),
    }
    setTemplates(updated)
    saveTemplates(updated)
  }

  const removeStage = (stageId: string) => {
    const updated = { ...templates, [selectedCategory!]: stages.filter(s => s.id !== stageId) }
    setTemplates(updated)
    saveTemplates(updated)
    toast.success('Etapa removida')
  }

  const addQuestion = (stageId: string) => {
    const newQ: EditableQuestion = {
      id: `q_${Date.now()}`,
      label: 'Nova pergunta',
      type: 'text',
      required: false,
      options: [],
      placeholder: '',
    }
    const updated = {
      ...templates,
      [selectedCategory!]: stages.map(s => s.id === stageId ? { ...s, questions: [...s.questions, newQ] } : s),
    }
    setTemplates(updated)
    saveTemplates(updated)
  }

  const updateQuestion = (stageId: string, questionId: string, field: keyof EditableQuestion, value: any) => {
    const updated = {
      ...templates,
      [selectedCategory!]: stages.map(s =>
        s.id === stageId ? {
          ...s,
          questions: s.questions.map(q => q.id === questionId ? { ...q, [field]: value } : q),
        } : s
      ),
    }
    setTemplates(updated)
    saveTemplates(updated)
  }

  const updateQuestionOptions = (stageId: string, questionId: string, optionsStr: string) => {
    const options = optionsStr.split(',').map(o => o.trim()).filter(Boolean)
    updateQuestion(stageId, questionId, 'options', options)
  }

  const removeQuestion = (stageId: string, questionId: string) => {
    const updated = {
      ...templates,
      [selectedCategory!]: stages.map(s =>
        s.id === stageId ? { ...s, questions: s.questions.filter(q => q.id !== questionId) } : s
      ),
    }
    setTemplates(updated)
    saveTemplates(updated)
  }

  return (
    <div className="p-4 space-y-5 max-w-4xl mx-auto">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft className="h-4 w-4" /> Voltar para configurações
      </Link>

      <div>
        <h1 className="text-lg font-medium text-[var(--text)]">Editor de Briefing</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Crie e edite templates de perguntas por categoria de serviço</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card>
          <CardContent className="p-3 space-y-1">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2">Categorias</p>
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setExpandedStage(null); setExpandedQuestion(null) }}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
                  selectedCategory === cat.id ? 'bg-[var(--primary-subtle)] text-[var(--primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {cat.icon} {cat.name}
                {templates[cat.id]?.length > 0 && (
                  <span className="float-right text-2xs text-[var(--text-muted)]">{templates[cat.id].length} etapas</span>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!selectedCategory && (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">
              Selecione uma categoria à esquerda para editar seu template
            </div>
          )}

          {selectedCategory && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-[var(--text)]">
                  {SERVICE_CATEGORIES.find(c => c.id === selectedCategory)?.name} — {stages.length} etapa(s)
                </h2>
                <Button size="sm" variant="outline" onClick={addStage} className="h-7 text-xs">
                  <Plus className="mr-1 h-3 w-3" /> Nova etapa
                </Button>
              </div>

              {stages.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-[var(--text-muted)]">
                    Nenhuma etapa configurada. Clique em "Nova etapa" para começar.
                  </CardContent>
                </Card>
              )}

              {stages.map(stage => {
                const isExpanded = expandedStage === stage.id
                return (
                  <Card key={stage.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                          className="flex items-center gap-2 text-left flex-1 min-w-0"
                        >
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                          <CardTitle className="text-xs font-medium truncate">{stage.title}</CardTitle>
                          <span className="text-2xs text-[var(--text-muted)]">{stage.questions.length} perguntas</span>
                        </button>
                        <Button variant="ghost" size="icon-sm" onClick={() => removeStage(stage.id)} className="ml-1">
                          <Trash2 className="h-3 w-3 text-[var(--text-muted)] hover:text-[var(--destructive)]" />
                        </Button>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="space-y-3 pt-0">
                        <div className="space-y-1.5">
                          <label className="text-2xs text-[var(--text-muted)]">Título da etapa</label>
                          <Input value={stage.title} onChange={e => updateStage(stage.id, 'title', e.target.value)} className="h-7 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-2xs text-[var(--text-muted)]">Mensagem automática</label>
                          <textarea
                            className="w-full min-h-[50px] rounded-md bg-[var(--input-bg)] px-2.5 py-1.5 text-xs text-[var(--text)] resize-vertical focus:outline-none focus:ring-1.5 focus:ring-[var(--primary)]"
                            value={stage.autoMessage} onChange={e => updateStage(stage.id, 'autoMessage', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-2xs font-medium text-[var(--text-muted)] uppercase">Perguntas</p>
                            <Button size="sm" variant="ghost" onClick={() => addQuestion(stage.id)} className="h-6 text-2xs">
                              <Plus className="mr-0.5 h-2.5 w-2.5" /> Adicionar
                            </Button>
                          </div>

                          {stage.questions.map((q, qi) => {
                            const qExpanded = expandedQuestion === q.id
                            return (
                              <div key={q.id} className="bg-[var(--surface-hover)] rounded p-2.5 space-y-2">
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-3 w-3 text-[var(--text-muted)] shrink-0" />
                                  <button onClick={() => setExpandedQuestion(qExpanded ? null : q.id)} className="flex-1 text-left">
                                    <span className="text-xs font-medium text-[var(--text)]">{q.label || '(sem título)'}</span>
                                  </button>
                                  <Badge variant="secondary" className="text-2xs">{q.type}</Badge>
                                  {q.required && <Badge variant="destructive" className="text-2xs">*</Badge>}
                                  <Button variant="ghost" size="icon-sm" onClick={() => removeQuestion(stage.id, q.id)}>
                                    <Trash2 className="h-2.5 w-2.5 text-[var(--text-muted)]" />
                                  </Button>
                                </div>

                                {qExpanded && (
                                  <div className="space-y-1.5 pl-5">
                                    <Input placeholder="Título da pergunta" value={q.label} onChange={e => updateQuestion(stage.id, q.id, 'label', e.target.value)} className="h-7 text-xs" />
                                    <div className="flex gap-2">
                                      <select className="h-7 rounded bg-[var(--input-bg)] px-2 text-xs text-[var(--text)] focus:outline-none focus:ring-1.5 focus:ring-[var(--primary)]"
                                        value={q.type} onChange={e => updateQuestion(stage.id, q.id, 'type', e.target.value)}>
                                        <option value="text">Texto</option>
                                        <option value="textarea">Textarea</option>
                                        <option value="select">Select</option>
                                        <option value="multiselect">Multi-select</option>
                                        <option value="number">Número</option>
                                        <option value="file">Arquivo</option>
                                      </select>
                                      <label className="flex items-center gap-1 text-2xs text-[var(--text-muted)]">
                                        <input type="checkbox" checked={q.required} onChange={e => updateQuestion(stage.id, q.id, 'required', e.target.checked)} />
                                        Obrigatório
                                      </label>
                                    </div>
                                    {(q.type === 'select' || q.type === 'multiselect') && (
                                      <div>
                                        <label className="text-2xs text-[var(--text-muted)]">Opções (separadas por vírgula)</label>
                                        <Input
                                          placeholder="Opção 1, Opção 2, Opção 3"
                                          value={(q.options || []).join(', ')}
                                          onChange={e => updateQuestionOptions(stage.id, q.id, e.target.value)}
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                    )}
                                    <Input placeholder="Placeholder" value={q.placeholder || ''} onChange={e => updateQuestion(stage.id, q.id, 'placeholder', e.target.value)} className="h-7 text-xs" />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}

              {stages.length > 0 && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => { saveTemplates(templates); toast.success('Templates salvos com sucesso!') }} className="h-8 text-xs">
                    <Save className="mr-1 h-3 w-3" /> Salvar templates
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
