import { prisma } from '@/lib/prisma'

const ACHIEVEMENT_TYPES = [
  'first_project',
  'briefing_sent',
  'contract_signed',
  'project_halfway',
  'project_complete',
] as const

type AchievementEvent = (typeof ACHIEVEMENT_TYPES)[number]

export async function checkAndGrantAchievements(userId: string, event: AchievementEvent, projectId?: string) {
  const where: any = { userId, type: event }
  if (projectId) where.projectId = projectId

  const existing = await prisma.achievement.findFirst({ where })
  if (existing) return existing

  try {
    const achievement = await prisma.achievement.create({
      data: { userId, type: event, projectId: projectId || null },
    })
    return achievement
  } catch {
    return null
  }
}

export { ACHIEVEMENT_TYPES }
export type { AchievementEvent }
