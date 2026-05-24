import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'dev-secret'
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }

  const now = new Date()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const activeClients = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
      isActive: true,
      isAccountActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      lastSeen: true,
    },
  })

  // For each client, find the latest activity date
  const clientActivity = await Promise.all(
    activeClients.map(async (client) => {
      const [lastMessage, lastTicket, lastProjectUpdate] = await Promise.all([
        prisma.message.findFirst({
          where: { userId: client.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
        prisma.ticket.findFirst({
          where: { creatorId: client.id },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
        prisma.project.findFirst({
          where: { clientId: client.id },
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true },
        }),
      ])

      const dates = [
        client.lastSeen,
        lastMessage?.createdAt,
        lastTicket?.createdAt,
        lastProjectUpdate?.updatedAt,
      ].filter(Boolean) as Date[]

      const lastActivity = dates.length > 0
        ? new Date(Math.max(...dates.map(d => d.getTime())))
        : null

      const daysInactive = lastActivity
        ? Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000))
        : 999

      return {
        clientId: client.id,
        name: client.name,
        email: client.email,
        company: client.company,
        lastActivity,
        daysInactive,
      }
    })
  )

  // Check for duplicates: see if we already notified recently
  const existingAlerts = await prisma.auditLog.findMany({
    where: {
      action: 'CLIENT_INACTIVITY_ALERT',
      createdAt: { gte: fourteenDaysAgo },
    },
    select: { entityId: true, createdAt: true },
  })

  const alreadyAlertedIds = new Set(existingAlerts.map(a => a.entityId))

  const alerts: { clientId: string; name: string; daysInactive: number }[] = []

  for (const activity of clientActivity) {
    if (alreadyAlertedIds.has(activity.clientId)) continue

    if (activity.daysInactive >= 30) {
      alerts.push({ clientId: activity.clientId, name: activity.name, daysInactive: activity.daysInactive })

      // Create urgent notification for all admins
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'OWNER'] }, isActive: true },
        select: { id: true },
      })

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM',
            title: `⚠️ Cliente inativo ha ${activity.daysInactive} dias`,
            message: `${activity.name}${activity.company ? ` (${activity.company})` : ''} esta sem atividade ha ${activity.daysInactive} dias.`,
          },
        })
      }

      await prisma.auditLog.create({
        data: {
          action: 'CLIENT_INACTIVITY_ALERT',
          entity: 'User',
          entityId: activity.clientId,
          description: `Alerta de inatividade: ${activity.daysInactive} dias`,
        },
      })
    } else if (activity.daysInactive >= 14) {
      alerts.push({ clientId: activity.clientId, name: activity.name, daysInactive: activity.daysInactive })

      // Info notification for admins
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'OWNER'] }, isActive: true },
        select: { id: true },
      })

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM',
            title: `Cliente inativo ha ${activity.daysInactive} dias`,
            message: `${activity.name}${activity.company ? ` (${activity.company})` : ''} esta sem atividade ha ${activity.daysInactive} dias. Considere entrar em contato.`,
          },
        })
      }

      await prisma.auditLog.create({
        data: {
          action: 'CLIENT_INACTIVITY_ALERT',
          entity: 'User',
          entityId: activity.clientId,
          description: `Alerta de inatividade: ${activity.daysInactive} dias`,
        },
      })
    }
  }

  return NextResponse.json({
    data: {
      totalClients: activeClients.length,
      inactiveClients: clientActivity.filter(c => c.daysInactive >= 14).length,
      alerts: alerts.length,
      details: clientActivity.filter(c => c.daysInactive >= 14).slice(0, 20),
    },
  })
}
