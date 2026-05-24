'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(1800)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => { if (step === 'code' && countdown > 0) { const t = setInterval(() => setCountdown(c => c - 1), 1000); return () => clearInterval(t) } }, [step, countdown])
  useEffect(() => { if (resendCooldown > 0) { const t = setInterval(() => setResendCooldown(c => c - 1), 1000); return () => clearInterval(t) } }, [resendCooldown])

  const formatTime = (sec: number) => { const m = Math.floor(sec / 60); const s = sec % 60; return `${m}:${s.toString().padStart(2, '0')}` }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true); setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Formato de email invalido'); setIsLoading(false); return }
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres'); setIsLoading(false); return }
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, company, email, phone, password }) })
      const data = await res.json()
      if (res.ok) { if (data.codeSent) { setStep('code'); setCountdown(1800); setResendCooldown(60); toast.success('Codigo enviado!') } }
      else { setError(data.error || 'Erro ao criar conta') }
    } catch { setError('Erro de conexao') }
    setIsLoading(false)
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault(); if (code.length < 6) { setError('Codigo invalido'); return }; setIsLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/verify-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, type: 'register' }) })
      const data = await res.json()
      if (res.ok) { toast.success('Conta verificada!'); toast.info('Sua conta esta em analise. Em breve entraremos em contato!', { duration: 6000 }); router.push('/login') }
      else { setError(data.error || 'Erro ao verificar') }
    } catch { setError('Erro de conexao') }
    setIsLoading(false)
  }

  const handleResendCode = async () => { if (resendCooldown > 0) return; setResendCooldown(60); setCountdown(1800); try { const res = await fetch('/api/auth/resend-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, type: 'register' }) }); const data = await res.json(); if (res.ok) { if (data.cooldown) toast.info(data.message); else toast.success('Codigo reenviado!') } else toast.error(data.error || 'Erro') } catch { toast.error('Erro de conexao') } }

  const handleGoogleLogin = async () => { setGoogleLoading(true); try { await signIn('google', { callbackUrl: '/dashboard' }) } catch { setError('Erro ao conectar com Google.'); setGoogleLoading(false) } }

  if (step === 'code') {
    return (
      <div className="space-y-5">
        <button onClick={() => setStep('form')} className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-3)] hover:text-[var(--text)]"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</button>
        <div className="space-y-1"><h1 className="text-[22px] font-[600] text-[var(--text)] tracking-[-0.01em]">Verificar email</h1><p className="text-[13px] text-[var(--text-3)]">Enviamos um codigo para <strong className="text-[var(--text-2)]">{email}</strong></p></div>
        <form onSubmit={handleVerifyCode} className="space-y-4">
          {error && <div className="flex items-center gap-2 rounded-lg bg-[var(--destructive-subtle)] border border-[var(--destructive)]/20 px-3 py-2.5 text-[13px] text-[var(--destructive)]"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          <div className="space-y-1.5"><label className="text-[13px] font-[500] text-[var(--text-2)]" htmlFor="code">Codigo</label><Input id="code" placeholder="Digite o codigo" value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0, 8))} className="h-10 text-center text-lg tracking-[0.3em] font-mono uppercase bg-[var(--surface)] border-[var(--border)] text-[var(--text)]" maxLength={8} autoFocus autoComplete="one-time-code" /></div>
          <Button type="submit" className="w-full h-10 font-[500]" disabled={isLoading || code.length < 8}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Verificar conta</Button>
        </form>
        <div className="text-center space-y-2"><p className="text-[12px] text-[var(--text-3)]">Codigo expira em {formatTime(countdown)}</p><button onClick={handleResendCode} disabled={resendCooldown > 0} className="text-[12px] text-[var(--accent)] hover:underline disabled:text-[var(--text-3)] disabled:no-underline">{resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar codigo'}</button></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1"><h1 className="text-[22px] font-[600] text-[var(--text)] tracking-[-0.01em]">Criar conta</h1><p className="text-[13px] text-[var(--text-3)]">Crie sua conta para comecar</p></div>

      <Button variant="outline" className="w-full h-10 gap-2.5 bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text)]" type="button" onClick={handleGoogleLogin} disabled={googleLoading}>
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
        Continuar com Google
      </Button>

      <div className="relative"><div className="absolute inset-0 flex items-center"><Separator className="bg-[var(--border)]" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-[var(--bg)] px-2 text-[var(--text-3)]">ou</span></div></div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {error && <div className="flex items-center gap-2 rounded-lg bg-[var(--destructive-subtle)] border border-[var(--destructive)]/20 px-3 py-2.5 text-[13px] text-[var(--destructive)]"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><label className="text-[13px] font-[500] text-[var(--text-2)]" htmlFor="name">Nome</label><Input id="name" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required className="h-9 bg-[var(--surface)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-3)]" /></div>
          <div className="space-y-1"><label className="text-[13px] font-[500] text-[var(--text-2)]" htmlFor="company">Empresa</label><Input id="company" placeholder="Sua empresa" value={company} onChange={e => setCompany(e.target.value)} className="h-9 bg-[var(--surface)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-3)]" /></div>
        </div>
        <div className="space-y-1"><label className="text-[13px] font-[500] text-[var(--text-2)]" htmlFor="email">Email</label><Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-9 bg-[var(--surface)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-3)]" /></div>
        <div className="space-y-1"><label className="text-[13px] font-[500] text-[var(--text-2)]" htmlFor="phone">Telefone</label><Input id="phone" type="tel" placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} className="h-9 bg-[var(--surface)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-3)]" /></div>
        <div className="space-y-1">
          <label className="text-[13px] font-[500] text-[var(--text-2)]" htmlFor="password">Senha</label>
          <div className="flex">
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Minimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} required className="h-9 rounded-r-none flex-1 bg-[var(--surface)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-3)]" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center justify-center w-9 h-9 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--surface)] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors shrink-0">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full h-10 font-[500]" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar conta</Button>
      </form>

      <div className="space-y-1.5">
        <p className="text-center text-[13px] text-[var(--text-3)]">Ja tem uma conta?{' '}<Link href="/login" className="text-[var(--accent)] hover:underline font-[500]">Entrar</Link></p>
        <p className="text-center"><Link href="/pre-register" className="text-[12px] text-[var(--accent)] hover:underline">Ja fez pre-cadastro pelo WhatsApp? Clique aqui</Link></p>
      </div>
      <p className="text-[11px] text-[var(--text-3)] text-center">Ao criar uma conta, voce concorda com os{' '}<Link href="/termos" className="text-[var(--accent)] hover:underline">Termos de Uso</Link> e{' '}<Link href="/termos" className="text-[var(--accent)] hover:underline">Politica de Privacidade</Link></p>
    </div>
  )
}
