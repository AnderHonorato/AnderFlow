import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Rocket,
  CheckCircle2,
  Circle,
  ArrowRight,
  Play,
  BookOpen,
  MessageSquare,
  Settings,
  Users,
  FolderKanban,
  CreditCard,
  Zap,
} from 'lucide-react'

const onboardingSteps = [
  { id: 1, title: 'Configurar perfil', description: 'Complete suas informações pessoais e da empresa', completed: true, icon: Settings },
  { id: 2, title: 'Adicionar equipe', description: 'Convide membros da equipe para a plataforma', completed: true, icon: Users },
  { id: 3, title: 'Criar primeiro projeto', description: 'Configure seu primeiro projeto e defina milestones', completed: true, icon: FolderKanban },
  { id: 4, title: 'Configurar pagamentos', description: 'Conecte seu gateway de pagamento preferido', completed: false, icon: CreditCard },
  { id: 5, title: 'Convidar primeiro cliente', description: 'Envie um convite para seu primeiro cliente', completed: false, icon: MessageSquare },
  { id: 6, title: 'Configurar automações', description: 'Ative automações para otimizar seu workflow', completed: false, icon: Zap },
]

const tutorials = [
  { title: 'Primeiros Passos', description: 'Aprenda o básico da plataforma em 5 minutos', duration: '5 min', type: 'video' },
  { title: 'Gestão de Projetos', description: 'Como criar e gerenciar projetos eficientemente', duration: '8 min', type: 'video' },
  { title: 'Portal do Cliente', description: 'Configure o portal para seus clientes', duration: '6 min', type: 'video' },
  { title: 'Automações', description: 'Crie workflows automáticos', duration: '10 min', type: 'video' },
  { title: 'Financeiro', description: 'Configure cobranças e faturas', duration: '7 min', type: 'video' },
  { title: 'Integrações', description: 'Conecte com suas ferramentas', duration: '5 min', type: 'article' },
]

export default function OnboardingPage() {
  const completedSteps = onboardingSteps.filter(s => s.completed).length
  const progress = (completedSteps / onboardingSteps.length) * 100

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure sua plataforma em poucos passos
          </p>
        </div>
        <Badge variant="info" className="gap-1">
          <Rocket className="h-3 w-3" />
          {completedSteps}/{onboardingSteps.length} etapas
        </Badge>
      </div>

      <Card className="bg-[var(--primary-subtle)] border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-medium">Progresso do Setup</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Complete todas as etapas para aproveitar ao máximo a plataforma
              </p>
            </div>
            <span className="text-lg font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium mb-3">Checklist de Configuração</h3>
          <Card>
            <CardContent className="p-2">
              {onboardingSteps.map((step) => (
                <div key={step.id} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${!step.completed ? 'hover:bg-muted/50 cursor-pointer' : ''}`}>
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                  {!step.completed && (
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-3">Tutoriais</h3>
          <div className="space-y-3">
            {tutorials.map((tutorial) => (
              <Card key={tutorial.title} className="card-hover cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {tutorial.type === 'video' ? (
                      <Play className="h-5 w-5 text-primary" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tutorial.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tutorial.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-2xs">{tutorial.duration}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
