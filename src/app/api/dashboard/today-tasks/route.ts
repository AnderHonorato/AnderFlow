import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(_request: NextRequest) {
  try {
    const user = await getSessionUser(_request)
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 86400000)

    const overdue = await prisma.task.findMany({
      where: {
        dueDate: { lt: startOfDay },
        status: { not: 'DONE' },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 10,
    })

    const todayTasks = await prisma.task.findMany({
      where: {
        dueDate: { gte: startOfDay, lte: endOfDay },
        status: { not: 'DONE' },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 20,
    })

    return NextResponse.json({ data: { overdue, today: todayTasks } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
