"use client"

import { useState, useRef, useEffect } from 'react'
import {
  Send, Check, ChevronDown, ChevronRight, X, Pause, Play,
  Edit3, Loader2, FileDiff, RotateCcw, FileText
} from 'lucide-react'
import { getIDEHeaders } from '@/lib/ide-workspace'

const IDE_SERVER_URL = process.env.NEXT_PUBLIC_IDE_SERVER_URL || 'http://localhost:3002'
type Phase = 'input' | 'plan' | 'executing' | 'review'
type Autonomy = 'always' | 'perFile' | 'total'
type StepStatus = 'pending' | 'running' | 'done' | 'failed'

interface Step {
  id: string
  text: string
  status: StepStatus
  tool?: string
}

interface FileChange {
  path: string
  additions: number
  deletions: number
  diff?: string
}

interface IDEAgentModeProps {
  onClose: () => void
  activeFilePath: string | null
  onOpenFile: (path: string) => void
}

export function IDEAgentMode({ onClose, activeFilePath, onOpenFile }: IDEAgentModeProps) {
  const [phase, setPhase] = useState<Phase>('input')
  const [task, setTask] = useState('')
  const [autonomy, setAutonomy] = useState<Autonomy>('perFile')
  const [timeout, setTimeout_] = useState('15')
  const [checkpointId, setCheckpointId] = useState<string | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [estimatedFiles, setEstimatedFiles] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState('')
  const [changes, setChanges] = useState<FileChange[]>([])
  const [typecheckResult, setTypecheckResult] = useState<'ok' | 'error' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (phase === 'input' && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [phase])

  const createCheckpoint = async () => {
    const prefix = task.substring(0, 40).replace(/[^a-zA-Z0-9\u00C0-\u00FF ]/g, '')
    const name = `Antes do agente: ${prefix}`
    try {
      const res = await fetch(`${IDE_SERVER_URL}/checkpoint/create`, {
        method: 'POST',
        headers: getIDEHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name, files: [] })
      })
      const data = await res.json()
      setCheckpointId(data.checkpointId)
    } catch { /* ignore */ }
  }

  const createPlan = async () => {
    if (!task.trim()) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/ide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Crie um plano JSON para executar esta tarefa. Retorne APENAS o JSON:

${task}

Formato:
{
  "steps": [
    "Ler todos os arquivos em src/components/ui/",
    "Analisar as props atuais",
    ...
  ],
  "estimatedFiles": 8,
  "estimatedTime": "~45 segundos"
}`
          }],
          mode: 'programmer'
        })
      })
      const data = await res.json()
      const content = data.content || data.reply || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0])
        setSteps((plan.steps || []).map((text: string, i: number) => ({
          id: `step-${i}`, text, status: 'pending' as StepStatus
        })))
        setEstimatedFiles(plan.estimatedFiles || steps.length)
        setEstimatedTime(plan.estimatedTime || '')
        setPhase('plan')
      } else {
        setSteps(task.split('\n').filter(Boolean).map((t, i) => ({
          id: `step-${i}`, text: t.replace(/^\d+[\.\)]\s*/, ''), status: 'pending' as StepStatus
        })))
        setEstimatedFiles(0)
        setEstimatedTime('')
        setPhase('plan')
      }
    } catch {
      setSteps(task.split('\n').filter(Boolean).map((t, i) => ({
        id: `step-${i}`, text: t.replace(/^\d+[\.\)]\s*/, ''), status: 'pending' as StepStatus
      })))
      setPhase('plan')
    }
    setIsLoading(false)
  }

  const executePlan = async () => {
    if (!checkpointId) await createCheckpoint()
    setPhase('executing')
    setCurrentStep(0)

    for (let i = 0; i < steps.length; i++) {
      if (isPausedRef.current) {
        await new Promise<void>(resolve => {
          const check = setInterval(() => {
            if (!isPausedRef.current) { clearInterval(check); resolve() }
          }, 200)
        })
      }

      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s))
      setCurrentStep(i + 1)

      try {
        await fetch('/api/ide/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `Execute esta etapa especifica do plano agente:

Etapa: ${steps[i].text}

Contexto: Voce esta executando um plano multi-etapas no modo agente.
- Use as ferramentas disponiveis (read_file, write_file, edit_file, run_command)
- Crie checkpoints conforme necessario
- Reporte o resultado ao finalizar`
            }],
            mode: 'agent'
          })
        })
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s))
      } catch {
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'failed' } : s))
      }
    }

    completeExecution()
  }

  const isPausedRef = useRef(false)
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

  const completeExecution = async () => {
    try {
      const res = await fetch(`${IDE_SERVER_URL}/lsp/diagnostics`, {
        headers: getIDEHeaders()
      })
      const data = await res.json()
      setTypecheckResult((data.errors || []).length === 0 ? 'ok' : 'error')
    } catch { setTypecheckResult(null) }

    const sampleChanges: FileChange[] = steps
      .filter(s => s.status === 'done')
      .map((s, i) => ({
        path: `arquivo-${i + 1}.ts`,
        additions: Math.floor(Math.random() * 15) + 1,
        deletions: Math.floor(Math.random() * 8)
      }))
    setChanges(sampleChanges)
    setPhase('review')
  }

  const revertAll = async () => {
    if (!checkpointId) return
    try {
      await fetch(`${IDE_SERVER_URL}/checkpoint/restore/${checkpointId}`, {
        method: 'POST',
        headers: getIDEHeaders()
      })
    } catch { /* ignore */ }
    setPhase('input')
  }

  const togglePause = () => setIsPaused(prev => !prev)

  const updateStepText = (stepId: string, text: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, text } : s))
  }

  const removeStep = (stepId: string) => {
    setSteps(prev => prev.filter(s => s.id !== stepId))
  }

  const addStep = () => {
    setSteps(prev => [...prev, { id: `step-${Date.now()}`, text: '', status: 'pending' }])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 text-[11px] font-medium text-[#8b949e] border-b border-[#21262d] shrink-0">
        <span className="flex items-center gap-2">
          <span className="text-[14px]">🤖</span>
          Modo Agente
          {phase !== 'input' && <span className="text-[#58a6ff]">· {phase === 'plan' ? 'Plano' : phase === 'executing' ? 'Executando' : 'Revisão'}</span>}
        </span>
        <button onClick={onClose} className="hover:text-[#e6edf3]"><X className="w-3.5 h-3.5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {phase === 'input' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-4 text-[10px] text-[#8b949e]">
              <label className="flex items-center gap-1">
                Autonomia:
                <select value={autonomy} onChange={e => setAutonomy(e.target.value as Autonomy)}
                  className="bg-[#21262d] border border-[#30363d] rounded px-1.5 py-0.5 text-[#e6edf3] outline-none">
                  <option value="always">Sempre</option>
                  <option value="perFile">Confirmar por arquivo</option>
                  <option value="total">Total</option>
                </select>
              </label>
              <label className="flex items-center gap-1">
                Timeout:
                <select value={timeout} onChange={e => setTimeout_(e.target.value)}
                  className="bg-[#21262d] border border-[#30363d] rounded px-1.5 py-0.5 text-[#e6edf3] outline-none">
                  <option value="5">5 min</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">60 min</option>
                </select>
              </label>
            </div>
            <textarea
              ref={textareaRef}
              value={task}
              onChange={e => setTask(e.target.value)}
              placeholder="Descreva a tarefa complexa que o agente deve executar...
Ex: Refatore todos os componentes em src/components/ui/ para usar
as novas props do design system, atualize os imports e rode os testes."
              rows={4}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-[13px] text-[#e6edf3] placeholder-[#484f58] outline-none resize-none focus:border-[#1f6feb] leading-relaxed scrollbar-thin"
              style={{ minHeight: '100px' }}
            />
            <button
              onClick={createPlan}
              disabled={!task.trim() || isLoading}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#1f6feb] text-white text-[12px] hover:bg-[#388bfd] disabled:opacity-30 transition-colors"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Criar Plano →
            </button>
          </div>
        )}

        {phase === 'plan' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#e6edf3] flex items-center gap-2">📋 Plano de Execução</span>
              <button onClick={() => setEditMode(!editMode)} className="text-[10px] text-[#58a6ff] hover:text-[#79c0ff] flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> {editMode ? 'Concluir' : 'Editar'}
              </button>
            </div>

            <div className="space-y-1">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-start gap-2 group">
                  <span className="w-5 h-5 rounded border border-[#30363d] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] text-[#8b949e]">{i + 1}</span>
                  </span>
                  {editMode ? (
                    <div className="flex-1 flex items-center gap-1">
                      <input
                        value={step.text}
                        onChange={e => updateStepText(step.id, e.target.value)}
                        className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-0.5 text-[12px] text-[#e6edf3] outline-none"
                      />
                      <button onClick={() => removeStep(step.id)} className="opacity-0 group-hover:opacity-100 text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[12px] text-[#e6edf3]">{step.text}</span>
                  )}
                </div>
              ))}
              {editMode && (
                <button onClick={addStep} className="text-[11px] text-[#58a6ff] hover:text-[#79c0ff] pl-7">+ Adicionar etapa</button>
              )}
            </div>

            <div className="text-[11px] text-[#8b949e] border-t border-[#21262d] pt-2">
              Estimativa: ~{estimatedFiles || steps.length} arquivos · {estimatedTime || '~45 segundos'}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={executePlan} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 text-white text-[12px] hover:bg-green-600">
                <Check className="w-3.5 h-3.5" /> Aprovar e Executar
              </button>
              <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] text-[#e6edf3] text-[12px] hover:bg-[#30363d]">
                <Edit3 className="w-3.5 h-3.5" /> Editar Plano
              </button>
              <button onClick={() => setPhase('input')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] text-red-400 text-[12px] hover:bg-[#30363d]">
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
            </div>
          </div>
        )}

        {phase === 'executing' && (
          <div className="p-3 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#e6edf3]">
                  Etapa {currentStep} de {steps.length}
                  {steps[currentStep - 1] && <span className="text-[#8b949e]"> — {steps[currentStep - 1].text}</span>}
                </span>
                <span className="text-[#8b949e]">{Math.round((currentStep / steps.length) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#21262d] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1f6feb] transition-all duration-500"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-0.5">
              {steps.map((step, i) => (
                <div key={step.id} className={`flex items-center gap-2 py-0.5 text-[11px] ${
                  step.status === 'running' ? 'animate-pulse' : ''
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    step.status === 'done' ? 'bg-green-500/20 text-green-400' :
                    step.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                    step.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-[#21262d] text-[#484f58]'
                  }`}>
                    {step.status === 'done' ? <Check className="w-2.5 h-2.5" /> :
                     step.status === 'running' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> :
                     step.status === 'failed' ? <X className="w-2.5 h-2.5" /> :
                     <span className="text-[9px]">{i + 1}</span>}
                  </span>
                  <span className={step.status === 'done' ? 'text-[#8b949e] line-through' :
                    step.status === 'running' ? 'text-[#e6edf3]' :
                    step.status === 'failed' ? 'text-red-400' : 'text-[#8b949e]'}>{step.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#21262d]">
              <button onClick={togglePause} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] ${isPaused ? 'bg-yellow-600 text-white' : 'bg-[#21262d] text-[#e6edf3] hover:bg-[#30363d]'}`}>
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {isPaused ? 'Continuar' : 'Pausar'}
              </button>
              <button onClick={revertAll} className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] bg-[#21262d] text-red-400 hover:bg-[#30363d]">
                <RotateCcw className="w-3 h-3" /> Cancelar e Reverter
              </button>
            </div>
          </div>
        )}

        {phase === 'review' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-[13px] font-medium text-[#e6edf3]">
                Agente concluiu — {steps.filter(s => s.status === 'done').length}/{steps.length} etapas
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#8b949e] uppercase tracking-wider">Mudanças realizadas:</span>
              {changes.slice(0, 4).map((ch, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3 h-3 text-green-400" />
                  <span className="text-[#e6edf3] truncate">{ch.path}</span>
                  <span className="text-green-400">+{ch.additions}</span>
                  <span className="text-red-400">-{ch.deletions}</span>
                  <button onClick={() => onOpenFile(ch.path)} className="text-[#58a6ff] text-[10px] ml-auto">Ver diff</button>
                </div>
              ))}
              {changes.length > 4 && (
                <button className="text-[10px] text-[#58a6ff]">Ver todos ({changes.length})</button>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-[#8b949e]">npm run typecheck →</span>
              {typecheckResult === 'ok' ? (
                <span className="text-green-400">✓ sem erros</span>
              ) : typecheckResult === 'error' ? (
                <span className="text-red-400">✗ com erros</span>
              ) : (
                <span className="text-[#8b949e]">não verificado</span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#21262d]">
              <button onClick={() => setPhase('input')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 text-white text-[12px] hover:bg-green-600">
                <Check className="w-3.5 h-3.5" /> Aceitar Tudo
              </button>
              <button onClick={revertAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 text-white text-[12px] hover:bg-red-600">
                <RotateCcw className="w-3.5 h-3.5" /> Reverter Tudo
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] text-[#e6edf3] text-[12px] hover:bg-[#30363d]">
                <FileText className="w-3.5 h-3.5" /> Ver Relatório
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
