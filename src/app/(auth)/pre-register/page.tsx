'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, AlertCircle, Check, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function PreRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/pre-register/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (res.ok) {
        setStep('code')
        toast.success('Código enviado! Verifique o email informado.')
      } else {
        setError(json.error || 'Erro ao enviar código')
      }
    } catch {
      setError('Erro de conexão')
    }
    setLoading(false)
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 4) { setError('Código inválido'); return }
    setStep('password')
  }

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) { setError('Senhas não conferem'); return }
    if (password.length < 8) { setError('Senha deve ter pelo menos 8 caracteres'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/pre-register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      })
      const json = await res.json()
      if (res.ok) {
        setStep('done')
      } else {
        setError(json.error || 'Erro ao completar cadastro')
      }
    } catch {
      setError('Erro de conexão')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <button onClick={() => router.push('/login')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <CardTitle className="text-xl">
            {step === 'email' && 'Pré-cadastro WhatsApp'}
            {step === 'code' && 'Verificar código'}
            {step === 'password' && 'Criar senha'}
            {step === 'done' && 'Pronto!'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="p-3 rounded-lg bg-[var(--accent-subtle)] border-l-[3px] border-[var(--accent)]">
                <p className="text-xs text-[var(--text-2)]">
                  Se você fez o pré-cadastro pelo WhatsApp com a IA Metrys, informe o mesmo email usado na conversa para receber o código de verificação.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email usado no WhatsApp</label>
                <Input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Enviar código de verificação
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-sm text-muted-foreground">Enviamos um código de 6 dígitos para <strong>{email}</strong></p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Código de verificação</label>
                <Input placeholder="000000" value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))} required className="h-11 text-center text-lg tracking-[0.3em] font-mono" maxLength={6} />
              </div>
              <Button type="submit" className="w-full h-11" disabled={code.length < 4}>
                Verificar código
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleComplete} className="space-y-4">
              <p className="text-sm text-muted-foreground">Crie sua senha para acessar o portal</p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nova senha</label>
                <Input type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmar senha</label>
                <Input type="password" placeholder="Repita a senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-11" />
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-xs text-destructive">Mínimo 8 caracteres ({password.length}/8)</p>
              )}
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Completar cadastro
              </Button>
            </form>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-subtle)] mx-auto">
                <Check className="h-6 w-6 text-[var(--success)]" />
              </div>
              <div>
                <h2 className="text-base font-medium">Cadastro completo!</h2>
                <p className="text-xs text-muted-foreground mt-1">Sua senha foi definida. Agora você pode fazer login.</p>
              </div>
              <Button className="w-full" onClick={() => router.push('/login')}>
                Ir para o login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
