'use client'

import { useEffect, useState, useCallback, useRef, Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Eye, EyeOff, Plus, Trash2, Key, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react'

const PROVIDERS = [
  { key: 'deepseek', name: 'DeepSeek', icon: '🧠', color: '#4F46E5' },
  { key: 'openai', name: 'OpenAI (GPT)', icon: '🤖', color: '#10A37F' },
  { key: 'gemini', name: 'Google Gemini', icon: '💎', color: '#4285F4' },
  { key: 'claude', name: 'Anthropic Claude', icon: '🔮', color: '#D97706' },
  { key: 'mistral', name: 'Mistral AI', icon: '🌪️', color: '#F97316' },
]

type ApiKeyRow = {
  id: string
  provider: string
  label: string | null
  keyMask: string
  isActive: boolean
  priority: number
  createdAt: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newInputs, setNewInputs] = useState<Record<string, string>>({})
  const [newLabels, setNewLabels] = useState<Record<string, string>>({})
  const [addingProvider, setAddingProvider] = useState<string | null>(null)
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})
  const [decryptedKeys, setDecryptedKeys] = useState<Record<string, string>>({})
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({})
  const [verifyStatus, setVerifyStatus] = useState<Record<string, { status: 'checking' | 'ok' | 'error'; message: string }>>({})
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/api-keys')
      const json = await res.json()
      if (json.data) setKeys(json.data)
    } catch {
      toast.error('Erro ao carregar chaves')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  const handleAddClick = (provider: string) => {
    setAddingProvider(prev => prev === provider ? null : provider)
  }

  const autoSave = useCallback((provider: string) => {
    const timerKey = `save_${provider}`
    if (saveTimers.current[timerKey]) clearTimeout(saveTimers.current[timerKey])

    const keyValue = newInputs[provider]
    const labelValue = newLabels[provider] || ''

    if (!keyValue?.trim()) return

    saveTimers.current[timerKey] = setTimeout(async () => {
      setSaveStatus(prev => ({ ...prev, [provider]: 'saving' }))

      try {
        const res = await fetch('/api/admin/api-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, key: keyValue, label: labelValue || null }),
        })

        if (res.ok) {
          setSaveStatus(prev => ({ ...prev, [provider]: 'saved' }))
          setNewInputs(prev => ({ ...prev, [provider]: '' }))
          setNewLabels(prev => ({ ...prev, [provider]: '' }))
          setAddingProvider(null)
          await fetchKeys()
          toast.success('Chave salva com sucesso')
          setTimeout(() => setSaveStatus(prev => {
            const next = { ...prev }
            delete next[provider]
            return next
          }), 2500)
        } else {
          setSaveStatus(prev => ({ ...prev, [provider]: 'error' }))
          setTimeout(() => setSaveStatus(prev => {
            const next = { ...prev }
            delete next[provider]
            return next
          }), 3000)
        }
      } catch {
        setSaveStatus(prev => ({ ...prev, [provider]: 'error' }))
      }
    }, 800)
  }, [newInputs, newLabels, fetchKeys])

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current }),
      })
      if (res.ok) {
        setKeys(prev => prev.map(k => k.id === id ? { ...k, isActive: !current } : k))
        toast.success(current ? 'Chave desativada' : 'Chave ativada')
      } else {
        toast.error('Erro ao atualizar chave')
      }
    } catch {
      toast.error('Erro ao atualizar chave')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta chave permanentemente?')) return
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setKeys(prev => prev.filter(k => k.id !== id))
        toast.success('Chave removida')
      } else {
        toast.error('Erro ao remover chave')
      }
    } catch {
      toast.error('Erro ao remover chave')
    }
  }

  const handleVerify = async (id: string) => {
    setVerifyStatus(prev => ({ ...prev, [id]: { status: 'checking', message: 'Verificando...' } }))
    try {
      const res = await fetch('/api/admin/api-keys/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.status === 'ok') {
        setVerifyStatus(prev => ({ ...prev, [id]: { status: 'ok', message: json.message } }))
      } else {
        setVerifyStatus(prev => ({ ...prev, [id]: { status: 'error', message: json.message || 'Falha na verificacao' } }))
      }
    } catch {
      setVerifyStatus(prev => ({ ...prev, [id]: { status: 'error', message: 'Erro de conexao ao verificar' } }))
    }
  }

  const toggleReveal = async (id: string) => {
    if (revealedKeys[id]) {
      setRevealedKeys(prev => ({ ...prev, [id]: false }))
      return
    }

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revealId: id }),
      })
      const json = await res.json()
      if (json.key) {
        setDecryptedKeys(prev => ({ ...prev, [id]: json.key }))
        setRevealedKeys(prev => ({ ...prev, [id]: true }))
      } else {
        toast.error('Erro ao revelar chave')
      }
    } catch {
      toast.error('Erro ao revelar chave')
    }
  }

  const getKeysForProvider = (providerKey: string) =>
    keys.filter(k => k.provider === providerKey)

  const getProviderStats = (providerKey: string) => {
    const providerKeys = getKeysForProvider(providerKey)
    return {
      total: providerKeys.length,
      active: providerKeys.filter(k => k.isActive).length,
    }
  }

  const renderSaveStatus = (provider: string) => {
    const status = saveStatus[provider]
    if (status === 'saving') {
      return <span className="text-[11px] text-[var(--text-muted)] italic">salvando...</span>
    }
    if (status === 'saved') {
      return <span className="text-[11px] text-[var(--success)] font-medium">salvo automaticamente</span>
    }
    if (status === 'error') {
      return <span className="text-[11px] text-[var(--destructive)] font-medium">nao foi possivel salvar automaticamente</span>
    }
    return null
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Chaves de API</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-1">Gerencie as chaves de acesso aos provedores de IA. Apenas o Owner pode visualizar e editar.</p>
      </div>

      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="text-sm font-medium text-[var(--text)]">Seguranca</p>
            <p className="text-xs text-[var(--text-muted)]">
              As chaves sao criptografadas com AES-256-GCM usando o NEXTAUTH_SECRET como chave.
              Nunca compartilhe suas chaves de API.
            </p>
          </div>
        </div>
      </div>

      {PROVIDERS.map((provider) => {
        const providerKeys = getKeysForProvider(provider.key)
        const stats = getProviderStats(provider.key)
        const isAdding = addingProvider === provider.key

        return (
          <Card key={provider.key} className="rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{provider.icon}</span>
                  <div>
                    <CardTitle>{provider.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={stats.active > 0 ? 'success' : 'secondary'}>
                        {stats.active} ativa{stats.active !== 1 ? 's' : ''}
                      </Badge>
                      <span className="text-[11px] text-[var(--text-3)]">
                        {stats.total} chave{stats.total !== 1 ? 's' : ''} no total
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddClick(provider.key)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar chave
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {providerKeys.length === 0 && !isAdding && (
                <p className="text-xs text-[var(--text-muted)] py-2">
                  Nenhuma chave configurada para este provedor.
                </p>
              )}

              {providerKeys.map((keyRow) => (
                <Fragment key={keyRow.id}>
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5 text-[var(--text-3)] shrink-0" />
                      {keyRow.label && (
                        <span className="text-[12px] font-medium text-[var(--text)] truncate">
                          {keyRow.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[12px] font-mono text-[var(--text-2)]">
                        {revealedKeys[keyRow.id] ? decryptedKeys[keyRow.id] : keyRow.keyMask}
                      </span>
                      <button
                        onClick={() => toggleReveal(keyRow.id)}
                        className="inline-flex items-center text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                      >
                        {revealedKeys[keyRow.id] ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={keyRow.isActive}
                      onCheckedChange={() => handleToggleActive(keyRow.id, keyRow.isActive)}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleVerify(keyRow.id)}
                      disabled={verifyStatus[keyRow.id]?.status === 'checking'}
                      className="text-[var(--text-3)] hover:text-[var(--info)]"
                      title="Verificar chave"
                    >
                      {verifyStatus[keyRow.id]?.status === 'checking' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(keyRow.id)}
                      className="text-[var(--text-3)] hover:text-[var(--destructive)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {verifyStatus[keyRow.id] && (
                  <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${verifyStatus[keyRow.id].status === 'ok' ? 'text-[var(--success)]' : verifyStatus[keyRow.id].status === 'error' ? 'text-[var(--destructive)]' : 'text-[var(--text-3)]'}`}>
                    {verifyStatus[keyRow.id].status === 'ok' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : verifyStatus[keyRow.id].status === 'error' ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    <span>{verifyStatus[keyRow.id].message}</span>
                  </div>
                )}
              </Fragment>))}


              {isAdding && (
                <div className="space-y-2">
                  <Separator />
                  <div className="p-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-subtle)]">
                    <div className="space-y-2">
                      <Input
                        placeholder="Rotulo (ex: principal, backup)"
                        value={newLabels[provider.key] || ''}
                        onChange={(e) => {
                          setNewLabels(prev => ({ ...prev, [provider.key]: e.target.value }))
                        }}
                      />
                      <Input
                        placeholder="Chave de API (sera criptografada)"
                        type="password"
                        autoComplete="off"
                        value={newInputs[provider.key] || ''}
                        onChange={(e) => {
                          setNewInputs(prev => ({ ...prev, [provider.key]: e.target.value }))
                        }}
                        onBlur={() => autoSave(provider.key)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') autoSave(provider.key)
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      {renderSaveStatus(provider.key)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingProvider(null)
                          setNewInputs(prev => ({ ...prev, [provider.key]: '' }))
                          setNewLabels(prev => ({ ...prev, [provider.key]: '' }))
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <div className="text-center">
        <p className="text-[11px] text-[var(--text-3)]">
          As chaves sao armazenadas criptografadas no banco de dados.
          O ANDERFLOW nunca expoe chaves em texto plano para usuarios nao autorizados.
        </p>
      </div>
    </div>
  )
}
