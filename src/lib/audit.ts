import { prisma } from '@/lib/prisma'

export async function auditLog(data: {
  userId?: string
  userName?: string
  action: string
  entity: string
  entityId?: string
  description: string
}) {
  try {
    await prisma.auditLog.create({ data })
  } catch {
    // Silently fail - audit should never break the main flow
  }
}
