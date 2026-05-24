'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2, Webhook, RefreshCw, ExternalLink, Check } from 'lucide-react'
import crypto from 'crypto'

const WEBHOOK_EVENTS = [
  { id: 'project_created', label: 'Projeto criado' },
  { id: 'project_completed', label: 'Projeto concluído' },
  { id: 'ticket_created', label: 'Ticket criado' },
  { id: 'invoice_paid', label: 'Fatura paga' },
  { id: 'contract_signed', label: 'Contrato assinado' },
  { id: 'client_created', label: 'Cliente criado' },
]

export default function WebhooksSettingsPage() {
  const [endpoints, setEndpoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<Record<string, boolean>>({})

  const loadEndpoints = async () => {
    try {
      const res = await fetch('/api/webhooks/config')
      const json = await res.json()
      setEndpoints(json.data || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadEndpoints() }, [])

  const handleCreate = async () => {
    if (!url.trim() || selectedEvents.length === 0) {
      toast.error('URL e pelo menos um evento são obrigatórios')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/webhooks/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), secret: secret || undefined, events: selectedEvents }),
      })
      if (res.ok) {
        toast.success('Webhook criado!')
        loadEndpoints()
        handleClose()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao criar webhook')
      }
    } catch {
      toast.error('Erro ao criar webhook')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/webhooks/config?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEndpoints(prev => prev.filter(e => e.id !== id))
        toast.success('Webhook removido')
      }
    } catch {
      toast.error('Erro ao remover webhook')
    }
  }

  const handleTest = async (endpoint: any) => {
    setTesting(prev => ({ ...prev, [endpoint.id]: true }))
    try {
      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Event': 'test',
          'X-Signature': crypto.createHmac('sha256', endpoint.secret).update(JSON.stringify({ test: true })).digest('hex'),
        },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      })
      if (res.ok) {
        toast.success('Teste enviado com sucesso!')
      } else {
        toast.error(`Erro ${res.status} ao testar webhook`)
      }
    } catch {
      toast.error('Falha ao conectar ao endpoint')
    }
    setTesting(prev => ({ ...prev, [endpoint.id]: false }))
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditingId(null)
    setUrl('')
    setSecret('')
    setSelectedEvents([])
  }

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
    )
  }

  const generateSecret = () => {
    setSecret(Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''))
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500]">Webhooks</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">Configure endpoints para receber eventos em tempo real</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar endpoint
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-32 bg-[var(--surface-2)] rounded-xl animate-pulse" />)}</div>
      ) : endpoints.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Webhook className="h-8 w-8 mx-auto mb-3 text-[var(--text-3)]" />
            <p className="text-sm text-[var(--text-3)]">Nenhum webhook configurado</p>
            <p className="text-xs text-[var(--text-3)] mt-1">Adicione um endpoint para começar a receber eventos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <Card key={ep.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Webhook className="h-4 w-4 text-[var(--accent)] shrink-0" />
                      <p className="text-[14px] font-[500] text-[var(--text)] truncate">{ep.url}</p>
                      <Badge variant={ep.isActive ? 'success' : 'secondary'} className="text-2xs">
                        {ep.isActive ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ep.events.map((ev: string) => (
                        <Badge key={ev} variant="outline" className="text-2xs border-[var(--border)]">
                          {WEBHOOK_EVENTS.find(e => e.id === ev)?.label || ev}
                        </Badge>
                      ))}
                    </div>
                    {ep.deliveries?.length > 0 && (
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-[var(--text-3)]">
                        <span>Últimas entregas:</span>
                        {ep.deliveries.map((d: any) => (
                          <span key={d.id} className={`px-1.5 py-0.5 rounded ${d.success ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--destructive)]/10 text-[var(--destructive)]'}`}>
                            {d.statusCode || 'ERR'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(ep)}
                      disabled={testing[ep.id]}
                      className="h-7 text-[11px]"
                    >
                      {testing[ep.id] ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                      Testar
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(ep.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-[var(--text-3)]" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-[500]">Adicionar Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">URL do endpoint</label>
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://seuservidor.com/webhook"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-[var(--text-2)]">Secret (HMAC-SHA256)</label>
                <Button variant="ghost" size="sm" onClick={generateSecret} className="h-5 text-[10px]">Gerar aleatório</Button>
              </div>
              <Input
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="Chave secreta para assinatura"
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Eventos</label>
              <div className="grid grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map((ev) => (
                  <label
                    key={ev.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-xs ${
                      selectedEvents.includes(ev.id)
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--text)]'
                        : 'border-[var(--border)] text-[var(--text-3)] hover:border-[var(--text-3)]'
                    }`}
                  >
                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selectedEvents.includes(ev.id)
                        ? 'bg-[var(--accent)] border-[var(--accent)]'
                        : 'border-[var(--border)]'
                    }`}>
                      {selectedEvents.includes(ev.id) && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    {ev.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving || !url.trim() || selectedEvents.length === 0}>
              {saving ? 'Criando...' : 'Adicionar endpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
