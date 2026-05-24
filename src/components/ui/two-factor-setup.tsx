'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react'

export function TwoFactorSetup() {
  const [step, setStep] = useState<'idle' | 'qrcode' | 'verify'>('idle')
  const [secret, setSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [disabling, setDisabling] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/2fa/setup')
      const json = await res.json()
      setEnabled(json.data?.enabled || false)
    } catch {}
  }

  const startSetup = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/2fa/setup')
      const json = await res.json()
      if (json.data) {
        setSecret(json.data.secret)
        setQrCode(json.data.qrCodeUrl)
        setStep('qrcode')
      }
    } catch { toast.error('Erro ao gerar QR code') }
    setLoading(false)
  }

  const verifyToken = async () => {
    if (!token || token.length < 6) { toast.error('Digite o código de 6 dígitos'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, secret }),
      })
      if (res.ok) {
        toast.success('2FA ativado com sucesso!')
        setEnabled(true)
        setStep('idle')
        setToken('')
      } else {
        const json = await res.json()
        toast.error(json.error || 'Código inválido')
      }
    } catch { toast.error('Erro ao verificar') }
    setLoading(false)
  }

  const disable2FA = async () => {
    setDisabling(true)
    try {
      const res = await fetch('/api/2fa/setup', { method: 'DELETE' })
      if (res.ok) {
        toast.success('2FA desativado')
        setEnabled(false)
        setStep('idle')
      }
    } catch { toast.error('Erro ao desativar') }
    setDisabling(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {enabled ? <ShieldCheck className="h-5 w-5 text-[var(--success)]" /> : <ShieldOff className="h-5 w-5 text-[var(--text-3)]" />}
          <div>
            <p className="text-[13px] font-[500] text-[var(--text)]">Autenticação de dois fatores</p>
            <p className="text-[11px] text-[var(--text-3)]">
              {enabled ? 'Proteção extra ativa' : 'Adicione uma camada extra de segurança'}
            </p>
          </div>
        </div>
        {enabled ? (
          <Button variant="outline" size="sm" onClick={disable2FA} disabled={disabling}>
            {disabling ? 'Desativando...' : 'Desativar 2FA'}
          </Button>
        ) : (
          <Button size="sm" onClick={startSetup} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Configurar 2FA
          </Button>
        )}
      </div>

      {step === 'qrcode' && (
        <div className="space-y-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-fade-up">
          <div>
            <p className="text-[12px] font-[500] text-[var(--text)] mb-2">1. Escaneie o QR Code</p>
            <p className="text-[11px] text-[var(--text-3)] mb-3">Use Google Authenticator, Authy ou qualquer app TOTP</p>
            <div className="flex justify-center">
              <Image src={qrCode} alt="QR Code 2FA" width={160} height={160} className="rounded-xl border border-[var(--border)]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[12px] font-[500] text-[var(--text)]">2. Digite o código gerado</p>
            <div className="flex gap-2">
              <Input
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="h-10 text-center text-lg tracking-[0.3em] font-mono"
                autoFocus
              />
              <Button onClick={verifyToken} disabled={loading || token.length < 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar'}
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-3)]">
            Chave manual (backup): <code className="bg-[var(--surface-2)] px-1.5 py-0.5 rounded text-[10px] font-mono break-all">{secret}</code>
          </p>
        </div>
      )}
    </div>
  )
}
