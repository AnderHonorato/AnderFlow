import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return unauthorizedResponse()

  const clientFilter = isAdmin(user) ? {} : { clientId: user.id }

  try {
    const activeProjects = await prisma.project.count({
      where: { isArchived: false, status: { notIn: ['COMPLETED', 'CANCELLED'] }, ...clientFilter },
    })
    const completedProjects = await prisma.project.count({
      where: { status: 'COMPLETED', ...clientFilter },
    })
    const totalClients = await prisma.user.count({ where: { role: 'CLIENT' } })
    const activeClients = await prisma.user.count({ where: { role: 'CLIENT', isActive: true } })

    const pendingInvoices = await prisma.invoice.aggregate({
      where: { status: { in: ['SENT', 'PENDING'] } },
      _sum: { total: true },
    })

    const paidThisMonth = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { total: true },
    })

    const allPaid = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { total: true },
    })

    const recentProjects = await prisma.project.findMany({
      where: { isArchived: false, ...clientFilter },
      include: {
        client: { select: { id: true, name: true, company: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    const unreadNotifications = await prisma.notification.count({
      where: isAdmin(user) ? { isRead: false } : { isRead: false, userId: user.id },
    })

    const conversionRate = totalClients > 0
      ? Math.round((activeProjects / totalClients) * 100)
      : 0

    return NextResponse.json({
      stats: {
        activeProjects,
        completedProjects,
        totalClients,
        activeClients,
        pendingRevenue: pendingInvoices._sum.total || 0,
        paidThisMonth: paidThisMonth._sum.total || 0,
        totalRevenue: allPaid._sum.total || 0,
        unreadNotifications,
        conversionRate,
      },
      recentProjects: recentProjects.map((p) => ({
        id: p.id,
        name: p.name,
        client: p.client.company || p.client.name,
        progress: p.progress,
        status: p.status,
      })),
    })
  } catch (error) {
    console.error('[dashboard:GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar dashboard' }, { status: 500 })
  }
}
