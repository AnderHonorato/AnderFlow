'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Formato de email invalido')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email, phone, password }),
      })
      const data = await res.json()

      if (res.ok) {
        if (data.codeSent) {
          setStep('code')
          setCountdown(1800)
          setResendCooldown(60)
          setCodeSent(true)
          toast.success('Codigo enviado para seu email!')
        }
      } else {
        setError(data.error || 'Erro ao criar conta')
      }
    } catch {
      setError('Erro de conexao')
    }
    setIsLoading(false)
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length < 6) { setError('Codigo invalido'); return }
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type: 'register' }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success('Conta verificada!')
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })
        if (result?.error) {
          router.push('/login')
        } else {
          router.push('/dashboard')
          router.refresh()
        }
      } else {
        setError(data.error || 'Erro ao verificar codigo')
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
        body: JSON.stringify({ email, type: 'register' }),
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

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  if (step === 'code') {
    return (
      <div className="space-y-6">
        <button onClick={() => setStep('form')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Verificar email</h1>
          <p className="text-sm text-muted-foreground">
            Enviamos um codigo de 8 digitos para <strong>{email}</strong>
          </p>
        </div>
        <form onSubmit={handleVerifyCode} className="space-y-4">
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
          <Button type="submit" className="w-full h-11" disabled={isLoading || code.length < 8}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar conta
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
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Crie sua conta para comecar a usar a plataforma
        </p>
      </div>

      <div className="space-y-3">
        <Button variant="outline" className="w-full h-11" type="button" onClick={handleGoogleLogin}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar com Google
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><Separator /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">ou</span></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        <div className="grid gap-4 grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">Nome</label>
            <Input id="name" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required className="h-11" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="company">Empresa</label>
            <Input id="company" placeholder="Sua empresa" value={company} onChange={e => setCompany(e.target.value)} className="h-11" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="phone">Telefone</label>
          <Input id="phone" type="tel" placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">Senha</label>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Minimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar conta
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-center text-sm text-muted-foreground">
          Ja tem uma conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">Entrar</Link>
        </p>
        <p className="text-center text-sm">
          <Link href="/pre-register" className="text-xs text-[var(--accent)] hover:underline">
            Ja fez pre-cadastro pelo WhatsApp? Clique aqui
          </Link>
        </p>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Ao criar uma conta, voce concorda com os{' '}
        <Link href="/termos" className="text-primary hover:underline">Termos de Uso</Link>{' '}
        e{' '}<Link href="/termos" className="text-primary hover:underline">Politica de Privacidade</Link>
      </p>
    </div>
  )
}
