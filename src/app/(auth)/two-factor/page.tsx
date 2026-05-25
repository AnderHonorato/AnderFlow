'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Loader2, AlertCircle } from 'lucide-react'

function TwoFactorForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId') || ''
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async () => {
    if (!token || token.length < 6) { setError('Digite o código de 6 dígitos'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token }),
      })
      const json = await res.json()
      if (json.valid) {
        const result = await signIn('credentials', {
          bypassAuth: 'true',
          userId,
          bypass2FA: 'true',
          redirect: false,
        })
        if (result?.ok) {
          router.push(callbackUrl)
          router.refresh()
        } else {
          setError('Erro ao completar login')
        }
      } else {
        setError('Código inválido. Tente novamente.')
      }
    } catch { setError('Erro ao verificar') }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--info)]/10">
            <Shield className="h-5 w-5 text-[var(--info)]" />
          </div>
        </div>
        <h1 className="text-[22px] font-[600] text-[var(--text)] tracking-[-0.01em]">Verificação em 2 fatores</h1>
        <p className="text-[13px] text-[var(--text-3)]">Digite o código gerado pelo seu app autenticador</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--destructive-subtle)] border border-[var(--destructive)]/20 px-3 py-2.5 text-[13px] text-[var(--destructive)]">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      <div className="space-y-4">
        <Input
          value={token}
          onChange={e => { setToken(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
          placeholder="000000"
          maxLength={6}
          className="h-12 text-center text-xl tracking-[0.3em] font-mono bg-[var(--surface)]"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleVerify() }}
        />
        <Button onClick={handleVerify} disabled={loading || token.length < 6} className="w-full h-10 font-[500]">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Verificar
        </Button>
      </div>

      <p className="text-center text-[12px] text-[var(--text-3)]">
        Abra seu app autenticador e digite o código de 6 dígitos
      </p>
    </div>
  )
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-3)]" /></div>}>
      <TwoFactorForm />
    </Suspense>
  )
}
