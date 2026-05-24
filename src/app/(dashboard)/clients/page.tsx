'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { AdvancedChat } from '@/components/chat/advanced-chat'
import {
  IconPlus, IconSearch, IconClient, IconProject, IconFinancial,
  IconLoader, IconArrowLeft,
} from '@/components/icons'
import { Link2, Copy, Map } from 'lucide-react'

export default function ClientsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [channel, setChannel] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', phone: '' })
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [generatingLink, setGeneratingLink] = useState(false)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(async json => {
        setClients(json.data || [])
        setLoading(false)
        if (json.data?.length > 0) {
          setSelectedClientId(json.data[0].id)
        }
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedClientId) { setChannel(null); return }
    fetch(`/api/channels?clientId=${selectedClientId}`)
      .then(r => r.json())
      .then(async json => {
        const channels = json.data || []
        if (channels.length > 0) {
          setChannel(channels[0])
        } else {
          const selectedClient = clients.find(c => c.id === selectedClientId)
          const createRes = await fetch('/api/channels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${selectedClient?.name || 'Cliente'} — ${selectedClient?.company || selectedClient?.email || ''}`,
              type: 'direct',
              clientId: selectedClientId,
            }),
          })
          const createJson = await createRes.json()
          if (createJson.data) setChannel(createJson.data)
        }
      })
      .catch(() => {})
  }, [selectedClientId, clients])

  const handleGenerateLink = async () => {
    if (!selectedClientId) return
    setGeneratingLink(true)
    try {
      const res = await fetch('/api/briefing/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClientId }),
      })
      const json = await res.json()
      if (json.data?.link) {
        const fullLink = `${window.location.origin}${json.data.link}`
        setGeneratedLink(fullLink)
        setLinkDialogOpen(true)
      } else {
        toast.error(json.error || 'Erro ao gerar link')
      }
    } catch {
      toast.error('Erro ao gerar link')
    }
    setGeneratingLink(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    toast.success('Link copiado!')
  }

  const handleCreateClient = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return
    setSaving(true)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const json = await res.json()
      toast.success('Cliente criado com sucesso!')
      setShowNew(false)
      setForm({ name: '', email: '', password: '', company: '', phone: '' })
      const updated = [...clients, json.data]
      setClients(updated)
      setSelectedClientId(json.data.id)
    } else {
      toast.error('Erro ao criar cliente')
    }
    setSaving(false)
  }

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  )

  const selectedClient = clients.find(c => c.id === selectedClientId)

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-[320px] border-r p-4 space-y-3">
          <Skeleton className="h-8 w-32" /><Skeleton className="h-9 w-full" />
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-[320px] border-r flex flex-col shrink-0">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-[500]">Clientes</h2>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => router.push('/clients/map')} className="h-7 text-[11px] gap-1">
                <Map className="w-3 h-3" /> Mapa
              </Button>
              <Button size="sm" onClick={() => setShowNew(true)} className="h-7 text-[11px]">
                <IconPlus className="w-[12px] h-[12px]" /> Novo
              </Button>
            </div>
          </div>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-[var(--text-3)]" />
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-8 text-[12px]"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filtered.length === 0 && (
              <p className="text-[12px] text-[var(--text-3)] text-center py-8">Nenhum cliente encontrado</p>
            )}
            {filtered.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left ${
                  selectedClientId === client.id
                    ? 'bg-[var(--accent-subtle)] border border-[var(--accent)]/10'
                    : 'hover:bg-[var(--surface-hover)]'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-[10px]">{client.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {client.isOnline && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[var(--success)] border-2 border-[var(--surface)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-[500] truncate">{client.name}</p>
                  <p className="text-[11px] text-[var(--text-3)] truncate">
                    {client.company || client.email}
                  </p>
                </div>
                {client.plan && client.plan !== 'BASIC' && (
                  <Badge variant="warning" className="shrink-0">{client.plan}</Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedClient ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-6 py-3 border-b shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-[9px]">{selectedClient.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-[13px] font-[500]">{selectedClient.name}</p>
                <p className="text-[11px] text-[var(--text-3)]">
                  {selectedClient.company}{selectedClient.company ? ' · ' : ''}{selectedClient.email}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleGenerateLink} disabled={generatingLink} className="h-7 text-[11px]">
                <Link2 className="mr-1 h-3 w-3" />
                {generatingLink ? 'Gerando...' : 'Link de briefing'}
              </Button>
            </div>
            <div className="flex-1 flex min-h-0">
              <div className="flex-1">
                <AdvancedChat channelId={channel?.id || null} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[13px] text-[var(--text-3)]">
            Selecione um cliente para ver o perfil e chat
          </div>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label>Nome</label>
              <Input placeholder="Nome do cliente" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="space-y-2">
              <label>Email</label>
              <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label>Senha</label>
              <Input type="password" placeholder="Senha inicial" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label>Empresa</label>
                <Input placeholder="Nome da empresa" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label>Telefone</label>
                <Input placeholder="(00) 00000-0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreateClient} disabled={saving || !form.name.trim() || !form.email.trim() || !form.password.trim()}>
              {saving && <IconLoader className="w-[14px] h-[14px] animate-spin" />}
              Criar cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link de briefing gerado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-[12px] text-[var(--text-3)]">
              Compartilhe este link com o cliente. Ele poderá preencher o briefing sem precisar de login. O link expira em 7 dias.
            </p>
            <div className="flex items-center gap-2">
              <Input value={generatedLink} readOnly className="flex-1 text-[11px] font-mono h-8" />
              <Button size="sm" onClick={handleCopyLink} className="h-8 text-[11px]">
                <Copy className="mr-1 h-3 w-3" /> Copiar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
