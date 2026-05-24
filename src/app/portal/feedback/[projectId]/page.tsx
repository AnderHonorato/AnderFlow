'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { CheckCircle2 } from 'lucide-react'

export default function FeedbackPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (score === null) return
    setLoading(true)
    try {
      const res = await fetch('/api/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, score, comment: comment || undefined }),
      })
      if (res.ok) {
        setSubmitted(true)
        confetti({ particleCount: 100, spread: 70, colors: ['#E8622A', '#3D9A6E'] })
        toast.success('Obrigado pela sua avaliacao!')
      } else {
        const json = await res.json()
        toast.error(json.error || 'Erro ao enviar avaliacao')
      }
    } catch {
      toast.error('Erro ao enviar avaliacao')
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <Card className="max-w-md w-full text-center py-10 px-6 animate-card-pop">
          <CardContent className="space-y-4">
            <CheckCircle2 className="w-16 h-16 text-[var(--success)] mx-auto" />
            <h1 className="text-[20px] font-[600] text-[var(--text)]">Obrigado!</h1>
            <p className="text-[13px] text-[var(--text-2)]">
              Sua avaliacao foi registrada com sucesso. Agradecemos seu feedback e ele nos ajuda a melhorar continuamente.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-md w-full space-y-6 animate-page-enter">
        <div className="text-center space-y-2">
          <h1 className="text-[22px] font-[600] tracking-[-0.02em] text-[var(--text)]">
            Como foi sua experiencia?
          </h1>
          <p className="text-[13px] text-[var(--text-2)]">
            Avalie de 0 a 10 o quanto voce recomendaria nosso servico
          </p>
        </div>

        <div className="grid grid-cols-11 gap-1.5">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setScore(i)}
              className={`h-10 rounded-lg text-[13px] font-[500] transition-all transition-duration-[200ms] transition-timing-function-[cubic-bezier(0.2,0,0,1)] border
                ${score === i
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)] scale-105 shadow-lg'
                  : 'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text)]'
                }`}
            >
              {i}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <textarea
            className="w-full min-h-[80px] rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-vertical"
            placeholder="Conte-nos mais sobre sua experiencia (opcional)..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={score === null || loading}
          className="w-full h-10 text-[13px]"
        >
          {loading ? 'Enviando...' : 'Enviar avaliacao'}
        </Button>

        <p className="text-center text-[11px] text-[var(--text-3)]">
          Sua resposta nos ajuda a oferecer um servico cada vez melhor.
        </p>
      </div>
    </div>
  )
}
