import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const tasks = await prisma.task.findMany({
      where: {
        status: 'DONE',
        updatedAt: { gte: oneYearAgo },
      },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    })

    const activity: Record<string, number> = {}
    for (const t of tasks) {
      const date = t.updatedAt.toISOString().slice(0, 10)
      activity[date] = (activity[date] || 0) + 1
    }

    const counts = Object.values(activity)
    const max = counts.length > 0 ? Math.max(...counts) : 0

    return NextResponse.json({ activity, max })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar atividade' }, { status: 500 })
  }
}
