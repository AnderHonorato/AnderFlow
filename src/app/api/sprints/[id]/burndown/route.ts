import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id: sprintId } = await params

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { tasks: { orderBy: { updatedAt: 'asc' } } },
  })

  if (!sprint) return NextResponse.json({ error: 'Sprint não encontrada' }, { status: 404 })

  const tasks = sprint.tasks
  const totalTasks = tasks.length
  const start = new Date(sprint.startDate)
  const end = new Date(sprint.endDate)
  const msPerDay = 86400000
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / msPerDay) + 1

  const ideal: { date: string; remaining: number }[] = []
  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(start.getTime() + i * msPerDay)
    ideal.push({ date: d.toISOString().slice(0, 10), remaining: Math.round(totalTasks * (1 - i / totalDays)) })
  }

  const doneByDay: Record<string, number> = {}
  tasks.forEach(t => {
    if (t.status === 'DONE' || t.status === 'COMPLETED') {
      const day = (t.updatedAt || t.createdAt).toISOString().slice(0, 10)
      doneByDay[day] = (doneByDay[day] || 0) + 1
    }
  })

  const actual: { date: string; remaining: number }[] = []
  let doneSoFar = 0
  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(start.getTime() + i * msPerDay)
    const key = d.toISOString().slice(0, 10)
    doneSoFar += doneByDay[key] || 0
    actual.push({ date: key, remaining: totalTasks - doneSoFar })
  }

  return NextResponse.json({
    data: {
      ideal,
      actual,
      sprintInfo: { name: sprint.name, totalTasks, startDate: sprint.startDate, endDate: sprint.endDate },
    },
  })
}
