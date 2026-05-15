import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sparkles, Bug, Zap, CheckCircle2 } from 'lucide-react'

const changelog = [
  {
    version: 'v2.3.0',
    date: '12 Mar 2024',
    label: 'Atual',
    type: 'current',
    changes: [
      { type: 'feature', text: 'IA para resumo de projetos e cronogramas' },
      { type: 'feature', text: 'Novo dashboard com métricas avançadas' },
      { type: 'improvement', text: 'Performance do Kanban melhorada em 40%' },
      { type: 'fix', text: 'Corrigida notificação de pagamentos duplicados' },
    ],
  },
  {
    version: 'v2.2.0',
    date: '28 Fev 2024',
    type: 'previous',
    changes: [
      { type: 'feature', text: 'Integração WhatsApp Business' },
      { type: 'feature', text: 'Assinatura digital de contratos' },
      { type: 'improvement', text: 'Novo sistema de permissões granulares' },
      { type: 'fix', text: 'Corrigido upload de arquivos grandes' },
    ],
  },
  {
    version: 'v2.1.0',
    date: '15 Fev 2024',
    type: 'previous',
    changes: [
      { type: 'feature', text: 'Pipeline de CRM com drag-and-drop' },
      { type: 'feature', text: 'Notificações push em tempo real' },
      { type: 'improvement', text: 'Redesenho completo do chat interno' },
      { type: 'fix', text: 'Ajustes de responsividade mobile' },
    ],
  },
  {
    version: 'v2.0.0',
    date: '01 Fev 2024',
    type: 'previous',
    changes: [
      { type: 'feature', text: 'Lançamento da plataforma SaaS completa' },
      { type: 'feature', text: 'Portal do cliente white-label' },
      { type: 'feature', text: 'Sistema financeiro com múltiplos gateways' },
      { type: 'feature', text: 'Gestão de projetos com Kanban e Timeline' },
    ],
  },
]

function getIcon(type: string) {
  switch (type) {
    case 'feature': return <Sparkles className="h-4 w-4 text-primary" />
    case 'improvement': return <Zap className="h-4 w-4 text-warning" />
    case 'fix': return <Bug className="h-4 w-4 text-destructive" />
    default: return <CheckCircle2 className="h-4 w-4 text-success" />
  }
}

export default function ChangelogPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-lg font-medium">Changelog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe as novidades e melhorias da plataforma
        </p>
      </div>

      <div className="space-y-1">
        {changelog.map((release, i) => (
          <div key={release.version}>
            {i > 0 && <Separator className="my-4" />}
            <div className="flex items-start gap-4">
              <div className="shrink-0 pt-0.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${release.type === 'current' ? 'bg-primary/10' : 'bg-muted'}`}>
                  <span className={`text-xs font-bold ${release.type === 'current' ? 'text-primary' : 'text-muted-foreground'}`}>
                    v
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{release.version}</h3>
                  {release.label && (
                    <Badge variant="info" className="text-2xs">{release.label}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{release.date}</span>
                </div>
                <div className="space-y-2">
                  {release.changes.map((change, j) => (
                    <div key={j} className="flex items-start gap-2">
                      {getIcon(change.type)}
                      <span className="text-sm">{change.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
