import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap, Building2 } from 'lucide-react'

const plans = [
  {
    name: 'Basic',
    price: 'R$ 197',
    period: '/mês',
    description: 'Ideal para freelancers e pequenos negócios',
    icon: Star,
    features: [
      'Até 5 projetos ativos',
      'Portal do cliente',
      'Chat básico',
      '5 GB de armazenamento',
      'Suporte por ticket',
      'Gateway de pagamento único',
      'Relatórios básicos',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    price: 'R$ 497',
    period: '/mês',
    description: 'Para agências e empresas em crescimento',
    icon: Zap,
    features: [
      'Projetos ilimitados',
      'CRM completo',
      'Chat em tempo real',
      'IA integrada',
      'Automações',
      '25 GB de armazenamento',
      'Múltiplos gateways',
      'Contratos digitais',
      'Analytics avançado',
      'Suporte prioritário',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'R$ 997',
    period: '/mês',
    description: 'Para grandes operações e múltiplos times',
    icon: Building2,
    features: [
      'Tudo do Pro',
      'White label',
      'Domínio personalizado',
      'Multi-tenant',
      'API pública',
      'Webhooks',
      'Armazenamento ilimitado',
      'Onboarding dedicado',
      'SLA garantido',
      'Gerente de conta',
      'Treinamento da equipe',
      'Integrações personalizadas',
    ],
    popular: false,
  },
]

export default function PlansPage() {
  return (
    <div className="p-6 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Planos e Preços</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Escolha o plano ideal para o seu negócio. Cancele a qualquer momento.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-[1.02]' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  Mais Popular
                </Badge>
              </div>
            )}
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                  <plan.icon className={`h-5 w-5 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="text-lg font-semibold">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div>
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full h-11"
                variant={plan.popular ? 'default' : 'outline'}
              >
                {plan.name === 'Enterprise' ? 'Falar com Vendas' : 'Começar agora'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
