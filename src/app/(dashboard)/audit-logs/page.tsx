'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  Filter,
  Download,
  User,
  FolderKanban,
  CreditCard,
  Shield,
  Key,
  Settings,
  Clock,
  MoreHorizontal,
} from 'lucide-react'

const auditLogs = [
  { id: 1, user: 'Anderson', action: 'login', entity: 'Sessão', detail: 'Login realizado com sucesso', ip: '192.168.1.100', time: '5 min atrás', type: 'auth' },
  { id: 2, user: 'Maria', action: 'update', entity: 'Projeto', detail: 'E-commerce Premium - Status alterado para "Em Progresso"', ip: '192.168.1.101', time: '10 min atrás', type: 'project' },
  { id: 3, user: 'Anderson', action: 'create', entity: 'Fatura', detail: 'INV-0007 criada para TechStore - R$ 15.000', ip: '192.168.1.100', time: '30 min atrás', type: 'financial' },
  { id: 4, user: 'João', action: 'update', entity: 'Ticket', detail: 'Ticket #1246 resolvido', ip: '192.168.1.102', time: '1h atrás', type: 'ticket' },
  { id: 5, user: 'Carlos S.', action: 'login', entity: 'Sessão', detail: 'Login via Google', ip: '201.45.2.30', time: '2h atrás', type: 'auth' },
  { id: 6, user: 'Anderson', action: 'delete', entity: 'Arquivo', detail: 'Arquivo "old-draft.fig" removido', ip: '192.168.1.100', time: '3h atrás', type: 'file' },
  { id: 7, user: 'Maria', action: 'update', entity: 'Configurações', detail: 'Tema alterado para "dark"', ip: '192.168.1.101', time: '4h atrás', type: 'settings' },
  { id: 8, user: 'Ana', action: 'create', entity: 'Lead', detail: 'Novo lead "StartupXYZ" criado', ip: '192.168.1.103', time: '5h atrás', type: 'crm' },
]

function getTypeIcon(type: string) {
  switch (type) {
    case 'auth': return <Shield className="h-4 w-4 text-info" />
    case 'project': return <FolderKanban className="h-4 w-4 text-primary" />
    case 'financial': return <CreditCard className="h-4 w-4 text-success" />
    case 'ticket': return <Settings className="h-4 w-4 text-warning" />
    case 'file': return <FolderKanban className="h-4 w-4 text-muted-foreground" />
    case 'settings': return <Settings className="h-4 w-4 text-purple-500" />
    case 'crm': return <User className="h-4 w-4 text-orange-500" />
    default: return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

export default function AuditLogsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logs de Auditoria</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro completo de todas as atividades da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar logs..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  {getTypeIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{log.user}</span>
                    <Badge variant="secondary" className="text-2xs">{log.action}</Badge>
                    <span className="text-xs text-muted-foreground">{log.entity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.detail}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{log.time}</p>
                  <p className="text-2xs text-muted-foreground/60">{log.ip}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
