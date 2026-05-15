import { prisma } from '@/lib/prisma'
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

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, CreditCard, Mail, Clock, CheckCircle2, MessageSquare,
}

function getActionIcon(trigger: string): React.ComponentType<{ className?: string }> {
  if (trigger.includes('cliente')) return Users
  if (trigger.includes('Fatura') || trigger.includes('pagamento')) return CreditCard
  if (trigger.includes('Lead') || trigger.includes('email')) return Mail
  if (trigger.includes('Prazo') || trigger.includes('dias')) return Clock
  if (trigger.includes('conclu')) return CheckCircle2
  if (trigger.includes('Ticket') || trigger.includes('resposta')) return MessageSquare
  return Zap
}

export default async function AutomationsPage() {
  const automations = await prisma.automation.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const activeCount = automations.filter(a => a.isActive).length
  const totalRuns = automations.reduce((sum, a) => sum + a.runCount, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Automações</h1>
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
              <p className="text-xl font-semibold">{activeCount}</p>
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
              <p className="text-xl font-semibold">{totalRuns}</p>
              <p className="text-xs text-muted-foreground">Execuções (total)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Clock className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xl font-semibold">{automations.length}</p>
              <p className="text-xs text-muted-foreground">Total de Automações</p>
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
        {automations.map((automation) => {
          const actionList: string[] = JSON.parse(automation.actions || '[]')
          const Icon = getActionIcon(automation.trigger)

          return (
            <Card key={automation.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${automation.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${automation.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{automation.name}</p>
                        {automation.isActive ? (
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

                {actionList.length > 0 && (
                  <div className="mt-4 space-y-1.5 pl-[52px]">
                    {actionList.map((action: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ArrowRight className="h-3 w-3 text-primary/60" />
                        {action}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between pl-[52px]">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{automation.runCount} execuções</span>
                    {automation.lastRunAt && (
                      <span>Última: {automation.lastRunAt.toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    {automation.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {automations.length === 0 && (
          <div className="md:col-span-2 p-8 text-center text-sm text-muted-foreground border rounded-lg">
            Nenhuma automação configurada. Crie sua primeira automação para começar.
          </div>
        )}
      </div>
    </div>
  )
}
