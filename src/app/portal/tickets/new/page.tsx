'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { IconLoader, IconCheck } from '@/components/icons'
import { Sparkles, Check, Edit3 } from 'lucide-react'

export default function NewTicketPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [description, setDescription] = useState('')
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const handleAnalyze = async () => {
    if (!description.trim()) { toast.error('Descreva seu problema primeiro'); return }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const json = await res.json()
      if (res.ok) {
        setAiResult(json)
        setCategory(json.category || 'duvida')
        setPriority(json.priority || 'MEDIUM')
        setTitle(description.slice(0, 80))
        setStep(2)
      } else {
        toast.error(json.error || 'Erro na analise')
      }
    } catch {
      toast.error('Erro ao conectar com IA')
    }
    setAiLoading(false)
  }

  const handleCreate = async () => {
    setCreating(true)
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || description.slice(0, 80),
        description,
        category: category || 'duvida',
        priority,
        message: description,
      }),
    })
    if (res.ok) {
      toast.success('Ticket criado com sucesso!')
      router.push('/portal/tickets')
    } else {
      const json = await res.json()
      toast.error(json.error || 'Erro ao criar ticket')
    }
    setCreating(false)
  }

  const categoryColors: Record<string, string> = {
    bug: 'var(--destructive)',
    feature: 'var(--accent)',
    duvida: 'var(--info)',
    urgente: 'var(--warning)',
  }

  return (
    <div className="p-6 max-w-xl mx-auto animate-page-enter space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-[600] ${
          step >= 1 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-3)]'
        }`}>1</div>
        <div className={`h-0.5 flex-1 ${step >= 2 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-[600] ${
          step >= 2 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-3)]'
        }`}>2</div>
        <div className={`h-0.5 flex-1 ${step >= 3 ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-[600] ${
          step >= 3 ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-3)]'
        }`}>3</div>
      </div>

      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-[15px] font-[500]">Descreva seu problema</h2>
              <p className="text-[12px] text-[var(--text-3)] mt-0.5">
                Quanto mais detalhes, melhor a IA podera classificar seu ticket.
              </p>
            </div>
            <textarea
              className="w-full min-h-[160px] rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
              placeholder="Ex: Nao consigo acessar a pagina de briefing. Quando clico no botao, nada acontece. Ja tentei limpar o cache..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <Button onClick={handleAnalyze} disabled={aiLoading || !description.trim()} className="w-full h-10 gap-2">
              {aiLoading ? (
                <IconLoader className="w-[14px] h-[14px] animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Analisar com IA
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && aiResult && (
        <Card className="animate-card-pop">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="text-[15px] font-[500]">Analise da IA</h2>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[var(--text-3)]">Categoria sugerida:</span>
                <Badge className="text-[11px]" style={{ background: categoryColors[category] || 'var(--surface-2)', color: '#fff' }}>
                  {category}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[var(--text-3)]">Prioridade:</span>
                <Badge variant={priority === 'CRITICAL' ? 'destructive' : priority === 'HIGH' ? 'warning' : 'secondary'} className="text-[10px]">
                  {priority}
                </Badge>
              </div>
              {aiResult.suggestedReply && (
                <div>
                  <span className="text-[12px] text-[var(--text-3)]">Resposta inicial sugerida:</span>
                  <p className="text-[12px] text-[var(--text-2)] mt-1 bg-[var(--surface)] rounded p-2">{aiResult.suggestedReply}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => { setStep(3) }} className="flex-1 gap-1">
                <Check className="h-4 w-4" /> Parece correto
              </Button>
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                <Edit3 className="h-3.5 w-3.5" /> Alterar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="animate-card-pop">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-[15px] font-[500]">Confirmar ticket</h2>
            <div className="space-y-2 text-[12px] text-[var(--text)]">
              <p><strong className="text-[var(--text-3)]">Titulo:</strong> {title || description.slice(0, 80)}</p>
              <p><strong className="text-[var(--text-3)]">Descricao:</strong> {description}</p>
              <div className="flex items-center gap-2">
                <strong className="text-[var(--text-3)]">Categoria:</strong>
                <Badge style={{ background: categoryColors[category] || 'var(--surface-2)', color: '#fff' }} className="text-[10px]">{category}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <strong className="text-[var(--text-3)]">Prioridade:</strong>
                <Badge variant="secondary" className="text-[10px]">{priority}</Badge>
              </div>
            </div>
            <Button onClick={handleCreate} disabled={creating} className="w-full h-10 gap-2">
              {creating ? (
                <IconLoader className="w-[14px] h-[14px] animate-spin" />
              ) : (
                <IconCheck className="w-[14px] h-[14px]" />
              )}
              Criar ticket
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
