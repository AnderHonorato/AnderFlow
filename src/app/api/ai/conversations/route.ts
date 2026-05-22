import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const conversations = await prisma.aiConversation.findMany({
      where: { userId: user.id },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({
      data: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        preview: c.messages[0]?.content?.slice(0, 60) || '',
      })),
    })
  } catch (e) {
    console.error('[AI conversations GET]', e)
    return NextResponse.json({ data: [], error: 'Erro ao buscar conversas' }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const body = await request.json()
    const { title } = body || {}

    const existing = await prisma.user.findUnique({ where: { id: user.id } })
    if (!existing) {
      await prisma.user.create({
        data: {
          id: user.id,
          name: user.name || 'Usuario',
          email: user.email || `${user.id}@anderflow.local`,
        },
      })
    }

    const conversation = await prisma.aiConversation.create({
      data: {
        userId: user.id,
        title: title || 'Nova conversa',
      },
    })

    return NextResponse.json({ data: conversation }, { status: 201 })
  } catch (e) {
    console.error('[AI conversations POST]', e)
    return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
  }
}
