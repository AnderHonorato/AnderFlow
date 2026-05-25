'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Plus, Search, Zap, Play, Pause, ArrowRight,
  Mail, MessageSquare, CreditCard, Users, Clock, CheckCircle2,
  Trash2,
} from 'lucide-react'

const triggerOptions = [
  { value: 'ticket_created', label: 'Ticket criado' },
  { value: 'project_updated', label: 'Projeto atualizado' },
  { value: 'invoice_overdue', label: 'Fatura vencida' },
  { value: 'project_completed', label: 'Projeto concluído' },
]

const actionOptions = [
  { value: 'send_notification', label: 'Enviar notificação' },
  { value: 'create_task', label: 'Criar tarefa' },
  { value: 'send_chat_message', label: 'Enviar mensagem no chat' },
]

function getActionIcon(trigger: string): React.ComponentType<{ className?: string }> {
  if (trigger.includes('cliente')) return Users
  if (trigger.includes('Fatura') || trigger.includes('pagamento') || trigger.includes('invoice')) return CreditCard
  if (trigger.includes('Lead') || trigger.includes('email')) return Mail
  if (trigger.includes('Prazo') || trigger.includes('dias')) return Clock
  if (trigger.includes('conclu')) return CheckCircle2
  if (trigger.includes('Ticket') || trigger.includes('resposta')) return MessageSquare
  return Zap
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTrigger, setNewTrigger] = useState('')
  const [newActionType, setNewActionType] = useState('')
  const [actionTitle, setActionTitle] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [actionTaskTitle, setActionTaskTitle] = useState('')
  const [actionTaskDesc, setActionTaskDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const loadAutomations = async () => {
    try {
      const res = await fetch('/api/automations')
      const json = await res.json()
      setAutomations(json.data || [])
    } catch { }
    setLoading(false)
  }

  useEffect(() => { loadAutomations() }, [])

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/automations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current }),
      })
      if (res.ok) {
        setAutomations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isActive: !current } : a))
        )
        toast.success(!current ? 'Automação ativada' : 'Automação pausada')
      }
    } catch {
      toast.error('Erro ao atualizar automação')
    }
  }

  const deleteAutomation = async (id: string) => {
    try {
      const res = await fetch(`/api/automations?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAutomations((prev) => prev.filter((a) => a.id !== id))
        toast.success('Automação removida')
      }
    } catch {
      toast.error('Erro ao remover automação')
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newTrigger || !newActionType) {
      toast.error('Preencha nome, gatilho e ação')
      return
    }

    const actions: Record<string, unknown> = { type: newActionType }

    if (newActionType === 'send_notification') {
      actions.title = actionTitle || 'Notificação automática'
      actions.message = actionMessage
    } else if (newActionType === 'create_task') {
      actions.taskTitle = actionTaskTitle || 'Tarefa automática'
      actions.taskDescription = actionTaskDesc
    } else if (newActionType === 'send_chat_message') {
      actions.message = actionMessage
    }

    setSaving(true)
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          trigger: newTrigger,
          actions: [actions],
        }),
      })

      if (res.ok) {
        const json = await res.json()
        setAutomations((prev) => [json.data, ...prev])
        toast.success('Automação criada!')
        handleCloseDialog()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erro ao criar automação')
      }
    } catch {
      toast.error('Erro ao criar automação')
    }
    setSaving(false)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setNewName('')
    setNewTrigger('')
    setNewActionType('')
    setActionTitle('')
    setActionMessage('')
    setActionTaskTitle('')
    setActionTaskDesc('')
  }

  const activeCount = automations.filter((a) => a.isActive).length
  const totalRuns = automations.reduce((sum, a) => sum + (a.runCount || 0), 0)

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div><div className="h-6 w-32 bg-[var(--surface-2)] rounded animate-pulse" /><div className="h-4 w-48 bg-[var(--surface-2)] rounded mt-1 animate-pulse" /></div>
          <div className="h-8 w-36 bg-[var(--surface-2)] rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-[var(--surface-2)] rounded-xl animate-pulse" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-[var(--surface-2)] rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-[var(--text)]">Automações</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">Workflows automáticos para otimizar processos</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Nova Automação
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10"><Zap className="h-5 w-5 text-[var(--accent)]" /></div>
          <div><p className="text-xl font-semibold text-[var(--text)]">{activeCount}</p><p className="text-xs text-[var(--text-3)]">Automações Ativas</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success)]/10"><Play className="h-5 w-5 text-[var(--success)]" /></div>
          <div><p className="text-xl font-semibold text-[var(--text)]">{totalRuns}</p><p className="text-xs text-[var(--text-3)]">Execuções (total)</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--info)]/10"><Clock className="h-5 w-5 text-[var(--info)]" /></div>
          <div><p className="text-xl font-semibold text-[var(--text)]">{automations.length}</p><p className="text-xs text-[var(--text-3)]">Total de Automações</p></div>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
          <Input placeholder="Buscar automações..." className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {automations.map((automation) => {
          const actionList: any[] = (() => { try { return JSON.parse(automation.actions || '[]') } catch { return [] } })()
          const Icon = getActionIcon(automation.trigger)
          const triggerLabel = triggerOptions.find((t) => t.value === automation.trigger)?.label || automation.trigger

          return (
            <Card key={automation.id} className="hover:border-[var(--border)] transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${automation.isActive ? 'bg-[var(--accent)]/10' : 'bg-[var(--surface-2)]'}`}>
                      <Icon className={`h-5 w-5 ${automation.isActive ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text)]">{automation.name}</p>
                        {automation.isActive ? (
                          <Badge variant="success" className="text-2xs">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-2xs">Pausada</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-3)] mt-1">Gatilho: {triggerLabel}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => deleteAutomation(automation.id)}>
                    <Trash2 className="h-4 w-4 text-[var(--text-3)]" />
                  </Button>
                </div>

                {actionList.length > 0 && (
                  <div className="mt-4 space-y-1.5 pl-[52px]">
                    {actionList.map((action: any, i: number) => {
                      const actionLabel = actionOptions.find((a) => a.value === action.type)?.label || action.type
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-3)]">
                          <ArrowRight className="h-3 w-3 text-[var(--accent)]/60" />{actionLabel}
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between pl-[52px]">
                  <div className="flex items-center gap-4 text-xs text-[var(--text-3)]">
                    <span>{automation.runCount || 0} execuções</span>
                    {automation.lastRunAt && (
                      <span>Última: {new Date(automation.lastRunAt).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggleActive(automation.id, automation.isActive)}
                  >
                    {automation.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {automations.length === 0 && (
          <div className="md:col-span-2 p-8 text-center text-sm text-[var(--text-3)] border border-[var(--border)] rounded-lg">
            Nenhuma automação configurada. Crie sua primeira automação para começar.
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) handleCloseDialog() }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-[500]">Nova Automação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Nome da automação</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Notificar cliente ao criar ticket"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Gatilho</label>
              <select
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="">Selecionar gatilho...</option>
                {triggerOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Ação</label>
              <select
                value={newActionType}
                onChange={(e) => setNewActionType(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="">Selecionar ação...</option>
                {actionOptions.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            {newActionType === 'send_notification' && (
              <div className="space-y-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[var(--text-2)]">Título da notificação</label>
                  <Input value={actionTitle} onChange={(e) => setActionTitle(e.target.value)} placeholder="Ex: Seu ticket foi recebido" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[var(--text-2)]">Mensagem</label>
                  <Input value={actionMessage} onChange={(e) => setActionMessage(e.target.value)} placeholder="Use {{ticketId}}, {{projectName}} para templates" className="h-9 text-xs" />
                </div>
              </div>
            )}

            {newActionType === 'create_task' && (
              <div className="space-y-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[var(--text-2)]">Título da tarefa</label>
                  <Input value={actionTaskTitle} onChange={(e) => setActionTaskTitle(e.target.value)} placeholder="Ex: Revisar {{projectName}}" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[var(--text-2)]">Descrição</label>
                  <Input value={actionTaskDesc} onChange={(e) => setActionTaskDesc(e.target.value)} placeholder="Descrição da tarefa automática" className="h-9 text-xs" />
                </div>
              </div>
            )}

            {newActionType === 'send_chat_message' && (
              <div className="space-y-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-[var(--text-2)]">Mensagem</label>
                  <Input value={actionMessage} onChange={(e) => setActionMessage(e.target.value)} placeholder="Mensagem que será enviada no chat do projeto" className="h-9 text-xs" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleCloseDialog}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving || !newName.trim() || !newTrigger || !newActionType}>
              {saving ? 'Criando...' : 'Criar Automação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
