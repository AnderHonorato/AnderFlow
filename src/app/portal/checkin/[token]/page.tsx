'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

const moods = [
  { value: 1, emoji: '😢', label: 'Insatisfeito' },
  { value: 2, emoji: '😐', label: 'Neutro' },
  { value: 3, emoji: '😊', label: 'Satisfeito' },
  { value: 4, emoji: '🤩', label: 'Muito satisfeito' },
]

export default function CheckinPage() {
  const { token } = useParams<{ token: string }>()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Link inválido.')
    }
  }, [token])

  const handleSubmit = async (mood: number) => {
    if (submitted || loading) return
    setSelectedMood(mood)
    setLoading(true)

    try {
      const res = await fetch('/api/weekly-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mood }),
      })

      const json = await res.json()

      if (res.ok) {
        setSubmitted(true)
      } else {
        toast.error(json.error || 'Erro ao enviar check-in')
        setSelectedMood(null)
      }
    } catch {
      toast.error('Erro de conexão')
      setSelectedMood(null)
    }
    setLoading(false)
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <Card className="w-full max-w-[400px] text-center">
          <CardContent className="p-8">
            <p className="text-4xl mb-4">⚠️</p>
            <h1 className="text-lg font-medium text-[var(--text)]">Link inválido</h1>
            <p className="text-sm text-[var(--text-3)] mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <Card className="w-full max-w-[400px] text-center animate-page-enter">
          <CardContent className="p-8 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10 mx-auto">
              <Check className="h-8 w-8 text-[var(--success)]" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-[var(--text)]">Obrigado pelo seu feedback!</h1>
              <p className="text-sm text-[var(--text-3)] mt-1">
                Sua opinião é muito importante para nós. Até a próxima semana!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <Card className="w-full max-w-[440px] animate-page-enter">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-[17px] font-[500] tracking-[-0.015em] text-[var(--text)]">
              Como você se sente em relação ao projeto esta semana?
            </h1>
            <p className="text-[12px] text-[var(--text-3)]">
              Sua resposta nos ajuda a melhorar continuamente
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleSubmit(mood.value)}
                disabled={loading}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                  loading && selectedMood !== mood.value
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]'
                } ${
                  selectedMood === mood.value && loading
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-[0.97]'
                    : 'border-[var(--border)] bg-[var(--surface)]'
                }`}
              >
                <span className="text-3xl">{mood.emoji}</span>
                <span className="text-[11px] font-[500] text-[var(--text-2)]">{mood.label}</span>
              </button>
            ))}
          </div>

          <p className="text-[10px] text-[var(--text-3)] text-center">
            Leva apenas 2 segundos. Resposta anônima para a equipe.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
