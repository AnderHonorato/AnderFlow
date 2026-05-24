'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Sparkles, Loader2, Check, X, Undo2 } from 'lucide-react'

interface Props {
  value: string
  onChange: (newValue: string) => void
  context?: string
}

export function ImproveTextButton({ value, onChange, context }: Props) {
  const [loading, setLoading] = useState(false)
  const [original, setOriginal] = useState('')
  const [improved, setImproved] = useState('')

  const handleImprove = async () => {
    if (!value.trim()) { toast.error('Digite algum texto primeiro'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value, context }),
      })
      const json = await res.json()
      if (json.improved) {
        setOriginal(value)
        setImproved(json.improved)
      } else {
        toast.error(json.error || 'Erro ao melhorar')
      }
    } catch { toast.error('Erro ao melhorar texto') }
    setLoading(false)
  }

  const accept = () => { onChange(improved); setOriginal(''); setImproved('') }
  const discard = () => { setOriginal(''); setImproved('') }
  const undo = () => { onChange(original); setOriginal(''); setImproved('') }

  if (improved) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] animate-fade-up">
        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[var(--success)]" onClick={accept}><Check className="h-3 w-3 mr-0.5" /> Aceitar</Button>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[var(--destructive)]" onClick={discard}><X className="h-3 w-3 mr-0.5" /> Descartar</Button>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-[var(--text-3)]" onClick={undo}><Undo2 className="h-3 w-3 mr-0.5" /> Original</Button>
      </div>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleImprove} disabled={loading} className="h-7 text-[11px] gap-1">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      Melhorar ✨
    </Button>
  )
}
