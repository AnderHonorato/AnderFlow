'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(1800)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [codeSent, setCodeSent] = useState(false)

  useEffect(() => {
    if (step === 'code' && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [step, countdown])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown(c => c - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [resendCooldown])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok) {
        if (data.codeSent) {
          setStep('code')
          setCountdown(1800)
          setResendCooldown(60)
          setCodeSent(true)
          toast.success('Codigo enviado! Verifique seu email.')
        } else {
          setStep('done')
          toast.success(data.message || 'Se o email existir, um codigo sera enviado')
        }
      } else {
        setError(data.error || 'Erro ao enviar codigo')
      }
    } catch {
      setError('Erro de conexao')
    }
    setIsLoading(false)
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0) return
    setResendCooldown(60)
    setCountdown(1800)

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'password' }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.cooldown) {
          toast.info(data.message)
        } else {
          toast.success('Codigo reenviado!')
        }
      } else {
        toast.error(data.error || 'Erro ao reenviar')
      }
    } catch {
      toast.error('Erro de conexao')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Senhas nao conferem')
      return
    }
    if (password.length < 8) {
      setError('Senha deve ter pelo menos 8 caracteres')
      return
    }
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Senha alterada com sucesso!')
        setStep('done')
      } else {
        setError(data.error || 'Erro ao redefinir senha')
      }
    } catch {
      setError('Erro de conexao')
    }
    setIsLoading(false)
  }

  if (step === 'done') {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-success" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Senha alterada!</h1>
          <p className="text-sm text-muted-foreground">
            Sua senha foi redefinida com sucesso. Faca login com sua nova senha.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </div>
    )
  }

  if (step === 'code') {
    return (
      <div className="space-y-6">
        <button onClick={() => setStep('email')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground">
            Enviamos um codigo de 8 digitos para <strong>{email}</strong>
          </p>
        </div>
        <form onSubmit={handleResetPassword} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="code">Codigo de verificacao</label>
            <Input
              id="code"
              placeholder="Digite o codigo"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 8))}
              className="h-11 text-center text-lg tracking-[0.3em] font-mono uppercase"
              maxLength={8}
              autoFocus
              autoComplete="one-time-code"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="newPassword">Nova senha</label>
            <Input id="newPassword" type="password" placeholder="Minimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} required className="h-11" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirmPassword">Confirmar senha</label>
            <Input id="confirmPassword" type="password" placeholder="Repita a senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-11" />
          </div>
          <Button type="submit" className="w-full h-11" disabled={isLoading || code.length < 8}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Redefinir senha
          </Button>
        </form>
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Codigo expira em {formatTime(countdown)}
          </p>
          <button
            onClick={handleResendCode}
            disabled={resendCooldown > 0}
            className="text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar codigo'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground">
          Informe seu email e enviaremos um codigo para redefinir sua senha.
        </p>
      </div>
      <form onSubmit={handleSendCode} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11" autoFocus />
        </div>
        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar codigo de verificacao
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">Voltar para login</Link>
      </p>
    </div>
  )
}
