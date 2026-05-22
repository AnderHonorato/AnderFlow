'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ArrowLeft, Mail, Phone, Building2, Calendar, Clock, FolderKanban, DollarSign, MessageSquare, TicketIcon, Link2, Copy } from 'lucide-react'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [generatingLink, setGeneratingLink] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients`).then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/invoices').then(r => r.json()),
      fetch('/api/messages').then(r => r.json()),
      fetch('/api/tickets').then(r => r.json()),
    ]).then(([clientsData, projectsData, invoicesData, messagesData, ticketsData]) => {
      const found = (clientsData.data || []).find((c: any) => c.id === id)
      const clientProjects = (projectsData.data || []).filter((p: any) => p.clientId === id)
      const clientInvoices = (invoicesData.data || []).filter((i: any) => i.clientId === id)
      const clientMsgs = (messagesData.data || []).filter((m: any) => m.senderId === id)
      const clientTickets = (ticketsData.data || []).filter((t: any) => t.creatorId === id)

      setClient(found)
      setProjects(clientProjects)
      setInvoices(clientInvoices)
      setMessages(clientMsgs)
      setTickets(clientTickets)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleGenerateLink = async () => {
    setGeneratingLink(true)
    try {
      const res = await fetch('/api/briefing/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id }),
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

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-48" /><Skeleton className="h-64" /></div>
  if (!client) return <div className="p-6"><Link href="/clients" className="text-primary text-sm hover:underline"><ArrowLeft className="inline h-4 w-4 mr-1" />Voltar</Link><p className="text-muted-foreground mt-4">Cliente não encontrado</p></div>

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s: number, i: any) => s + i.total, 0)
  const pendingRevenue = invoices.filter(i => i.status !== 'PAID').reduce((s: number, i: any) => s + i.total, 0)
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((s: number, p: any) => s + p.progress, 0) / projects.length) : 0

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-base">
        <ArrowLeft className="h-4 w-4" /> Voltar para clientes
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-[18px] bg-primary/10 text-3xl font-bold text-primary">
              {client.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-lg font-medium">{client.name}</h1>
                <Badge variant={client.plan === 'ENTERPRISE' ? 'default' : client.plan === 'PRO' ? 'info' : 'secondary'}>
                  {client.plan}
                </Badge>
                {client.isOnline && (
                  <Badge variant="success" className="gap-1"><span className="h-1.5 w-1.5 rounded-full bg-current" />Online</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{client.company || 'Sem empresa'}</span>
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{client.email}</span>
                {client.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{client.phone}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerateLink} disabled={generatingLink} className="ml-auto shrink-0">
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              {generatingLink ? 'Gerando...' : 'Gerar link de briefing'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/10"><FolderKanban className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xl font-semibold">{projects.length}</p><p className="text-xs text-muted-foreground">Projetos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-success/10"><DollarSign className="h-5 w-5 text-success" /></div>
          <div><p className="text-xl font-semibold">R$ {(totalRevenue / 1000).toFixed(1)}k</p><p className="text-xs text-muted-foreground">Receita Total</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
          <div><p className="text-xl font-semibold">R$ {(pendingRevenue / 1000).toFixed(1)}k</p><p className="text-xs text-muted-foreground">Pendente</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-info/10"><MessageSquare className="h-5 w-5 text-info" /></div>
          <div><p className="text-xl font-semibold">{messages.length}</p><p className="text-xs text-muted-foreground">Mensagens</p></div>
        </CardContent></Card>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Projetos ({projects.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {projects.map((p: any) => (
              <div key={p.id} className="flex items-center gap-4 p-3 rounded-[10px] hover:bg-[hsl(222,40%,10%)] transition-base">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.name}</p>
                    <Badge variant={p.status === 'COMPLETED' ? 'success' : 'info'} className="text-2xs">{p.status}</Badge>
                  </div>
                  {p.deadline && <p className="text-xs text-muted-foreground mt-0.5">Prazo: {new Date(p.deadline).toLocaleDateString('pt-BR')}</p>}
                </div>
                <Progress value={p.progress} className="w-24 h-1.5" />
                <span className="text-xs font-medium">{p.progress}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Financeiro ({invoices.length} faturas)</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {invoices.map((i: any) => (
                <div key={i.id} className="flex items-center gap-4 py-3">
                  <span className="text-sm font-mono text-muted-foreground">{i.number}</span>
                  <span className="flex-1 text-sm">{i.project?.name || 'Sem projeto'}</span>
                  <span className="text-sm font-semibold">R$ {i.total.toLocaleString('pt-BR')}</span>
                  <Badge variant={i.status === 'PAID' ? 'success' : i.status === 'OVERDUE' ? 'destructive' : 'warning'} className="text-2xs">
                    {i.status === 'PAID' ? 'Pago' : i.status === 'SENT' ? 'Pendente' : i.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {projects.length === 0 && invoices.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum projeto ou fatura para este cliente ainda.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-[var(--primary)]" />
              <h2 className="text-sm font-medium text-[var(--text)]">Link de briefing gerado</h2>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Compartilhe este link com o cliente. Ele poderá preencher o briefing sem precisar de login. O link expira em 7 dias.
            </p>
            <div className="flex items-center gap-2">
              <Input value={generatedLink} readOnly className="flex-1 text-xs font-mono h-9" />
              <Button size="sm" onClick={handleCopyLink}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
