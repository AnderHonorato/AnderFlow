'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Check, Star, Zap, Building2, Crown } from 'lucide-react'
import { PLANS, type PlanKey, getPlanKey } from '@/lib/plans'

const planCards = [
  {
    key: 'BASIC' as PlanKey,
    title: 'Basic',
    price: 'R$ 197',
    period: '/mes',
    description: 'Ideal para freelancers e pequenos negocios',
    icon: Star,
    features: [
      'Ate 3 projetos ativos',
      'Portal do cliente',
      'Tickets de suporte',
      'Chat basico',
      '100MB de armazenamento',
    ],
    popular: false,
  },
  {
    key: 'PRO' as PlanKey,
    title: 'Pro',
    price: 'R$ 497',
    period: '/mes',
    description: 'Para agencias e empresas em crescimento',
    icon: Zap,
    features: [
      'Ate 15 projetos ativos',
      'Portal do cliente',
      'Tickets & Chat',
      'API & Webhooks',
      'Integracao WhatsApp',
      'Analytics avancado',
      '2GB de armazenamento',
    ],
    popular: true,
  },
  {
    key: 'ENTERPRISE' as PlanKey,
    title: 'Enterprise',
    price: 'R$ 997',
    period: '/mes',
    description: 'Para grandes operacoes e multiplos times',
    icon: Building2,
    features: [
      'Projetos ilimitados',
      'Tudo do plano Pro',
      'White label',
      'Dominio personalizado',
      'Multi-tenant',
      'API publica & Webhooks',
      '20GB de armazenamento',
      'Onboarding dedicado',
      'SLA garantido',
      'Gerente de conta',
    ],
    popular: false,
  },
]

export default function PlansPage() {
  const { data: session } = useSession()
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [userPlan, setUserPlan] = useState<PlanKey>('BASIC')

  useEffect(() => {
    const u = session?.user as any
    if (u?.plan) setUserPlan(getPlanKey(u.plan))
  }, [session])

  const currentPlanInfo = PLANS[userPlan]

  return (
    <div className="p-6 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Planos e Precos</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Escolha o plano ideal para o seu negocio. Cancele a qualquer momento.
        </p>
        {currentPlanInfo && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/20">
            <Crown className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[13px] text-[var(--accent)] font-[500]">Seu plano atual: {currentPlanInfo.name}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
        {planCards.map((plan) => {
          const isCurrent = userPlan === plan.key
          return (
            <Card key={plan.key} className={`relative ${plan.popular ? 'ring-1 ring-[var(--accent)] scale-[1.02]' : ''} ${isCurrent ? 'ring-2 ring-[var(--success)]' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[var(--accent)] text-white px-3 py-1">Mais Popular</Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-3">
                  <Badge className="bg-[var(--success)] text-white px-3 py-1">Atual</Badge>
                </div>
              )}
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${plan.popular ? 'bg-[var(--accent-subtle)]' : 'bg-muted'}`}>
                    <plan.icon className={`h-5 w-5 ${plan.popular ? 'text-[var(--accent)]' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{plan.title}</p>
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
                      <Check className="h-4 w-4 text-[var(--success)] shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full h-11"
                  variant={isCurrent ? 'secondary' : plan.popular ? 'default' : 'outline'}
                  disabled={isCurrent}
                  onClick={() => setUpgradeOpen(true)}
                >
                  {isCurrent ? 'Plano atual' : plan.key === 'ENTERPRISE' ? 'Falar com Vendas' : 'Fazer upgrade'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Upgrade de Plano</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-[13px] text-[var(--text-2)]">
              Para alterar seu plano, entre em contato com nossa equipe. Respondemos em ate 24 horas uteis.
            </p>
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
              <p className="text-[12px] text-[var(--text)]"><strong>Email:</strong> contato@anderflow.com.br</p>
              <p className="text-[12px] text-[var(--text)]"><strong>WhatsApp:</strong> +55 (11) 99999-9999</p>
              <p className="text-[12px] text-[var(--text)]"><strong>Horario:</strong> Seg-Sex, 9h as 18h</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setUpgradeOpen(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
