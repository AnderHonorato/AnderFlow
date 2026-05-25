'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  ArrowLeft, QrCode, Smartphone, Copy, Loader2,
  Send, Power, PowerOff, Link2, RefreshCw, Bot, MessageSquare,
  ShieldCheck, AlertCircle, TestTube,
} from 'lucide-react'

export default function IntegrationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const msgPollRef = useRef<NodeJS.Timeout | null>(null)

  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>('disconnected')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [method, setMethod] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [connectMethod, setConnectMethod] = useState<'qr' | 'code'>('qr')
  const [aiMode, setAiMode] = useState(false)
  const [togglingAi, setTogglingAi] = useState(false)
  const [recentChats, setRecentChats] = useState<any[]>([])

  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [sendingTest, setSendingTest] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status')
      const json = await res.json()
      const data = json.data || {}
      setStatus(data.status || 'disconnected')
      setQrCode(data.qr || null)
      setPairingCode(data.pairingCode || null)
      setMethod(data.method || null)
      setError(data.error || null)
      setAiMode(data.aiMode || false)
    } catch {}
    setLoading(false)
  }, [])

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/chats')
      const json = await res.json()
      setRecentChats((json.data || []).slice(0, 10))
    } catch {}
  }, [])

  useEffect(() => {
    fetchStatus()
    pollingRef.current = setInterval(fetchStatus, 3000)
    msgPollRef.current = setInterval(fetchChats, 5000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (msgPollRef.current) clearInterval(msgPollRef.current)
    }
  }, [fetchStatus, fetchChats])

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          connectMethod === 'code'
            ? { method: 'code', phone: phoneNumber, userId: session?.user?.id }
            : { method: 'qr', userId: session?.user?.id }
        ),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erro ao conectar')
        toast.error(json.error || 'Erro ao conectar')
      }
    } catch {
      toast.error('Erro ao conectar')
    }
    setConnecting(false)
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' })
      toast.success('WhatsApp desconectado')
    } catch {
      toast.error('Erro ao desconectar')
    }
    setDisconnecting(false)
  }

  const handleToggleAI = async () => {
    setTogglingAi(true)
    try {
      const res = await fetch('/api/whatsapp/toggle-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (res.ok) {
        setAiMode(json.data?.aiMode || false)
        toast.success(json.data?.aiMode ? 'IA ativada no WhatsApp' : 'IA desativada no WhatsApp')
      }
    } catch {
      toast.error('Erro ao alternar IA')
    }
    setTogglingAi(false)
  }

  const handleSendTest = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      toast.error('Preencha telefone e mensagem')
      return
    }
    setSendingTest(true)
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: testMessage }),
      })
      if (res.ok) toast.success('Mensagem enviada!')
      else {
        const json = await res.json()
        toast.error(json.error || 'Erro ao enviar')
      }
    } catch {
      toast.error('Erro ao enviar')
    }
    setSendingTest(false)
  }

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode)
      toast.success('Código copiado!')
    }
  }

  const statusBadge = () => {
    switch (status) {
      case 'connected': return <Badge variant="success">Conectado</Badge>
      case 'connecting': return <Badge variant="warning">Conectando...</Badge>
      default: return <Badge variant="secondary">Desconectado</Badge>
    }
  }

  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latencyMs: number } | null>>({})
  const [testing, setTesting] = useState<string | null>(null)

  const runTest = async (service: string) => {
    setTesting(service)
    try {
      const res = await fetch('/api/settings/test-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service }),
      })
      const json = await res.json()
      setTestResults(prev => ({ ...prev, [service]: json.data || { success: false, message: 'Erro', latencyMs: 0 } }))
    } catch {
      setTestResults(prev => ({ ...prev, [service]: { success: false, message: 'Erro', latencyMs: 0 } }))
    }
    setTesting(null)
  }

  const integrations = [
    { key: 'whatsapp', icon: '🟢', name: 'WhatsApp', desc: 'Mensageria e atendimento', envVar: null, configured: true },
    { key: 'email', icon: '✉️', name: 'Resend', desc: 'Envio de emails transacionais', envVar: 'RESEND_API_KEY', configured: !!process.env.NEXT_PUBLIC_HAS_EMAIL || true },
    { key: 'stripe', icon: '💳', name: 'Stripe', desc: 'Processamento de pagamentos', envVar: 'STRIPE_SECRET_KEY', configured: !!process.env.NEXT_PUBLIC_HAS_STRIPE || !!process.env.STRIPE_SECRET_KEY },
    { key: 'anthropic', icon: '🤖', name: 'Anthropic', desc: 'IA Claude para geracao de conteudo', envVar: 'ANTHROPIC_API_KEY', configured: !!process.env.NEXT_PUBLIC_HAS_ANTHROPIC || !!process.env.ANTHROPIC_API_KEY },
    { key: 'deepseek', icon: '🧠', name: 'DeepSeek', desc: 'IA para analise e transcricao', envVar: 'DEEPSEEK_API_KEY', configured: !!process.env.NEXT_PUBLIC_HAS_DEEPSEEK || !!process.env.DEEPSEEK_API_KEY },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto animate-page-enter">
      <button onClick={() => router.push('/settings')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-base">
        <ArrowLeft className="h-4 w-4" /> Voltar para configurações
      </button>

      <div>
        <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Integracoes</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-1">Gerencie as integracoes da plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map(integration => {
          const result = testResults[integration.key]
          const isTesting = testing === integration.key
          return (
            <Card key={integration.key} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{integration.icon}</span>
                    <div>
                      <p className="text-[13px] font-[500]">{integration.name}</p>
                      <p className="text-[11px] text-[var(--text-3)]">{integration.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {integration.configured ? (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--success)]">
                        <ShieldCheck className="h-3 w-3" /> Configurado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--text-3)]">
                        <AlertCircle className="h-3 w-3" /> Nao configurado
                      </span>
                    )}
                  </div>
                </div>
                {result && (
                  <div className={`p-2 rounded-md text-[11px] ${result.success ? 'bg-[var(--success-subtle)] text-[var(--success)]' : 'bg-[var(--destructive-subtle)] text-[var(--destructive)]'}`}>
                    {result.success ? '✓' : '✗'} {result.message} ({result.latencyMs}ms)
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-[11px] gap-1"
                  onClick={() => runTest(integration.key)}
                  disabled={isTesting}
                >
                  {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                  {isTesting ? 'Testando...' : 'Testar conexao'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[var(--success)]" />
                WhatsApp Pessoal (Admin)
              </CardTitle>
              <CardDescription className="mt-1">
                Conecte seu número para receber notificações e atender clientes
              </CardDescription>
            </div>
            {statusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'connected' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--success-subtle)] border border-[var(--success)]/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--success)] animate-pulse" />
                  <p className="text-sm font-medium text-[var(--success)]">WhatsApp conectado</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-medium">IA Conversante no WhatsApp</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {aiMode ? 'A IA responde mensagens automaticamente' : 'IA desativada - mensagens manuais'}
                      </p>
                    </div>
                  </div>
                  <Switch checked={aiMode} onCheckedChange={handleToggleAI} disabled={togglingAi} />
                </div>
                {aiMode && (
                  <div className="mt-3 p-3 rounded-lg bg-[var(--accent-subtle)] border-l-[3px] border-[var(--accent)]">
                    <p className="text-xs text-[var(--text-2)]">
                      A IA está ativa no WhatsApp. Ela responde clientes, cria projetos e faz pré-cadastros automaticamente.
                      Não revela pensamentos internos, apenas respostas diretas sobre o ANDERFLOW.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-3">Conversas recentes</p>
                {recentChats.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">Nenhuma conversa recente</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {recentChats.map((chat: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--surface-2)] text-xs">
                        <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-[var(--text-3)] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[var(--text)] truncate">{chat.phone}</p>
                          <p className="text-[var(--text-3)] truncate">{chat.lastMessage}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium">Enviar mensagem manual</p>
                <Input placeholder="Telefone (55 DDD 9XXXX-XXXX)" value={testPhone} onChange={e => setTestPhone(e.target.value)} />
                <Input placeholder="Mensagem" value={testMessage} onChange={e => setTestMessage(e.target.value)} />
                <Button onClick={handleSendTest} disabled={sendingTest} size="sm">
                  {sendingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Enviar
                </Button>
              </div>

              <Button variant="outline" onClick={handleDisconnect} disabled={disconnecting} className="w-full">
                {disconnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PowerOff className="mr-2 h-4 w-4" />}
                Desconectar WhatsApp
              </Button>
            </div>
          )}

          {status === 'connecting' && method === 'qr' && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--warning)]" />
                <span className="text-[var(--warning)]">Aguardando leitura do QR Code...</span>
              </div>
              {qrCode ? (
                <div className="p-4 bg-white rounded-xl inline-block">
                  <Image src={qrCode} alt="QR Code WhatsApp" width={224} height={224} unoptimized />
                </div>
              ) : (
                <div className="flex items-center justify-center h-56">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--text-3)]" />
                </div>
              )}
              <p className="text-xs text-[var(--text-muted)]">
                Abra o WhatsApp no celular, vá em <strong>Aparelhos conectados</strong> e escaneie
              </p>
              <Button variant="ghost" size="sm" onClick={() => { handleDisconnect(); setTimeout(() => setConnectMethod('qr'), 500) }}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Novo QR Code
              </Button>
            </div>
          )}

          {status === 'connecting' && method === 'code' && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--warning)]" />
                <span className="text-[var(--warning)]">Aguardando confirmação...</span>
              </div>
              {pairingCode ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-3 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                    <span className="text-2xl font-mono font-bold tracking-[0.3em] text-[var(--text)]">{pairingCode}</span>
                    <Button variant="ghost" size="icon-sm" onClick={handleCopyCode}><Copy className="h-4 w-4" /></Button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    No WhatsApp: <strong>Aparelhos conectados</strong> &gt; <strong>Conectar com número</strong>
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-20"><Loader2 className="h-6 w-6 animate-spin text-[var(--text-3)]" /></div>
              )}
            </div>
          )}

          {status === 'disconnected' && (
            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[var(--destructive-subtle)] border border-[var(--destructive)]/20">
                  <p className="text-xs text-[var(--destructive)]">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setConnectMethod('qr')}
                  className={`flex-1 p-4 rounded-xl border text-center transition-all ${connectMethod === 'qr' ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] hover:border-[var(--border-2)]'}`}>
                  <QrCode className={`h-6 w-6 mx-auto mb-2 ${connectMethod === 'qr' ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'}`} />
                  <p className={`text-sm font-medium ${connectMethod === 'qr' ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>QR Code</p>
                  <p className="text-2xs text-[var(--text-3)] mt-1">Escanear código</p>
                </button>
                <button onClick={() => setConnectMethod('code')}
                  className={`flex-1 p-4 rounded-xl border text-center transition-all ${connectMethod === 'code' ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' : 'border-[var(--border)] hover:border-[var(--border-2)]'}`}>
                  <Link2 className={`h-6 w-6 mx-auto mb-2 ${connectMethod === 'code' ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'}`} />
                  <p className={`text-sm font-medium ${connectMethod === 'code' ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>Código</p>
                  <p className="text-2xs text-[var(--text-3)] mt-1">Copiar e colar</p>
                </button>
              </div>

              {connectMethod === 'code' && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-[var(--text)]">Seu número de telefone com DDD</label>
                  <Input placeholder="55 11 912345678" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                </div>
              )}

              <Button onClick={handleConnect} disabled={connecting || (connectMethod === 'code' && !phoneNumber.trim())} className="w-full">
                {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                {connecting ? 'Conectando...' : 'Conectar WhatsApp'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Como funciona</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-[var(--text-2)]">
            <p className="text-xs">Conecte o WhatsApp do administrador. Com a IA ativada, os clientes poderão:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Tirar dúvidas sobre a plataforma ANDERFLOW</li>
              <li>Solicitar novos projetos via WhatsApp</li>
              <li>Fazer pré-cadastro respondendo perguntas da IA</li>
              <li>Receber notificações automáticas dos projetos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
