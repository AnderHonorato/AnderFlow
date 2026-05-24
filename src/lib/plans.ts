export const PLANS = {
  BASIC: {
    name: 'Basico',
    maxProjects: 3,
    maxStorage: '100MB',
    features: ['portal', 'tickets', 'chat'],
  },
  PRO: {
    name: 'Pro',
    maxProjects: 15,
    maxStorage: '2GB',
    features: ['portal', 'tickets', 'chat', 'api', 'whatsapp', 'analytics'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxProjects: -1,
    maxStorage: '20GB',
    features: ['all'],
  },
} as const

export type PlanKey = keyof typeof PLANS

export function getPlan(userPlan?: string | null) {
  const key = ((userPlan || 'BASIC') as PlanKey)
  return PLANS[key] || PLANS.BASIC
}

export function getPlanKey(userPlan?: string | null): PlanKey {
  const key = (userPlan || 'BASIC').toUpperCase() as PlanKey
  return PLANS[key] ? key : 'BASIC'
}
