'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Zap,
  Play,
  Pause,
  MoreHorizontal,
  ArrowRight,
  Mail,
  MessageSquare,
  Bell,
  CreditCard,
  FileText,
  Users,
  Clock,
  CheckCircle2,
} from 'lucide-react'

const automations = [
  {
    id: '1', name: 'Boas-vindas ao Cliente', trigger: 'Novo cliente cadastrado',
    actions: ['Enviar email de boas-vindas', 'Criar canal no chat', 'Iniciar onboarding'],
    enabled: true, runs: 45, lastRun: '2h atrás', icon: Users,
  },
  {
    id: '2', name: 'Cobrança Automática', trigger: 'Fatura vencida há 3 dias',
    actions: ['Enviar email de lembrete', 'Notificar WhatsApp', 'Atualizar status'],
    enabled: true, runs: 128, lastRun: '1h atrás', icon: CreditCard,
  },
  {
    id: '3', name: 'Follow-up Comercial', trigger: 'Lead sem contato há 5 dias',
    actions: ['Enviar email follow-up', 'Criar tarefa para vendedor', 'Atualizar score'],
    enabled: true, runs: 67, lastRun: '4h atrás', icon: Mail,
  },
  {
    id: '4', name: 'Notificação de Prazo', trigger: 'Prazo em 3 dias',
    actions: ['Notificar equipe', 'Enviar email ao cliente', 'Atualizar dashboard'],
    enabled: true, runs: 92, lastRun: '30min atrás', icon: Clock,
  },
  {
    id: '5', name: 'Conclusão de Projeto', trigger: 'Projeto marcado como concluído',
    actions: ['Gerar relatório', 'Enviar pesquisa de satisfação', 'Gerar fatura final'],
    enabled: false, runs: 23, lastRun: '5d atrás', icon: CheckCircle2,
  },
  {
    id: '6', name: 'Ticket SLA', trigger: 'Ticket sem resposta há 4h',
    actions: ['Escalar para gerente', 'Notificar equipe', 'Atualizar prioridade'],
    enabled: true, runs: 34, lastRun: '6h atrás', icon: MessageSquare,
  },
]

export default function AutomationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Automações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Workflows automáticos para otimizar processos
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova Automação
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-semibold">{automations.filter(a => a.enabled).length}</p>
              <p className="text-xs text-muted-foreground">Automações Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Play className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xl font-semibold">389</p>
              <p className="text-xs text-muted-foreground">Execuções (mês)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Clock className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xl font-semibold">124h</p>
              <p className="text-xs text-muted-foreground">Tempo Economizado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar automações..." className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {automations.map((automation) => (
          <Card key={automation.id} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${automation.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <automation.icon className={`h-5 w-5 ${automation.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{automation.name}</p>
                      {automation.enabled ? (
                        <Badge variant="success" className="text-2xs">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-2xs">Pausada</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Trigger: {automation.trigger}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 space-y-1.5 pl-[52px]">
                {automation.actions.map((action, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowRight className="h-3 w-3 text-primary/60" />
                    {action}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between pl-[52px]">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{automation.runs} execuções</span>
                  <span>Última: {automation.lastRun}</span>
                </div>
                <Button variant="ghost" size="icon-sm">
                  {automation.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
