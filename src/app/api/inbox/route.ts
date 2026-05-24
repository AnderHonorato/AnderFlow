import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin, unauthorizedResponse } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user || !isAdmin(user)) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('count') === 'true'

    const [notifications, tickets, messages] = await Promise.all([
      prisma.notification.findMany({
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.ticket.findMany({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { creator: { select: { name: true } } },
      }),
      prisma.message.findMany({
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { sender: { select: { name: true } } },
      }),
    ])

    const totalUnread = notifications.length + tickets.length + messages.length
    if (countOnly) return NextResponse.json({ totalUnread })

    const items = [
      ...notifications.map(n => ({ id: n.id, type: 'notification' as const, title: n.title, subtitle: n.message || '', href: n.metadata ? (() => { try { const m = JSON.parse(n.metadata || '{}'); return m.url || m.projectId ? `/projects/${m.projectId}` : '/notifications' } catch { return '/notifications' } })() : '/notifications', createdAt: n.createdAt.toISOString(), isRead: n.isRead })),
      ...tickets.map(t => ({ id: t.id, type: 'ticket' as const, title: t.title, subtitle: `${t.creator?.name || 'Cliente'} · ${t.priority || 'MEDIUM'}`, href: `/tickets/${t.id}`, createdAt: t.createdAt.toISOString(), isRead: false })),
      ...messages.map(m => ({ id: m.id, type: 'message' as const, title: m.sender?.name || 'Cliente', subtitle: m.content?.slice(0, 80) || '', href: '/clients', createdAt: m.createdAt.toISOString(), isRead: m.isRead })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ items, totalUnread })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar inbox' }, { status: 500 })
  }
}
