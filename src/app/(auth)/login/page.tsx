'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Loader2, AlertCircle, Check } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false, rememberMe: rememberMe ? 'true' : 'false' })
    if (result?.error) { setError(result.error || 'Email ou senha invalidos'); setIsLoading(false) }
    else { router.push(callbackUrl); router.refresh() }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    try { await signIn('google', { callbackUrl }) } catch { setError('Erro ao conectar com Google.'); setGoogleLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-[22px] font-[600] text-[var(--text)] tracking-[-0.01em]">Entrar</h1>
        <p className="text-[13px] text-[var(--text-3)]">Acesse sua conta para continuar</p>
      </div>

      <Button variant="outline" className="w-full h-10 gap-2.5 bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text)]" type="button" onClick={handleGoogleLogin} disabled={googleLoading}>
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
        Continuar com Google
      </Button>

      <div className="relative"><div className="absolute inset-0 flex items-center"><Separator className="bg-[var(--border)]" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-[var(--bg)] px-2 text-[var(--text-3)]">ou</span></div></div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="flex items-center gap-2 rounded-lg bg-[var(--destructive-subtle)] border border-[var(--destructive)]/20 px-3 py-2.5 text-[13px] text-[var(--destructive)]"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        <div className="space-y-1.5">
          <label className="text-[13px] font-[500] text-[var(--text-2)]" htmlFor="email">Email</label>
          <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 bg-[var(--surface)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-3)]" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-[500] text-[var(--text-2)]" htmlFor="password">Senha</label>
            <Link href="/forgot-password" className="text-[12px] text-[var(--accent)] hover:underline">Esqueceu a senha?</Link>
          </div>
          <div className="flex">
            <Input key={showPassword ? 'text' : 'password'} id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10 rounded-r-none flex-1 bg-[var(--surface)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-3)]" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center justify-center w-10 h-10 rounded-r-lg border border-l-0 border-[var(--border)] bg-[var(--surface)] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors shrink-0">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 py-1">
          <button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center justify-center shrink-0">
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-150 ${rememberMe ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--text-3)]'}`}>
              {rememberMe && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </div>
          </button>
          <span className="text-[13px] text-[var(--text-3)] cursor-pointer select-none">
            Permanecer conectado por 30 dias
          </span>
        </div>

        <Button type="submit" className="w-full h-10 font-[500]" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Entrar
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-center text-[13px] text-[var(--text-3)]">Nao tem uma conta?{' '}<Link href="/register" className="text-[var(--accent)] hover:underline font-[500]">Criar conta</Link></p>
        <p className="text-center"><Link href="/pre-register" className="text-[12px] text-[var(--accent)] hover:underline">Ja fez pre-cadastro pelo WhatsApp? Clique aqui</Link></p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-3)]" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
