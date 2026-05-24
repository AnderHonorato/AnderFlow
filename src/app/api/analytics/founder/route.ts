import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isOwner } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isOwner(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    const [
      activeClients,
      newClientsThisMonth,
      activeProjects,
      completedThisMonth,
      revenueYTDResult,
      npsData,
      topClientsRevenue,
      totalUsers,
      alerts,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true, role: 'CLIENT' } }),
      prisma.user.count({ where: { isActive: true, role: 'CLIENT', createdAt: { gte: thisMonthStart } } }),
      prisma.project.count({ where: { status: { in: ['IN_PROGRESS', 'IN_REVIEW'] } } }),
      prisma.project.count({ where: { status: 'COMPLETED', completedAt: { gte: thisMonthStart } } }),
      prisma.invoice.aggregate({ _sum: { total: true }, where: { status: 'PAID', paidAt: { gte: yearStart } } }),
      prisma.npsResponse.aggregate({ _avg: { score: true } }),
      prisma.invoice.groupBy({
        by: ['clientId'],
        where: { status: 'PAID' },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      prisma.user.count(),
      prisma.ticket.count({ where: { priority: 'CRITICAL', status: { not: 'RESOLVED' } } }),
    ])

    // MRR calculation (invoices from this month)
    const mrrResult = await prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: 'PAID', paidAt: { gte: thisMonthStart } },
    })

    const lastMonthMrrResult = await prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: 'PAID', paidAt: { gte: lastMonthStart, lt: thisMonthStart } },
    })

    const mrr = mrrResult._sum.total || 0
    const lastMonthMrr = lastMonthMrrResult._sum.total || 0
    const mrrGrowth = lastMonthMrr > 0 ? Math.round(((mrr - lastMonthMrr) / lastMonthMrr) * 100) : 0

    const npsAverage = npsData._avg.score ? Math.round(npsData._avg.score * 10) / 10 : 0

    const revenueYTD = revenueYTDResult._sum.total || 0
    const revenueProjection = revenueYTD > 0 ? Math.round(revenueYTD * (12 / (now.getMonth() + 1)) * 100) / 100 : 0

    // Top clients with names
    const topClientIds = topClientsRevenue.map(c => c.clientId)
    const topClientsUsers = await prisma.user.findMany({
      where: { id: { in: topClientIds } },
      select: { id: true, name: true, company: true },
    })

    const topClients = topClientsRevenue.map(c => {
      const u = topClientsUsers.find(u => u.id === c.clientId)
      return {
        name: u?.company || u?.name || 'Cliente',
        revenue: c._sum.total || 0,
        projects: 0,
      }
    })

    // Get project counts for top clients
    for (const client of topClients) {
      const user = topClientsUsers.find(u => u.company === client.name || u.name === client.name)
      if (user) {
        client.projects = await prisma.project.count({ where: { clientId: user.id } })
      }
    }

    // Team utilization (simplified)
    const totalTimeEntries = await prisma.timeEntry.aggregate({
      _sum: { hours: true },
      where: { startTime: { gte: thisMonthStart } },
    })
    const teamUtilization = totalUsers > 0 ? Math.min(100, Math.round(((totalTimeEntries._sum.hours || 0) / (totalUsers * 160)) * 100)) : 0

    // CAC and LTV estimates
    const cac = revenueYTD > 0 ? Math.round((1000 * newClientsThisMonth) / Math.max(1, newClientsThisMonth)) : 0
    const ltv = activeClients > 0 ? Math.round(revenueYTD / activeClients) : 0

    const alertsList: string[] = []
    if (alerts > 0) alertsList.push(`${alerts} ticket(s) critico(s) em aberto`)
    const expiredInvoices = await prisma.invoice.count({ where: { status: 'SENT', dueDate: { lt: now } } })
    if (expiredInvoices > 0) alertsList.push(`${expiredInvoices} fatura(s) vencida(s)`)

    return NextResponse.json({
      data: {
        mrr,
        mrrGrowth,
        activeClients,
        newClientsThisMonth,
        activeProjects,
        completedThisMonth,
        npsAverage,
        revenueYTD,
        revenueProjection,
        topClients,
        teamUtilization,
        cac: 0, // Would need marketing spend data
        ltv,
        alerts: alertsList,
      },
    })
  } catch (error) {
    console.error('[founder] Error:', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}
