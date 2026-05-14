import { prisma } from '@/lib/prisma'
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

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

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
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  {getTypeIcon(log.entity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{log.userId || 'Sistema'}</span>
                    <Badge variant="secondary" className="text-2xs">{log.action}</Badge>
                    <span className="text-xs text-muted-foreground">{log.entity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {log.createdAt.toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-2xs text-muted-foreground/60">{log.ipAddress || '-'}</p>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum log de auditoria encontrado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
