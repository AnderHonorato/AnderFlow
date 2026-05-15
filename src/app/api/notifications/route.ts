import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = token.id as string
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: any = {}
    if (userId) where.userId = userId
    if (unreadOnly) where.isRead = false

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await prisma.notification.count({
      where: { ...where, isRead: false },
    })

    return NextResponse.json({ data: notifications, unreadCount })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, metadata } = body

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId e title obrigatórios' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type || 'SYSTEM',
        title,
        message: message || '',
        isRead: false,
        metadata: metadata || null,
      },
    })

    return NextResponse.json({ data: notification }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar notificação' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, userId, markAll } = body

    if (markAll && userId) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })
    } else if (ids?.length) {
      await prisma.notification.updateMany({
        where: { id: { in: ids } },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ message: 'Notificações atualizadas' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar notificações' }, { status: 500 })
  }
}
