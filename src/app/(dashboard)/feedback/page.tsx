import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp } from 'lucide-react'

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed': return <Badge variant="success" className="text-2xs">Concluído</Badge>
    case 'in_progress': return <Badge variant="info" className="text-2xs">Em Desenvolvimento</Badge>
    case 'planned': return <Badge variant="warning" className="text-2xs">Planejado</Badge>
    case 'under_review': return <Badge variant="secondary" className="text-2xs">Em Análise</Badge>
    case 'pending': return <Badge variant="secondary" className="text-2xs">Pendente</Badge>
    default: return null
  }
}

export default async function FeedbackPage() {
  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  })

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Feedback & Roadmap</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sugestões dos clientes e status das melhorias
        </p>
      </div>

      <div className="space-y-3">
        {feedbacks.map((f) => (
          <Card key={f.id} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium">{f.title}</h3>
                    {getStatusBadge(f.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{f.content}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>por {f.user.name}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 shrink-0">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>{f.votes}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {feedbacks.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground border rounded-lg">
            Nenhum feedback cadastrado.
          </div>
        )}
      </div>
    </div>
  )
}
