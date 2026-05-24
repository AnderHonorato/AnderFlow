import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const [currentRevenue, prevRevenue, currentProjects, prevProjects, currentTickets, prevTickets, currentClients, prevClients] = await Promise.all([
    prisma.invoice.aggregate({ _sum: { total: true }, where: { status: 'PAID', paidAt: { gte: currentMonthStart } } }),
    prisma.invoice.aggregate({ _sum: { total: true }, where: { status: 'PAID', paidAt: { gte: previousMonthStart, lte: previousMonthEnd } } }),
    prisma.project.count({ where: { createdAt: { gte: currentMonthStart } } }),
    prisma.project.count({ where: { createdAt: { gte: previousMonthStart, lte: previousMonthEnd } } }),
    prisma.ticket.count({ where: { status: 'RESOLVED', resolvedAt: { gte: currentMonthStart } } }),
    prisma.ticket.count({ where: { status: 'RESOLVED', resolvedAt: { gte: previousMonthStart, lte: previousMonthEnd } } }),
    prisma.user.count({ where: { createdAt: { gte: currentMonthStart } } }),
    prisma.user.count({ where: { createdAt: { gte: previousMonthStart, lte: previousMonthEnd } } }),
  ])

  const current = { revenue: currentRevenue._sum.total || 0, projects: currentProjects, tickets: currentTickets, clients: currentClients }
  const previous = { revenue: prevRevenue._sum.total || 0, projects: prevProjects, tickets: prevTickets, clients: prevClients }

  const pctChange = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100 * 10) / 10

  return NextResponse.json({
    data: {
      current,
      previous,
      changes: {
        revenue: pctChange(current.revenue, previous.revenue),
        projects: pctChange(current.projects, previous.projects),
        tickets: pctChange(current.tickets, previous.tickets),
        clients: pctChange(current.clients, previous.clients),
      },
    },
  })
}
