import { prisma } from '@/lib/prisma'

export const ADMIN_BADGES = {
  first_project: { icon: '🚀', name: 'Primeiro Projeto', condition: 'Criou seu primeiro projeto' },
  ten_projects: { icon: '🔟', name: 'Veterano', condition: 'Gerenciou 10 projetos' },
  fast_reply: { icon: '⚡', name: 'Resposta Rápida', condition: 'Respondeu 10 tickets em menos de 1h' },
  streak_7: { icon: '🔥', name: 'Semana de Fogo', condition: '7 dias consecutivos com atividade' },
  revenue_10k: { icon: '💰', name: 'Primeira Grande', condition: 'R$10.000 em receita no mês' },
  satisfied_clients: { icon: '⭐', name: 'Adorado', condition: 'NPS médio acima de 70' },
} as const

export type AdminBadgeType = keyof typeof ADMIN_BADGES

export async function checkAndGrantAdminBadge(userId: string, type: AdminBadgeType) {
  const existing = await prisma.adminBadge.findUnique({
    where: { userId_type: { userId, type } },
  })
  if (existing) return null

  return prisma.adminBadge.create({
    data: { userId, type },
  })
}

export async function getUserAdminBadges(userId: string) {
  return prisma.adminBadge.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' },
  })
}
