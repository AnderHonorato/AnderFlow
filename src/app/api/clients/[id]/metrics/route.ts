import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const { id } = await params

    const [
      projectCount,
      completedProjects,
      invoices,
      ticketCount,
      resolvedTickets,
      npsData,
      client,
    ] = await Promise.all([
      prisma.project.count({ where: { clientId: id } }),
      prisma.project.count({ where: { clientId: id, status: 'COMPLETED' } }),
      prisma.invoice.aggregate({ _sum: { total: true }, where: { clientId: id } }),
      prisma.ticket.count({ where: { creatorId: id } }),
      prisma.ticket.count({ where: { creatorId: id, status: 'RESOLVED' } }),
      prisma.npsResponse.aggregate({ _avg: { score: true }, where: { clientId: id } }),
      prisma.user.findUnique({ where: { id }, select: { lastSeen: true } }),
    ])

    const revenue = invoices._sum.total || 0
    const avgNps = npsData._avg.score || 0

    // Average response time for tickets
    const tickets = await prisma.ticket.findMany({
      where: { creatorId: id, status: 'RESOLVED' },
      select: { createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    let avgResponseTime = 0
    if (tickets.length > 0) {
      avgResponseTime = tickets.reduce((sum, t) => {
        return sum + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / 3600000
      }, 0) / tickets.length
    }

    return NextResponse.json({
      data: {
        revenue,
        projectCount,
        completedProjects,
        ticketCount,
        resolvedTickets,
        avgNps: Math.round(avgNps * 10) / 10,
        lastActivity: client?.lastSeen?.toISOString() || null,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar metricas' }, { status: 500 })
  }
}
