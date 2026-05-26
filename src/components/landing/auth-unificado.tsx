'use client'

import { useState, useEffect, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertCircle, Check, Eye, EyeOff, Mail, X } from 'lucide-react'
import { toast } from 'sonner'

type ModoAuth = 'login' | 'register'

interface PropsPainelAuth {
  aberto: boolean
  modo: ModoAuth
  aoFechar: () => void
  aoMudarModo: (m: ModoAuth) => void
}

export default function PainelAuth({ aberto, modo, aoFechar, aoMudarModo }: PropsPainelAuth) {
  const router = useRouter()

  const [mostrarSenha, setMostrarSenha] = useState(false)

  // ── Login ──
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [lembrarMe, setLembrarMe] = useState(false)
  const [carregandoLogin, setCarregandoLogin] = useState(false)
  const [carregandoGoogle, setCarregandoGoogle] = useState(false)
  const [erroLogin, setErroLogin] = useState('')

  // ── Registro ──
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [telefone, setTelefone] = useState('')
  const [registroPasso, setRegistroPasso] = useState<'form' | 'code'>('form')
  const [codigoRegistro, setCodigoRegistro] = useState('')
  const [countdownRegistro, setCountdownRegistro] = useState(1800)
  const [reenviarCooldownRegistro, setReenviarCooldownRegistro] = useState(0)
  const [carregandoRegistro, setCarregandoRegistro] = useState(false)
  const [erroRegistro, setErroRegistro] = useState('')

  // ── Recuperar senha ──
  const [modoRecuperar, setModoRecuperar] = useState(false)
  const [rsPasso, setRsPasso] = useState<'email' | 'code' | 'done'>('email')
  const [rsEmail, setRsEmail] = useState('')
  const [rsCodigo, setRsCodigo] = useState('')
  const [rsSenha, setRsSenha] = useState('')
  const [rsConfirmarSenha, setRsConfirmarSenha] = useState('')
  const [rsCarregando, setRsCarregando] = useState(false)
  const [rsErro, setRsErro] = useState('')
  const [rsCountdown, setRsCountdown] = useState(1800)
  const [rsReenviarCooldown, setRsReenviarCooldown] = useState(0)

  // ── Pré-cadastro ──
  const [precadastroAberto, setPrecadastroAberto] = useState(false)
  const [pcPasso, setPcPasso] = useState<'email' | 'code' | 'password' | 'done'>('email')
  const [pcEmail, setPcEmail] = useState('')
  const [pcCodigo, setPcCodigo] = useState('')
  const [pcSenha, setPcSenha] = useState('')
  const [pcConfirmarSenha, setPcConfirmarSenha] = useState('')
  const [pcCarregando, setPcCarregando] = useState(false)
  const [pcErro, setPcErro] = useState('')

  // ── Timers ──
  useEffect(() => {
    if (registroPasso === 'code' && countdownRegistro > 0) {
      const t = setInterval(() => setCountdownRegistro(c => c - 1), 1000)
      return () => clearInterval(t)
    }
  }, [registroPasso, countdownRegistro])

  useEffect(() => {
    if (reenviarCooldownRegistro > 0) {
      const t = setInterval(() => setReenviarCooldownRegistro(c => c - 1), 1000)
      return () => clearInterval(t)
    }
  }, [reenviarCooldownRegistro])

  useEffect(() => {
    if (modoRecuperar && rsPasso === 'code' && rsCountdown > 0) {
      const t = setInterval(() => setRsCountdown(c => c - 1), 1000)
      return () => clearInterval(t)
    }
  }, [modoRecuperar, rsPasso, rsCountdown])

  useEffect(() => {
    if (rsReenviarCooldown > 0) {
      const t = setInterval(() => setRsReenviarCooldown(c => c - 1), 1000)
      return () => clearInterval(t)
    }
  }, [rsReenviarCooldown])

  const formatarTempo = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const resetarFormularios = useCallback(() => {
    setErroLogin('')
    setErroRegistro('')
    setEmail('')
    setSenha('')
    setLembrarMe(false)
    setNome('')
    setEmpresa('')
    setTelefone('')
    setRegistroPasso('form')
    setCodigoRegistro('')
    setMostrarSenha(false)
    setModoRecuperar(false)
    setPrecadastroAberto(false)
    setPcPasso('email')
    setPcErro('')
  }, [])

  useEffect(() => {
    resetarFormularios()
  }, [modo, resetarFormularios])

  // ═══════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregandoLogin(true)
    setErroLogin('')
    const result = await signIn('credentials', {
      email,
      password: senha,
      redirect: false,
      rememberMe: lembrarMe ? 'true' : 'false',
    })
    if (result?.error) {
      try {
        const parsed = JSON.parse(result.error)
        if (parsed.code === '2FA_REQUIRED') {
          router.push(`/two-factor?userId=${parsed.userId}&email=${encodeURIComponent(email)}&callbackUrl=/dashboard`)
          setCarregandoLogin(false)
          return
        }
      } catch {}
      setErroLogin(result.error || 'Email ou senha invalidos')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setCarregandoLogin(false)
  }

  const handleGoogleLogin = async () => {
    setCarregandoGoogle(true)
    setErroLogin('')
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch {
      setErroLogin('Erro ao conectar com Google.')
      setCarregandoGoogle(false)
    }
  }

  // ═══════════════════════════════════════════
  // REGISTRO
  // ═══════════════════════════════════════════

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setCarregandoRegistro(true)
    setErroRegistro('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErroRegistro('Formato de email invalido'); setCarregandoRegistro(false); return }
    if (senha.length < 8) { setErroRegistro('A senha deve ter pelo menos 8 caracteres'); setCarregandoRegistro(false); return }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, company: empresa, email, phone: telefone, password: senha }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.codeSent) {
          setRegistroPasso('code')
          setCountdownRegistro(1800)
          setReenviarCooldownRegistro(60)
          toast.success('Codigo enviado!')
        }
      } else { setErroRegistro(data.error || 'Erro ao criar conta') }
    } catch { setErroRegistro('Erro de conexao') }
    setCarregandoRegistro(false)
  }

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (codigoRegistro.length < 6) { setErroRegistro('Codigo invalido'); return }
    setCarregandoRegistro(true)
    setErroRegistro('')
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codigoRegistro, type: 'register' }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Conta verificada!')
        toast.info('Sua conta esta em analise. Em breve entraremos em contato!', { duration: 6000 })
        aoMudarModo('login')
      } else { setErroRegistro(data.error || 'Erro ao verificar') }
    } catch { setErroRegistro('Erro de conexao') }
    setCarregandoRegistro(false)
  }

  const handleReenviarCodigo = async () => {
    if (reenviarCooldownRegistro > 0) return
    setReenviarCooldownRegistro(60)
    setCountdownRegistro(1800)
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'register' }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.cooldown) toast.info(data.message)
        else toast.success('Codigo reenviado!')
      } else { toast.error(data.error || 'Erro') }
    } catch { toast.error('Erro de conexao') }
  }

  // ═══════════════════════════════════════════
  // RECUPERAR SENHA
  // ═══════════════════════════════════════════

  const handleRsEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setRsCarregando(true)
    setRsErro('')
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: rsEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.codeSent) { setRsPasso('code'); setRsCountdown(1800); setRsReenviarCooldown(60); toast.success('Codigo enviado! Verifique seu email.') }
        else { setRsPasso('done'); toast.success(data.message || 'Se o email existir, um codigo sera enviado') }
      } else { setRsErro(data.error || 'Erro ao enviar codigo') }
    } catch { setRsErro('Erro de conexao') }
    setRsCarregando(false)
  }

  const handleRsReenviar = async () => {
    if (rsReenviarCooldown > 0) return
    setRsReenviarCooldown(60)
    setRsCountdown(1800)
    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: rsEmail, type: 'password' }),
      })
      const data = await res.json()
      if (res.ok) { if (data.cooldown) toast.info(data.message); else toast.success('Codigo reenviado!') }
      else { toast.error(data.error || 'Erro ao reenviar') }
    } catch { toast.error('Erro de conexao') }
  }

  const handleRsRedefinir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rsSenha !== rsConfirmarSenha) { setRsErro('Senhas nao conferem'); return }
    if (rsSenha.length < 8) { setRsErro('Senha deve ter pelo menos 8 caracteres'); return }
    setRsCarregando(true)
    setRsErro('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: rsEmail, code: rsCodigo, password: rsSenha }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Senha alterada com sucesso!'); setRsPasso('done') }
      else { setRsErro(data.error || 'Erro ao redefinir senha') }
    } catch { setRsErro('Erro de conexao') }
    setRsCarregando(false)
  }

  // ═══════════════════════════════════════════
  // PRÉ-CADASTRO
  // ═══════════════════════════════════════════

  const handlePcEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setPcCarregando(true)
    setPcErro('')
    try {
      const res = await fetch('/api/auth/pre-register/send-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pcEmail }),
      })
      const json = await res.json()
      if (res.ok) { setPcPasso('code'); toast.success('Codigo enviado! Verifique o email informado.') }
      else { setPcErro(json.error || 'Erro ao enviar codigo') }
    } catch { setPcErro('Erro de conexao') }
    setPcCarregando(false)
  }

  const handlePcVerificar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pcCodigo.length < 4) { setPcErro('Codigo invalido'); return }
    setPcPasso('password')
  }

  const handlePcCompletar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pcSenha !== pcConfirmarSenha) { setPcErro('Senhas nao conferem'); return }
    if (pcSenha.length < 8) { setPcErro('Senha deve ter pelo menos 8 caracteres'); return }
    setPcCarregando(true)
    setPcErro('')
    try {
      const res = await fetch('/api/auth/pre-register/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pcEmail, code: pcCodigo, password: pcSenha }),
      })
      const json = await res.json()
      if (res.ok) { setPcPasso('done') }
      else { setPcErro(json.error || 'Erro ao completar cadastro') }
    } catch { setPcErro('Erro de conexao') }
    setPcCarregando(false)
  }

  if (!aberto) return null

  // ── Estilos compartilhados ──
  const clInput = "w-full h-10 px-3 rounded-lg text-[13px] outline-none transition-colors"
  const stInput = { background: '#1A1A1F', border: '1px solid rgba(255,255,255,0.10)', color: '#F0F0EB' }
  const clBtn = "w-full h-10 rounded-lg text-[13px] font-[500] flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
  const stBtn = { background: '#E8622A', color: '#ffffff', border: 'none' }
  const stBtnGoogle = { background: '#1A1A1F', color: '#F0F0EB', border: '1px solid rgba(255,255,255,0.10)' }
  const clErro = "flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]"
  const stErro = { background: 'rgba(196,74,58,0.08)', color: '#C44A3A' }
  const stLabel = { color: '#A8A8A2' } as React.CSSProperties
  const stText3 = { color: '#5C5C58' } as React.CSSProperties

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={aoFechar} aria-hidden="true" />

      {/* Glass card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-[420px] max-h-[90vh] overflow-y-auto"
          style={{
            background: 'rgba(14, 14, 20, 0.85)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset',
            padding: '32px',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[16px] font-[600] tracking-[-0.01em]" style={{ color: '#F0F0EB' }}>
              {modoRecuperar ? 'Recuperar senha' : modo === 'login' ? 'Fazer login' : 'Criar conta'}
            </span>
            <button onClick={aoFechar} className="bg-transparent border-none cursor-pointer" style={{ color: '#5C5C58' }}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ═══ RECUPERAR SENHA ═══ */}
          {modoRecuperar && (
            <div className="space-y-4">
              {rsPasso === 'done' ? (
                <div className="space-y-4 text-center py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full mx-auto" style={{ background: 'rgba(61,154,110,0.08)' }}>
                    <Check className="h-6 w-6" style={{ color: '#3D9A6E' }} />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-[22px] font-[600] tracking-[-0.01em]" style={{ color: '#F0F0EB' }}>Senha alterada!</h1>
                    <p className="text-[13px]" style={stText3}>Sua senha foi redefinida. Faca login com sua nova senha.</p>
                  </div>
                  <button onClick={() => { setModoRecuperar(false); setRsPasso('email') }} className={clBtn} style={stBtn}>Ir para o login</button>
                </div>
              ) : rsPasso === 'code' ? (
                <>
                  <button onClick={() => setRsPasso('email')} className="inline-flex items-center gap-2 text-[13px] bg-transparent border-none cursor-pointer" style={stText3}>
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                  <p className="text-[13px]" style={stText3}>Enviamos um codigo de 8 digitos para <strong style={{ color: '#A8A8A2' }}>{rsEmail}</strong></p>
                  <form onSubmit={handleRsRedefinir} className="space-y-3">
                    {rsErro && <div className={clErro} style={stErro}><AlertCircle className="h-4 w-4 shrink-0" />{rsErro}</div>}
                    <div>
                      <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Codigo de verificacao</label>
                      <input className={clInput} style={{ ...stInput, textAlign: 'center', fontSize: 18, letterSpacing: '0.3em', fontFamily: 'monospace' }} placeholder="Digite o codigo" value={rsCodigo} onChange={e => setRsCodigo(e.target.value.toUpperCase().slice(0, 8))} maxLength={8} autoFocus autoComplete="one-time-code" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Nova senha</label>
                      <input type="password" className={clInput} style={stInput} placeholder="Minimo 8 caracteres" value={rsSenha} onChange={e => setRsSenha(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Confirmar senha</label>
                      <input type="password" className={clInput} style={stInput} placeholder="Repita a senha" value={rsConfirmarSenha} onChange={e => setRsConfirmarSenha(e.target.value)} required />
                    </div>
                    <button type="submit" className={clBtn} style={stBtn} disabled={rsCarregando || rsCodigo.length < 8}>
                      {rsCarregando && <Loader2 className="h-4 w-4 animate-spin" />} Redefinir senha
                    </button>
                  </form>
                  <div className="text-center space-y-2">
                    <p className="text-[11px]" style={stText3}>Codigo expira em {formatarTempo(rsCountdown)}</p>
                    <button onClick={handleRsReenviar} disabled={rsReenviarCooldown > 0} className="text-[11px] bg-transparent border-none cursor-pointer" style={{ color: rsReenviarCooldown > 0 ? '#5C5C58' : '#E8622A' }}>
                      {rsReenviarCooldown > 0 ? `Reenviar em ${rsReenviarCooldown}s` : 'Reenviar codigo'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => setModoRecuperar(false)} className="inline-flex items-center gap-2 text-[13px] bg-transparent border-none cursor-pointer" style={stText3}>
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                  <form onSubmit={handleRsEnviar} className="space-y-3">
                    {rsErro && <div className={clErro} style={stErro}><AlertCircle className="h-4 w-4 shrink-0" />{rsErro}</div>}
                    <div>
                      <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Email</label>
                      <input type="email" className={clInput} style={stInput} placeholder="seu@email.com" value={rsEmail} onChange={e => setRsEmail(e.target.value)} required autoFocus />
                    </div>
                    <button type="submit" className={clBtn} style={stBtn} disabled={rsCarregando}>{rsCarregando && <Loader2 className="h-4 w-4 animate-spin" />} Enviar codigo de verificacao</button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* ═══ LOGIN ═══ */}
          {!modoRecuperar && modo === 'login' && (
            <div>
              <button type="button" className={clBtn} style={{ ...stBtnGoogle, marginBottom: '1rem' }} onClick={handleGoogleLogin} disabled={carregandoGoogle}>
                {carregandoGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )} Continuar com Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-[11px]" style={stText3}>ou</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                {erroLogin && <div className={clErro} style={stErro}><AlertCircle className="h-4 w-4 shrink-0" />{erroLogin}</div>}
                <div>
                  <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Email</label>
                  <input type="email" className={clInput} style={stInput} placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[12px] font-[500]" style={stLabel}>Senha</label>
                    <button type="button" onClick={() => setModoRecuperar(true)} className="text-[12px] bg-transparent border-none cursor-pointer" style={{ color: '#E8622A' }}>Esqueceu a senha?</button>
                  </div>
                  <div className="relative">
                    <input type={mostrarSenha ? 'text' : 'password'} className={clInput} style={stInput} placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)} required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer" style={stText3} onClick={() => setMostrarSenha(!mostrarSenha)}>
                      {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setLembrarMe(!lembrarMe)}>
                  <div className="flex items-center justify-center w-4 h-4 rounded transition-colors" style={{ background: lembrarMe ? '#E8622A' : 'transparent', border: lembrarMe ? '1px solid #E8622A' : '1px solid rgba(255,255,255,0.10)' }}>
                    {lembrarMe && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-[12px]" style={stLabel}>Permanecer conectado por 30 dias</span>
                </div>
                <button type="submit" className={clBtn} style={stBtn} disabled={carregandoLogin}>{carregandoLogin && <Loader2 className="h-4 w-4 animate-spin" />} Entrar</button>
              </form>

              <div className="text-center space-y-2 mt-3">
                <p className="text-[12px]" style={stText3}>Nao tem uma conta?{' '}<button type="button" onClick={() => aoMudarModo('register')} className="bg-transparent border-none cursor-pointer" style={{ color: '#E8622A' }}>Criar conta</button></p>
                <button type="button" onClick={() => setPrecadastroAberto(v => !v)} className="w-full text-center text-[12px] py-2 bg-transparent border-0 cursor-pointer" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: precadastroAberto ? '#E8622A' : '#5C5C58' }}>
                  Ja fez pre-cadastro pelo WhatsApp? Ativar conta
                </button>
              </div>

              {/* Pré-cadastro inline */}
              {precadastroAberto && (
                <div className="mt-3 p-4 rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#1A1A1F' }}>
                  {pcErro && <div className={clErro} style={{ ...stErro, marginBottom: '0.75rem' }}><AlertCircle className="h-4 w-4 shrink-0" />{pcErro}</div>}
                  {pcPasso === 'email' && (
                    <form onSubmit={handlePcEnviar} className="space-y-3">
                      <div className="p-3 rounded-lg" style={{ background: 'rgba(232,98,42,0.08)', borderLeft: '3px solid #E8622A' }}>
                        <p className="text-[11px]" style={stLabel}>Se voce fez o pre-cadastro pelo WhatsApp com a IA Metrys, informe o mesmo email usado na conversa.</p>
                      </div>
                      <div>
                        <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Email usado no WhatsApp</label>
                        <input type="email" className={clInput} style={stInput} placeholder="seu@email.com" value={pcEmail} onChange={e => setPcEmail(e.target.value)} required />
                      </div>
                      <button type="submit" className={clBtn} style={stBtn} disabled={pcCarregando}>{pcCarregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Enviar codigo</button>
                    </form>
                  )}
                  {pcPasso === 'code' && (
                    <form onSubmit={handlePcVerificar} className="space-y-3">
                      <p className="text-[12px]" style={stText3}>Enviamos um codigo de 6 digitos para <strong style={{ color: '#A8A8A2' }}>{pcEmail}</strong></p>
                      <div>
                        <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Codigo de verificacao</label>
                        <input className={clInput} style={{ ...stInput, textAlign: 'center', fontSize: 18, letterSpacing: '0.3em', fontFamily: 'monospace' }} placeholder="000000" value={pcCodigo} onChange={e => setPcCodigo(e.target.value.toUpperCase().slice(0, 6))} required maxLength={6} />
                      </div>
                      <button type="submit" className={clBtn} style={stBtn} disabled={pcCodigo.length < 4}>Verificar codigo</button>
                    </form>
                  )}
                  {pcPasso === 'password' && (
                    <form onSubmit={handlePcCompletar} className="space-y-3">
                      <p className="text-[12px]" style={stText3}>Crie sua senha para acessar o portal</p>
                      <div>
                        <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Nova senha</label>
                        <input type="password" className={clInput} style={stInput} placeholder="Minimo 8 caracteres" value={pcSenha} onChange={e => setPcSenha(e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Confirmar senha</label>
                        <input type="password" className={clInput} style={stInput} placeholder="Repita a senha" value={pcConfirmarSenha} onChange={e => setPcConfirmarSenha(e.target.value)} required />
                      </div>
                      {pcSenha.length > 0 && pcSenha.length < 8 && <p className="text-[11px]" style={{ color: '#C44A3A' }}>Minimo 8 caracteres ({pcSenha.length}/8)</p>}
                      <button type="submit" className={clBtn} style={stBtn} disabled={pcCarregando}>{pcCarregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Completar cadastro</button>
                    </form>
                  )}
                  {pcPasso === 'done' && (
                    <div className="space-y-3 text-center py-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full mx-auto" style={{ background: 'rgba(61,154,110,0.08)' }}>
                        <Check className="h-6 w-6" style={{ color: '#3D9A6E' }} />
                      </div>
                      <div><h2 className="text-[15px] font-[500]" style={{ color: '#F0F0EB' }}>Cadastro completo!</h2>
                      <p className="text-[11px] mt-1" style={stText3}>Sua senha foi definida. Agora voce pode fazer login.</p></div>
                      <button onClick={() => { setPrecadastroAberto(false); setPcPasso('email'); setPcErro('') }} className={clBtn} style={stBtn}>Ir para o login</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ REGISTRO ═══ */}
          {!modoRecuperar && modo === 'register' && registroPasso === 'code' && (
            <div>
              <button type="button" className="inline-flex items-center gap-2 text-[13px] bg-transparent border-none cursor-pointer mb-4" style={stText3} onClick={() => setRegistroPasso('form')}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <h2 className="text-[20px] font-[600] tracking-[-0.01em] mb-2" style={{ color: '#F0F0EB' }}>Verificar email</h2>
              <p className="text-[12px] mb-4" style={stText3}>Enviamos um codigo para <strong style={{ color: '#A8A8A2' }}>{email}</strong></p>
              <form onSubmit={handleVerificarCodigo} className="space-y-3">
                {erroRegistro && <div className={clErro} style={stErro}><AlertCircle className="h-4 w-4 shrink-0" />{erroRegistro}</div>}
                <div>
                  <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Codigo</label>
                  <input className={clInput} style={{ ...stInput, textAlign: 'center', fontSize: 18, letterSpacing: '0.3em', fontFamily: 'monospace' }} placeholder="Digite o codigo" value={codigoRegistro} onChange={e => setCodigoRegistro(e.target.value.toUpperCase().slice(0, 8))} maxLength={8} autoFocus autoComplete="one-time-code" />
                </div>
                <button type="submit" className={clBtn} style={stBtn} disabled={carregandoRegistro || codigoRegistro.length < 8}>{carregandoRegistro && <Loader2 className="h-4 w-4 animate-spin" />} Verificar conta</button>
                <div className="text-center">
                  <p className="text-[11px]" style={stText3}>Codigo expira em {formatarTempo(countdownRegistro)}</p>
                  <button type="button" onClick={handleReenviarCodigo} disabled={reenviarCooldownRegistro > 0} className="text-[11px] bg-transparent border-none cursor-pointer" style={{ color: reenviarCooldownRegistro > 0 ? '#5C5C58' : '#E8622A', opacity: reenviarCooldownRegistro > 0 ? 0.5 : 1 }}>
                    {reenviarCooldownRegistro > 0 ? `Reenviar em ${reenviarCooldownRegistro}s` : 'Reenviar codigo'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {!modoRecuperar && modo === 'register' && registroPasso === 'form' && (
            <div>
              <button type="button" className={clBtn} style={{ ...stBtnGoogle, marginBottom: '1rem' }} onClick={handleGoogleLogin} disabled={carregandoGoogle}>
                {carregandoGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )} Continuar com Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-[11px]" style={stText3}>ou</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <form onSubmit={handleRegistro} className="space-y-3">
                {erroRegistro && <div className={clErro} style={stErro}><AlertCircle className="h-4 w-4 shrink-0" />{erroRegistro}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Nome</label>
                    <input className={clInput} style={stInput} placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Empresa</label>
                    <input className={clInput} style={stInput} placeholder="Sua empresa" value={empresa} onChange={e => setEmpresa(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Email</label>
                  <input type="email" className={clInput} style={stInput} placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Telefone</label>
                  <input type="tel" className={clInput} style={stInput} placeholder="(00) 00000-0000" value={telefone} onChange={e => setTelefone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Senha</label>
                  <div className="relative">
                    <input type={mostrarSenha ? 'text' : 'password'} className={clInput} style={stInput} placeholder="Minimo 8 caracteres" value={senha} onChange={e => setSenha(e.target.value)} required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer" style={stText3} onClick={() => setMostrarSenha(!mostrarSenha)}>
                      {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" className={clBtn} style={stBtn} disabled={carregandoRegistro}>{carregandoRegistro && <Loader2 className="h-4 w-4 animate-spin" />} Criar conta</button>
              </form>
              <div className="text-center space-y-2 mt-3">
                <p className="text-[12px]" style={stText3}>Ja tem uma conta?{' '}<button type="button" onClick={() => aoMudarModo('login')} className="bg-transparent border-none cursor-pointer" style={{ color: '#E8622A' }}>Entrar</button></p>
                <button type="button" onClick={() => setPrecadastroAberto(v => !v)} className="w-full text-center text-[12px] py-2 bg-transparent border-0 cursor-pointer" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: precadastroAberto ? '#E8622A' : '#5C5C58' }}>
                  Ja fez pre-cadastro pelo WhatsApp? Ativar conta
                </button>
                {/* Pré-cadastro inline no registro */}
                {precadastroAberto && (
                  <div className="mt-3 p-4 rounded-xl text-left" style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#1A1A1F' }}>
                    {pcErro && <div className={clErro} style={{ ...stErro, marginBottom: '0.75rem' }}><AlertCircle className="h-4 w-4 shrink-0" />{pcErro}</div>}
                    {pcPasso === 'email' && (
                      <form onSubmit={handlePcEnviar} className="space-y-3">
                        <div className="p-3 rounded-lg" style={{ background: 'rgba(232,98,42,0.08)', borderLeft: '3px solid #E8622A' }}>
                          <p className="text-[11px]" style={stLabel}>Informe o mesmo email usado no WhatsApp.</p>
                        </div>
                        <div><label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Email</label><input type="email" className={clInput} style={stInput} placeholder="seu@email.com" value={pcEmail} onChange={e => setPcEmail(e.target.value)} required /></div>
                        <button type="submit" className={clBtn} style={stBtn} disabled={pcCarregando}>{pcCarregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Enviar codigo</button>
                      </form>
                    )}
                    {pcPasso === 'code' && (
                      <form onSubmit={handlePcVerificar} className="space-y-3">
                        <p className="text-[12px]" style={stText3}>Codigo enviado para <strong style={{ color: '#A8A8A2' }}>{pcEmail}</strong></p>
                        <div><label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Codigo</label><input className={clInput} style={{ ...stInput, textAlign: 'center', fontSize: 18, letterSpacing: '0.3em', fontFamily: 'monospace' }} placeholder="000000" value={pcCodigo} onChange={e => setPcCodigo(e.target.value.toUpperCase().slice(0, 6))} required maxLength={6} /></div>
                        <button type="submit" className={clBtn} style={stBtn} disabled={pcCodigo.length < 4}>Verificar codigo</button>
                      </form>
                    )}
                    {pcPasso === 'password' && (
                      <form onSubmit={handlePcCompletar} className="space-y-3">
                        <p className="text-[12px]" style={stText3}>Crie sua senha</p>
                        <div><label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Nova senha</label><input type="password" className={clInput} style={stInput} placeholder="Minimo 8 caracteres" value={pcSenha} onChange={e => setPcSenha(e.target.value)} required /></div>
                        <div><label className="block text-[12px] font-[500] mb-1.5" style={stLabel}>Confirmar senha</label><input type="password" className={clInput} style={stInput} placeholder="Repita" value={pcConfirmarSenha} onChange={e => setPcConfirmarSenha(e.target.value)} required /></div>
                        {pcSenha.length > 0 && pcSenha.length < 8 && <p className="text-[11px]" style={{ color: '#C44A3A' }}>Minimo 8 caracteres ({pcSenha.length}/8)</p>}
                        <button type="submit" className={clBtn} style={stBtn} disabled={pcCarregando}>{pcCarregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Completar cadastro</button>
                      </form>
                    )}
                    {pcPasso === 'done' && (
                      <div className="space-y-3 text-center py-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full mx-auto" style={{ background: 'rgba(61,154,110,0.08)' }}><Check className="h-6 w-6" style={{ color: '#3D9A6E' }} /></div>
                        <div><h2 className="text-[15px] font-[500]" style={{ color: '#F0F0EB' }}>Cadastro completo!</h2></div>
                        <button onClick={() => { setPrecadastroAberto(false); setPcPasso('email'); setPcErro('') }} className={clBtn} style={stBtn}>Ir para o login</button>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[11px]" style={stText3}>Ao criar uma conta, voce concorda com os{' '}<a href="/termos" style={{ color: '#E8622A' }}>Termos de Uso</a> e{' '}<a href="/termos" style={{ color: '#E8622A' }}>Politica de Privacidade</a></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
