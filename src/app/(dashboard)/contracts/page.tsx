import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cargoEhAdmin } from '@/lib/hierarquia'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  MoreHorizontal,
  PenTool,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE': return <Badge variant="success">Ativo</Badge>
    case 'PENDING_SIGNATURE': return <Badge variant="warning">Aguardando Assinatura</Badge>
    case 'EXPIRED': return <Badge variant="secondary">Encerrado</Badge>
    case 'DRAFT': return <Badge variant="secondary">Rascunho</Badge>
    default: return null
  }
}

export default async function ContractsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/')

  const user = session.user as any
  const isAdminUser = cargoEhAdmin(user.role)

  if (!isAdminUser) redirect('/dashboard')

  const contracts = await prisma.contract.findMany({
    where: { ...(isAdminUser ? {} : { clientId: user.id }) },
    include: {
      client: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const activeCount = contracts.filter(c => c.status === 'ACTIVE').length
  const pendingCount = contracts.filter(c => c.status === 'PENDING_SIGNATURE').length
  const totalValue = contracts.reduce((sum, c) => sum + (c.value || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Contratos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Contratos digitais e assinaturas
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xl font-semibold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xl font-semibold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Aguardando</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <PenTool className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-xl font-semibold">R$ {Math.round(totalValue / 1000)}k</p>
              <p className="text-xs text-muted-foreground">Valor Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xl font-semibold">2</p>
              <p className="text-xs text-muted-foreground">Vencendo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar contratos..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {contracts.map((contract) => (
              <div key={contract.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{contract.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {contract.client.name} &middot; {contract.startDate?.toLocaleDateString('pt-BR')} - {contract.endDate?.toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">R$ {(contract.value || 0).toLocaleString('pt-BR')}</span>
                  {getStatusBadge(contract.status)}
                  {contract.autoRenew && (
                    <Badge variant="secondary" className="text-2xs">Auto-renovação</Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {contracts.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum contrato encontrado. Crie seu primeiro contrato.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
