import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, unauthorizedResponse } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  const user = await getSessionUser()
  if (!user || (user.roleLevel || 0) < 80) return unauthorizedResponse()

  const teamMembers = await prisma.user.findMany({
    where: {
      role: { not: 'CLIENT' },
      isActive: true,
    },
    include: {
      assignedTasks: {
        where: { status: { in: ['TODO', 'IN_PROGRESS'] } },
      },
      assignedTickets: {
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      },
      timeEntries: {
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      projects: {
        where: { status: { in: ['IN_PROGRESS', 'PENDING', 'REVIEW'] } },
        select: { id: true, name: true },
      },
    },
  })

  const now = new Date()
  const members = teamMembers.map(member => {
    const overdueTasks = member.assignedTasks.filter(t => t.dueDate && new Date(t.dueDate) < now)
    const todayTasks = member.assignedTasks.filter(t => {
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      return due.toDateString() === now.toDateString()
    })
    const weeklyHours = member.timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0)

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      image: member.image,
      role: member.role,
      position: member.position,
      isOnline: member.isOnline,
      lastSeen: member.lastSeen,
      metrics: {
        projects: member.projects.map(p => ({ id: p.id, name: p.name })),
        openTickets: member.assignedTickets.length,
        totalTasks: member.assignedTasks.length,
        overdueTasks: overdueTasks.length,
        todayTasks: todayTasks.length,
        weeklyHours: Math.round(weeklyHours * 10) / 10,
      },
    }
  })

  return NextResponse.json({ data: members })
}
