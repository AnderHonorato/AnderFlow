import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const messages = await prisma.message.findMany({
      include: { sender: { select: { id: true, name: true, image: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })
    return NextResponse.json({ data: messages })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await request.json()
    const { content } = body

    if (!content) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

    const message = await prisma.message.create({
      data: { content, senderId: user.id, type: 'text' },
      include: { sender: { select: { id: true, name: true, image: true, role: true } } },
    })

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao enviar' }, { status: 500 })
  }
}
