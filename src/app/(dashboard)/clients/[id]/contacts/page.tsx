'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, User, Mail, Phone } from 'lucide-react'

export default function ClientContactsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'Contato', phone: '', canAccessPortal: false })
  const [saving, setSaving] = useState(false)

  const loadContacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/client-contacts?clientId=${id}`)
      const json = await res.json()
      setContacts(json.data || [])
    } catch {}
    setLoading(false)
  }, [id])

  useEffect(() => { loadContacts() }, [id, loadContacts])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Nome e email são obrigatórios'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/client-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id, ...form }),
      })
      if (res.ok) {
        toast.success('Contato criado!')
        loadContacts()
        handleClose()
      } else { toast.error('Erro ao criar contato') }
    } catch { toast.error('Erro ao criar contato') }
    setSaving(false)
  }

  const handleDelete = async (contactId: string) => {
    try {
      await fetch(`/api/client-contacts?id=${contactId}`, { method: 'DELETE' })
      setContacts(prev => prev.filter(c => c.id !== contactId))
      toast.success('Contato removido')
    } catch { toast.error('Erro ao remover') }
  }

  const handleClose = () => {
    setDialogOpen(false)
    setForm({ name: '', email: '', role: 'Contato', phone: '', canAccessPortal: false })
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32" /></div>

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/clients/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-[17px] font-[500]">Contatos do Cliente</h1>
            <p className="text-[12px] text-[var(--text-3)] mt-1">{contacts.length} contato{contacts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar contato
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><User className="h-8 w-8 mx-auto mb-3 text-[var(--text-3)]" /><p className="text-sm text-[var(--text-3)]">Nenhum contato adicional</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {contacts.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)] shrink-0">
                    {c.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-[500] text-[var(--text)]">{c.name}</p>
                      <Badge variant="secondary" className="text-2xs">{c.role}</Badge>
                      {c.canAccessPortal && <Badge variant="success" className="text-2xs">Acesso ao portal</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-[var(--text-3)]">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                      {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-[var(--text-3)]" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) handleClose() }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-[500]">Adicionar Contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--text-2)]">Nome</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--text-2)]">Cargo</label>
                <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Contato" className="h-9 text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Email</label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contato@exemplo.com" className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Telefone</label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" className="h-9 text-xs" />
            </div>
            <div className="flex items-center justify-between py-1">
              <label className="text-[11px] text-[var(--text-2)]">Permitir acesso ao portal</label>
              <Switch checked={form.canAccessPortal} onCheckedChange={v => setForm({ ...form, canAccessPortal: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? 'Criando...' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
