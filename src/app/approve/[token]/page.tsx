'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function ApprovePage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState<'idle' | 'approved' | 'rejected'>('idle')
  const [comment, setComment] = useState('')
  const [showComment, setShowComment] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch(`/api/quick-approve?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(json => {
        if (json.data?.valid) {
          setData(json.data)
        } else {
          setData({ valid: false })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  const handleSubmit = async (approved: boolean) => {
    if (!approved && showComment && !comment.trim()) {
      toast.error('Descreva o motivo do ajuste')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/quick-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, approved, comment: approved ? undefined : comment }),
      })
      if (res.ok) {
        setStatus(approved ? 'approved' : 'rejected')
        setSubmitted(true)
      } else {
        const json = await res.json()
        toast.error(json.error || 'Erro ao processar')
      }
    } catch {
      toast.error('Erro de conexão')
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  if (!data?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <Card className="w-full max-w-[400px] text-center">
          <CardContent className="p-8">
            <p className="text-4xl mb-4">⏰</p>
            <h1 className="text-lg font-medium text-[var(--text)]">Link expirado ou inválido</h1>
            <p className="text-sm text-[var(--text-3)] mt-2">Este link de aprovação não está mais disponível.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
        <Card className="w-full max-w-[420px] text-center animate-scale-in">
          <CardContent className="p-8 space-y-4">
            {status === 'approved' ? (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10 mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-[var(--success)]" />
                </div>
                <div>
                  <h1 className="text-lg font-medium text-[var(--text)]">Aprovado!</h1>
                  <p className="text-sm text-[var(--text-3)] mt-1">
                    Obrigado pela sua aprovação. Sua equipe já foi notificada.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--warning)]/10 mx-auto">
                  <XCircle className="h-8 w-8 text-[var(--warning)]" />
                </div>
                <div>
                  <h1 className="text-lg font-medium text-[var(--text)]">Ajuste solicitado</h1>
                  <p className="text-sm text-[var(--text-3)] mt-1">
                    Sua solicitação de ajuste foi enviada. A equipe entrará em contato em breve.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <Card className="w-full max-w-[480px] animate-page-enter">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-[20px] font-[600] tracking-[-0.02em] text-[var(--text)]">
              Aprovação Rápida
            </h1>
            <p className="text-[14px] text-[var(--text-2)]">
              {data.projectName || 'Projeto'}
            </p>
            <p className="text-[12px] text-[var(--text-3)]">
              Revise a entrega e aprove ou solicite ajustes. Não é necessário login.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleSubmit(true)}
              disabled={sending}
              className="flex-1 h-12 text-sm bg-[var(--success)] hover:bg-[var(--success)]/80"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" /> Aprovar
            </Button>
            <Button
              variant="outline"
              onClick={() => { if (showComment) handleSubmit(false); else setShowComment(true) }}
              disabled={sending}
              className="flex-1 h-12 text-sm border-[var(--warning)]/40 text-[var(--warning)] hover:bg-[var(--warning)]/10"
            >
              <XCircle className="mr-2 h-5 w-5" /> Reprovar
            </Button>
          </div>

          {showComment && (
            <div className="space-y-2 animate-fade-up">
              <label className="text-[11px] font-medium text-[var(--text-2)]">O que precisa ser ajustado?</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full min-h-[100px] rounded-lg bg-[var(--surface)] border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--warning)] resize-vertical"
                placeholder="Descreva os ajustes necessários..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowComment(false)} className="text-xs">Cancelar</Button>
                <Button size="sm" onClick={() => handleSubmit(false)} disabled={sending || !comment.trim()} className="text-xs bg-[var(--warning)] hover:bg-[var(--warning)]/80">
                  {sending ? 'Enviando...' : 'Enviar solicitação'}
                </Button>
              </div>
            </div>
          )}

          <p className="text-[10px] text-[var(--text-3)] text-center">
            ANDERFLOW · Este link expira em 48 horas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
