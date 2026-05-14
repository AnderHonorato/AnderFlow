import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

export default function PortalContracts() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Contratos</h2>
        <p className="text-sm text-muted-foreground mt-1">Seus contratos e documentos</p>
      </div>
      <Card>
        <CardContent className="p-12 text-center space-y-3">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhum contrato disponível no momento.</p>
        </CardContent>
      </Card>
    </div>
  )
}
